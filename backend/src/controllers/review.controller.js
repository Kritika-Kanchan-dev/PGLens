const { pool } = require('../config/db');

// ─── HELPER: Recalculate Transparency Score for a PG ─────────────────────────
// Called every time a new review is added or updated
const recalculateScores = async (pg_id) => {
  try {
    // Get all approved reviews for this PG
    const reviewsResult = await pool.query(
      `SELECT hygiene_rating, food_rating, safety_rating, amenities_rating, overall_rating
       FROM reviews WHERE pg_id = $1 AND is_approved = true`,
      [pg_id]
    );

    const reviews = reviewsResult.rows;
    if (reviews.length === 0) return;

    // Calculate averages (1-5 scale → convert to 0-100)
    const avg = (field) => {
      const sum = reviews.reduce((acc, r) => acc + (r[field] || 0), 0);
      return Math.round((sum / reviews.length) * 20); // *20 converts 1-5 to 0-100
    };

    const hygiene_score   = avg('hygiene_rating');
    const food_score      = avg('food_rating');
    const safety_score    = avg('safety_rating');
    const amenities_score = avg('amenities_rating');
    const overall_score   = avg('overall_rating');

    // Get PG rent for price fairness calculation
    const pgResult = await pool.query(
      'SELECT monthly_rent, city FROM pgs WHERE id = $1', [pg_id]
    );
    const pg = pgResult.rows[0];

    // Price fairness — compare against city average
    const cityAvgResult = await pool.query(
      `SELECT AVG(monthly_rent) as avg_rent FROM pgs
       WHERE city = $1 AND status = 'approved' AND is_active = true`,
      [pg.city]
    );
    const cityAvg = Math.round(cityAvgResult.rows[0].avg_rent || pg.monthly_rent);
    const fair_price_estimate = cityAvg;
    const price_difference = pg.monthly_rent - cityAvg;

    // Price label logic
    let price_label = 'fair';
    const diffPercent = (price_difference / cityAvg) * 100;
    if (diffPercent > 10) price_label = 'overpriced';
    else if (diffPercent < -10) price_label = 'underpriced';

    // Pricing score (100 = exactly fair, less if overpriced)
    const pricing_score = Math.max(0, Math.min(100, Math.round(100 - Math.abs(diffPercent))));

    // Final weighted overall score
    // Hygiene(30%) + Safety(25%) + Food(20%) + Amenities(15%) + Pricing(10%)
    const weighted_score = Math.round(
      hygiene_score   * 0.30 +
      safety_score    * 0.25 +
      food_score      * 0.20 +
      amenities_score * 0.15 +
      pricing_score   * 0.10
    );

    // Update transparency_scores table
    await pool.query(`
      INSERT INTO transparency_scores
        (pg_id, overall_score, hygiene_score, food_score, safety_score,
         amenities_score, pricing_score, fair_price_estimate,
         price_difference, price_label, total_reviews_used, last_calculated)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
      ON CONFLICT (pg_id) DO UPDATE SET
        overall_score       = EXCLUDED.overall_score,
        hygiene_score       = EXCLUDED.hygiene_score,
        food_score          = EXCLUDED.food_score,
        safety_score        = EXCLUDED.safety_score,
        amenities_score     = EXCLUDED.amenities_score,
        pricing_score       = EXCLUDED.pricing_score,
        fair_price_estimate = EXCLUDED.fair_price_estimate,
        price_difference    = EXCLUDED.price_difference,
        price_label         = EXCLUDED.price_label,
        total_reviews_used  = EXCLUDED.total_reviews_used,
        last_calculated     = NOW()
    `, [
      pg_id, weighted_score, hygiene_score, food_score, safety_score,
      amenities_score, pricing_score, fair_price_estimate,
      price_difference, price_label, reviews.length
    ]);

    // Also update scores in pgs table for quick access
    await pool.query(`
      UPDATE pgs SET
        overall_score = $1, hygiene_score = $2, food_score = $3,
        safety_score = $4, amenities_score = $5, pricing_score = $6,
        fair_price_estimate = $7, total_reviews = $8
      WHERE id = $9
    `, [
      weighted_score, hygiene_score, food_score, safety_score,
      amenities_score, pricing_score, fair_price_estimate,
      reviews.length, pg_id
    ]);

    // Update pg_claims match status based on review ratings
    await updateClaimsStatus(pg_id, reviews);

  } catch (err) {
    console.error('recalculateScores error:', err.message);
  }
};

