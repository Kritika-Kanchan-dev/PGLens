const { pool } = require('../config/db');

// ─── CREATE PG ───────────────────────────────────────────────────────────────
// POST /api/pgs
// Only owners can create PGs
const createPG = async (req, res) => {
  try {
    const owner_id = req.user.id;
    const {
      name, description, location, city, latitude, longitude,
      monthly_rent, room_type, total_rooms,
      has_wifi, has_ac, has_meals, has_laundry, has_parking,
      has_security, has_gym, has_hot_water, has_tv,
      claims // array of strings e.g. ["24/7 Hot Water", "Daily Cleaning"]
    } = req.body;

    // Validate required fields
    if (!name || !location || !city || !monthly_rent) {
      return res.status(400).json({ message: 'Name, location, city and monthly rent are required' });
    }

    // Insert PG
    const result = await pool.query(
      `INSERT INTO pgs (
        owner_id, name, description, location, city, latitude, longitude,
        monthly_rent, room_type, total_rooms,
        has_wifi, has_ac, has_meals, has_laundry, has_parking,
        has_security, has_gym, has_hot_water, has_tv,
        status
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,$19,
        'pending'
      ) RETURNING *`,
      [
        owner_id, name, description || null, location, city,
        latitude || null, longitude || null,
        monthly_rent, room_type || 'single', total_rooms || 1,
        has_wifi || false, has_ac || false, has_meals || false,
        has_laundry || false, has_parking || false, has_security || false,
        has_gym || false, has_hot_water || false, has_tv || false
      ]
    );

    const pg = result.rows[0];

    // Insert owner claims if provided
    if (claims && claims.length > 0) {
      for (const claim of claims) {
        await pool.query(
          'INSERT INTO pg_claims (pg_id, claim_text) VALUES ($1, $2)',
          [pg.id, claim]
        );
      }
    }

    // Create empty transparency score row
    await pool.query(
      'INSERT INTO transparency_scores (pg_id) VALUES ($1) ON CONFLICT (pg_id) DO NOTHING',
      [pg.id]
    );

    res.status(201).json({
      message: 'PG submitted successfully. Pending admin approval.',
      pg
    });
  } catch (err) {
    console.error('createPG error:', err.message);
    res.status(500).json({ message: 'Server error while creating PG' });
  }
};

// ─── GET ALL PGS (with filters) ──────────────────────────────────────────────
// GET /api/pgs?city=Bangalore&min_rent=3000&max_rent=20000&room_type=single&verified=true&sort=best_rated
const getAllPGs = async (req, res) => {
  try {
    const {
      city, min_rent, max_rent, room_type,
      verified, has_ac, has_meals, has_wifi,
      sort, search, page = 1, limit = 10
    } = req.query;

    let conditions = [`p.status = 'approved'`, `p.is_active = true`];
    let params = [];
    let paramCount = 1;

    if (city) {
      conditions.push(`LOWER(p.city) LIKE LOWER($${paramCount++})`);
      params.push(`%${city}%`);
    }
    if (search) {
      conditions.push(`(LOWER(p.name) LIKE LOWER($${paramCount}) OR LOWER(p.location) LIKE LOWER($${paramCount}))`);
      params.push(`%${search}%`);
      paramCount++;
    }
    if (min_rent) {
      conditions.push(`p.monthly_rent >= $${paramCount++}`);
      params.push(parseInt(min_rent));
    }
    if (max_rent) {
      conditions.push(`p.monthly_rent <= $${paramCount++}`);
      params.push(parseInt(max_rent));
    }
    if (room_type && room_type !== 'all') {
      conditions.push(`p.room_type = $${paramCount++}`);
      params.push(room_type);
    }
    if (has_ac === 'true') { conditions.push(`p.has_ac = true`); }
    if (has_meals === 'true') { conditions.push(`p.has_meals = true`); }
    if (has_wifi === 'true') { conditions.push(`p.has_wifi = true`); }

    // Sort options
    let orderBy = 'ts.overall_score DESC'; // default: best rated
    if (sort === 'price_low') orderBy = 'p.monthly_rent ASC';
    if (sort === 'price_high') orderBy = 'p.monthly_rent DESC';
    if (sort === 'newest') orderBy = 'p.created_at DESC';
    if (sort === 'most_reviewed') orderBy = 'p.total_reviews DESC';

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = conditions.join(' AND ');

    // Main query — join with transparency_scores and first image
    const query = `
      SELECT
        p.*,
        ts.overall_score, ts.hygiene_score, ts.food_score,
        ts.safety_score, ts.pricing_score, ts.price_label,
        ts.fair_price_estimate,
        (SELECT image_url FROM pg_images WHERE pg_id = p.id AND is_primary = true LIMIT 1) as primary_image,
        u.name as owner_name
      FROM pgs p
      LEFT JOIN transparency_scores ts ON ts.pg_id = p.id
      LEFT JOIN users u ON u.id = p.owner_id
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    params.push(parseInt(limit), offset);
    const result = await pool.query(query, params);

    // Count total for pagination
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM pgs p WHERE ${whereClause}`,
      params.slice(0, -2)
    );
    const total = parseInt(countResult.rows[0].count);

    res.status(200).json({
      pgs: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('getAllPGs error:', err.message);
    res.status(500).json({ message: 'Server error while fetching PGs' });
  }
};

// ─── GET SINGLE PG DETAILS ───────────────────────────────────────────────────
// GET /api/pgs/:id
const getPGById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get PG with scores and owner info
    const pgResult = await pool.query(`
      SELECT
        p.*,
        ts.overall_score, ts.hygiene_score, ts.food_score,
        ts.safety_score, ts.amenities_score, ts.pricing_score,
        ts.price_label, ts.fair_price_estimate, ts.price_difference,
        u.name as owner_name, u.email as owner_email
      FROM pgs p
      LEFT JOIN transparency_scores ts ON ts.pg_id = p.id
      LEFT JOIN users u ON u.id = p.owner_id
      WHERE p.id = $1 AND p.is_active = true
    `, [id]);

    if (pgResult.rows.length === 0) {
      return res.status(404).json({ message: 'PG not found' });
    }

    const pg = pgResult.rows[0];

    // Get all images
    const imagesResult = await pool.query(
      'SELECT * FROM pg_images WHERE pg_id = $1 ORDER BY is_primary DESC',
      [id]
    );

    // Get claims with their verification status
    const claimsResult = await pool.query(
      'SELECT * FROM pg_claims WHERE pg_id = $1',
      [id]
    );

    // Get reviews (anonymous)
    // Get reviews (anonymous)
    const reviewsResult = await pool.query(`
      SELECT
        r.id, r.hygiene_rating, r.food_rating, r.safety_rating,
        r.amenities_rating, r.overall_rating, r.review_text,
        r.is_anonymous, r.owner_reply, r.replied_at, r.created_at,
        r.sentiment, r.sentiment_score, r.nlp_keywords, r.nlp_topics, r.nlp_analysed,
        CASE WHEN r.is_anonymous = true THEN 'Anonymous' ELSE u.name END as reviewer_name,
        CASE WHEN r.is_anonymous = false THEN 'Verified Resident' ELSE 'Verified Resident' END as reviewer_label
      FROM reviews r
      LEFT JOIN users u ON u.id = r.student_id
      WHERE r.pg_id = $1 AND r.is_approved = true
      ORDER BY r.created_at DESC
    `, [id]);

    // Increment view count
    await pool.query('UPDATE pgs SET total_views = total_views + 1 WHERE id = $1', [id]);

    res.status(200).json({
      pg,
      images: imagesResult.rows,
      claims: claimsResult.rows,
      reviews: reviewsResult.rows
    });
  } catch (err) {
    console.error('getPGById error:', err.message);
    res.status(500).json({ message: 'Server error while fetching PG' });
  }
};