// ─── HELPER: Update Claim vs Reality status ───────────────────────────────────
const updateClaimsStatus = async (pg_id, reviews) => {
  try {
    const claims = await pool.query(
      'SELECT * FROM pg_claims WHERE pg_id = $1', [pg_id]
    );

    for (const claim of claims.rows) {
      // Average amenities rating as proxy for claim verification
      const avgAmenities = reviews.reduce((acc, r) => acc + (r.amenities_rating || 0), 0) / reviews.length;
      const avg_rating = Math.round(avgAmenities * 10) / 10;

      // Match if avg rating >= 3.5, mismatch if < 2.5
      let match_status = 'unverified';
      if (reviews.length >= 2) {
        match_status = avgAmenities >= 3.5 ? 'match' : 'mismatch';
      }

      await pool.query(
        'UPDATE pg_claims SET avg_rating = $1, match_status = $2 WHERE id = $3',
        [avg_rating, match_status, claim.id]
      );
    }
  } catch (err) {
    console.error('updateClaimsStatus error:', err.message);
  }
};

// ─── SUBMIT REVIEW ────────────────────────────────────────────────────────────
// POST /api/reviews
// Only verified residents can submit reviews
const submitReview = async (req, res) => {
  try {
    const student_id = req.user.id;
    const {
      pg_id, hygiene_rating, food_rating, safety_rating,
      amenities_rating, overall_rating, review_text, is_anonymous
    } = req.body;

    // Validate required fields
    if (!pg_id || !hygiene_rating || !food_rating || !safety_rating || !amenities_rating || !overall_rating) {
      return res.status(400).json({ message: 'PG ID and all ratings are required' });
    }

    // Check if PG exists and is approved
    const pgCheck = await pool.query(
      `SELECT id FROM pgs WHERE id = $1 AND status = 'approved'`, [pg_id]
    );
    if (pgCheck.rows.length === 0) {
      return res.status(404).json({ message: 'PG not found or not approved' });
    }

    // Check if student is a verified resident of this PG
    const verificationCheck = await pool.query(
      `SELECT id FROM residency_verifications
       WHERE student_id = $1 AND pg_id = $2 AND status = 'approved'`,
      [student_id, pg_id]
    );
    if (verificationCheck.rows.length === 0) {
      return res.status(403).json({
        message: 'Only verified residents can submit reviews. Please verify your residency first.'
      });
    }

    // Check if already reviewed
    const existingReview = await pool.query(
      'SELECT id FROM reviews WHERE student_id = $1 AND pg_id = $2',
      [student_id, pg_id]
    );
    if (existingReview.rows.length > 0) {
      return res.status(409).json({ message: 'You have already reviewed this PG' });
    }

    // Insert review
    const result = await pool.query(`
      INSERT INTO reviews
        (pg_id, student_id, hygiene_rating, food_rating, safety_rating,
         amenities_rating, overall_rating, review_text, is_anonymous)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
    `, [
      pg_id, student_id, hygiene_rating, food_rating, safety_rating,
      amenities_rating, overall_rating, review_text || null,
      is_anonymous !== false // default to anonymous
    ]);

    // Recalculate transparency scores
    await recalculateScores(pg_id);

    res.status(201).json({
      message: 'Review submitted successfully',
      review: result.rows[0]
    });
  } catch (err) {
    console.error('submitReview error:', err.message);
    res.status(500).json({ message: 'Server error while submitting review' });
  }
};