// ─── GET OWNER'S OWN PGS ─────────────────────────────────────────────────────
// GET /api/pgs/owner/my-listings
const getOwnerPGs = async (req, res) => {
  try {
    const owner_id = req.user.id;

    const result = await pool.query(`
      SELECT
        p.*,
        ts.overall_score, ts.price_label,
        (SELECT image_url FROM pg_images WHERE pg_id = p.id AND is_primary = true LIMIT 1) as primary_image
      FROM pgs p
      LEFT JOIN transparency_scores ts ON ts.pg_id = p.id
      WHERE p.owner_id = $1
      ORDER BY p.created_at DESC
    `, [owner_id]);

    res.status(200).json({ pgs: result.rows });
  } catch (err) {
    console.error('getOwnerPGs error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── UPDATE PG ───────────────────────────────────────────────────────────────
// PUT /api/pgs/:id
const updatePG = async (req, res) => {
  try {
    const { id } = req.params;
    const owner_id = req.user.id;

    // Make sure this PG belongs to this owner
    const check = await pool.query(
      'SELECT id FROM pgs WHERE id = $1 AND owner_id = $2',
      [id, owner_id]
    );
    if (check.rows.length === 0) {
      return res.status(403).json({ message: 'Not authorized to edit this PG' });
    }

    const {
      name, description, location, city, monthly_rent,
      room_type, total_rooms, has_wifi, has_ac, has_meals,
      has_laundry, has_parking, has_security, has_gym, has_hot_water, has_tv
    } = req.body;

    const result = await pool.query(`
      UPDATE pgs SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        location = COALESCE($3, location),
        city = COALESCE($4, city),
        monthly_rent = COALESCE($5, monthly_rent),
        room_type = COALESCE($6, room_type),
        total_rooms = COALESCE($7, total_rooms),
        has_wifi = COALESCE($8, has_wifi),
        has_ac = COALESCE($9, has_ac),
        has_meals = COALESCE($10, has_meals),
        has_laundry = COALESCE($11, has_laundry),
        has_parking = COALESCE($12, has_parking),
        has_security = COALESCE($13, has_security),
        has_gym = COALESCE($14, has_gym),
        has_hot_water = COALESCE($15, has_hot_water),
        has_tv = COALESCE($16, has_tv),
        status = 'pending'
      WHERE id = $17 RETURNING *
    `, [
      name, description, location, city, monthly_rent,
      room_type, total_rooms, has_wifi, has_ac, has_meals,
      has_laundry, has_parking, has_security, has_gym, has_hot_water, has_tv,
      id
    ]);

    res.status(200).json({ message: 'PG updated successfully', pg: result.rows[0] });
  } catch (err) {
    console.error('updatePG error:', err.message);
    res.status(500).json({ message: 'Server error while updating PG' });
  }
};

// ─── DELETE PG ───────────────────────────────────────────────────────────────
// DELETE /api/pgs/:id
const deletePG = async (req, res) => {
  try {
    const { id } = req.params;
    const owner_id = req.user.id;
    const userRole = req.user.role;

    // Owner can delete own PG, admin can delete any
    const check = userRole === 'admin'
      ? await pool.query('SELECT id FROM pgs WHERE id = $1', [id])
      : await pool.query('SELECT id FROM pgs WHERE id = $1 AND owner_id = $2', [id, owner_id]);

    if (check.rows.length === 0) {
      return res.status(403).json({ message: 'Not authorized to delete this PG' });
    }

    await pool.query('DELETE FROM pgs WHERE id = $1', [id]);
    res.status(200).json({ message: 'PG deleted successfully' });
  } catch (err) {
    console.error('deletePG error:', err.message);
    res.status(500).json({ message: 'Server error while deleting PG' });
  }
};

// ─── ADMIN: APPROVE / REJECT PG ──────────────────────────────────────────────
// PATCH /api/pgs/:id/status
const updatePGStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }

    const result = await pool.query(
      'UPDATE pgs SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'PG not found' });
    }

    res.status(200).json({
      message: `PG ${status} successfully`,
      pg: result.rows[0]
    });
  } catch (err) {
    console.error('updatePGStatus error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── SAVE / UNSAVE PG (❤️ feature) ──────────────────────────────────────────
// POST /api/pgs/:id/save
const toggleSavePG = async (req, res) => {
  try {
    const { id } = req.params;
    const student_id = req.user.id;

    // Check if already saved
    const existing = await pool.query(
      'SELECT id FROM saved_pgs WHERE student_id = $1 AND pg_id = $2',
      [student_id, id]
    );

    if (existing.rows.length > 0) {
      // Unsave
      await pool.query('DELETE FROM saved_pgs WHERE student_id = $1 AND pg_id = $2', [student_id, id]);
      return res.status(200).json({ message: 'PG removed from saved list', saved: false });
    } else {
      // Save
      await pool.query('INSERT INTO saved_pgs (student_id, pg_id) VALUES ($1, $2)', [student_id, id]);
      return res.status(200).json({ message: 'PG saved successfully', saved: true });
    }
  } catch (err) {
    console.error('toggleSavePG error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET STUDENT'S SAVED PGS ─────────────────────────────────────────────────
// GET /api/pgs/saved
const getSavedPGs = async (req, res) => {
  try {
    const student_id = req.user.id;

    const result = await pool.query(`
      SELECT
        p.id, p.name, p.location, p.monthly_rent, p.room_type,
        ts.overall_score, ts.price_label,
        (SELECT image_url FROM pg_images WHERE pg_id = p.id AND is_primary = true LIMIT 1) as primary_image,
        sp.saved_at
      FROM saved_pgs sp
      JOIN pgs p ON p.id = sp.pg_id
      LEFT JOIN transparency_scores ts ON ts.pg_id = p.id
      WHERE sp.student_id = $1
      ORDER BY sp.saved_at DESC
    `, [student_id]);

    res.status(200).json({ saved_pgs: result.rows });
  } catch (err) {
    console.error('getSavedPGs error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createPG, getAllPGs, getPGById, getOwnerPGs,
  updatePG, deletePG, updatePGStatus,
  toggleSavePG, getSavedPGs
};