// ─── GET REVIEWS FOR A PG ────────────────────────────────────────────────────
// GET /api/reviews/pg/:pg_id
const getPGReviews = async (req, res) => {
  try {
    const { pg_id } = req.params;

    const result = await pool.query(`
      SELECT
        r.id,
        r.hygiene_rating, r.food_rating, r.safety_rating,
        r.amenities_rating, r.overall_rating,
        r.review_text, r.is_anonymous,
        r.owner_reply, r.replied_at,
        r.created_at,
        CASE WHEN r.is_anonymous = true THEN 'Anonymous' ELSE u.name END as reviewer_name,
        'Verified Resident' as reviewer_label
      FROM reviews r
      LEFT JOIN users u ON u.id = r.student_id
      WHERE r.pg_id = $1 AND r.is_approved = true
      ORDER BY r.created_at DESC
    `, [pg_id]);

    res.status(200).json({ reviews: result.rows });
  } catch (err) {
    console.error('getPGReviews error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET TRANSPARENCY SCORECARD ───────────────────────────────────────────────
// GET /api/reviews/scorecard/:pg_id
const getScorecard = async (req, res) => {
  try {
    const { pg_id } = req.params;

    const result = await pool.query(`
      SELECT ts.*, p.name as pg_name, p.monthly_rent
      FROM transparency_scores ts
      JOIN pgs p ON p.id = ts.pg_id
      WHERE ts.pg_id = $1
    `, [pg_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Scorecard not found' });
    }

    // Get claims with match status
    const claims = await pool.query(
      'SELECT * FROM pg_claims WHERE pg_id = $1', [pg_id]
    );

    res.status(200).json({
      scorecard: result.rows[0],
      claims: claims.rows
    });
  } catch (err) {
    console.error('getScorecard error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── OWNER REPLY TO REVIEW ────────────────────────────────────────────────────
// POST /api/reviews/:id/reply
const replyToReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;
    const owner_id = req.user.id;

    if (!reply) {
      return res.status(400).json({ message: 'Reply text is required' });
    }

    // Make sure this review belongs to owner's PG
    const check = await pool.query(`
      SELECT r.id FROM reviews r
      JOIN pgs p ON p.id = r.pg_id
      WHERE r.id = $1 AND p.owner_id = $2
    `, [id, owner_id]);

    if (check.rows.length === 0) {
      return res.status(403).json({ message: 'Not authorized to reply to this review' });
    }

    const result = await pool.query(`
      UPDATE reviews SET owner_reply = $1, replied_at = NOW()
      WHERE id = $2 RETURNING *
    `, [reply, id]);

    res.status(200).json({
      message: 'Reply posted successfully',
      review: result.rows[0]
    });
  } catch (err) {
    console.error('replyToReview error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── ADMIN: FLAG / UNFLAG REVIEW ──────────────────────────────────────────────
// PATCH /api/reviews/:id/flag
const flagReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_approved } = req.body;

    const result = await pool.query(
      'UPDATE reviews SET is_flagged = true, is_approved = $1 WHERE id = $2 RETURNING *',
      [is_approved !== false, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Recalculate scores after moderation
    await recalculateScores(result.rows[0].pg_id);

    res.status(200).json({ message: 'Review moderated successfully', review: result.rows[0] });
  } catch (err) {
    console.error('flagReview error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── SUBMIT RESIDENCY VERIFICATION ───────────────────────────────────────────
// POST /api/reviews/verify-residency
const submitResidencyVerification = async (req, res) => {
  try {
    const student_id = req.user.id;
    const { pg_id, proof_url } = req.body;

    if (!pg_id || !proof_url) {
      return res.status(400).json({ message: 'PG ID and proof URL are required' });
    }

    // Check if already submitted
    const existing = await pool.query(
      'SELECT id, status FROM residency_verifications WHERE student_id = $1 AND pg_id = $2',
      [student_id, pg_id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        message: `Verification already ${existing.rows[0].status}`,
        status: existing.rows[0].status
      });
    }

    const result = await pool.query(`
      INSERT INTO residency_verifications (student_id, pg_id, proof_url)
      VALUES ($1, $2, $3) RETURNING *
    `, [student_id, pg_id, proof_url]);

    res.status(201).json({
      message: 'Residency verification submitted. Pending admin approval.',
      verification: result.rows[0]
    });
  } catch (err) {
    console.error('submitResidencyVerification error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── ADMIN: APPROVE / REJECT RESIDENCY ───────────────────────────────────────
// PATCH /api/reviews/verify-residency/:id
const updateResidencyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const admin_id = req.user.id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }

    const result = await pool.query(`
      UPDATE residency_verifications
      SET status = $1, reviewed_by = $2, reviewed_at = NOW()
      WHERE id = $3 RETURNING *
    `, [status, admin_id, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Verification request not found' });
    }

    // If approved → mark student as verified in users table
    if (status === 'approved') {
      await pool.query(
        'UPDATE users SET is_verified = true WHERE id = $1',
        [result.rows[0].student_id]
      );
    }

    res.status(200).json({
      message: `Residency ${status} successfully`,
      verification: result.rows[0]
    });
  } catch (err) {
    console.error('updateResidencyStatus error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── ADMIN: GET ALL PENDING VERIFICATIONS ────────────────────────────────────
// GET /api/reviews/verify-residency/pending
const getPendingVerifications = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        rv.*,
        u.name as student_name, u.email as student_email,
        p.name as pg_name
      FROM residency_verifications rv
      JOIN users u ON u.id = rv.student_id
      JOIN pgs p ON p.id = rv.pg_id
      WHERE rv.status = 'pending'
      ORDER BY rv.submitted_at ASC
    `);

    res.status(200).json({ verifications: result.rows });
  } catch (err) {
    console.error('getPendingVerifications error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  submitReview, getPGReviews, getScorecard,
  replyToReview, flagReview,
  submitResidencyVerification, updateResidencyStatus, getPendingVerifications
};