const express = require('express');
const { pool } = require('../config/db');
const { protect, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

// GET /api/admin/pgs/pending — all pending PGs for admin
router.get('/pgs/pending', protect, restrictTo('admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.name as owner_name, u.email as owner_email
      FROM pgs p
      LEFT JOIN users u ON u.id = p.owner_id
      WHERE p.status = 'pending'
      ORDER BY p.created_at ASC
    `);
    res.status(200).json({ pgs: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/stats — platform stats
router.get('/stats', protect, restrictTo('admin'), async (req, res) => {
  try {
    const [total, pending, approved, users, reviews] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM pgs'),
      pool.query("SELECT COUNT(*) FROM pgs WHERE status = 'pending'"),
      pool.query("SELECT COUNT(*) FROM pgs WHERE status = 'approved'"),
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM reviews'),
    ]);
    res.status(200).json({
      total_pgs: parseInt(total.rows[0].count),
      pending_pgs: parseInt(pending.rows[0].count),
      approved_pgs: parseInt(approved.rows[0].count),
      total_users: parseInt(users.rows[0].count),
      total_reviews: parseInt(reviews.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/reviews — all reviews (admin only)
router.get('/reviews', protect, restrictTo('admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        r.id,
        r.review_text,
        r.overall_rating,
        r.hygiene_rating,
        r.food_rating,
        r.safety_rating,
        r.amenities_rating,
        r.is_approved,
        r.is_flagged,
        r.is_anonymous,
        r.sentiment,
        r.sentiment_score,
        r.nlp_keywords,
        r.created_at,
        r.owner_reply,
        CASE WHEN r.is_anonymous = true THEN 'Anonymous' ELSE u.name END as reviewer_name,
        u.email as reviewer_email,
        p.name as pg_name,
        p.id as pg_id
      FROM reviews r
      LEFT JOIN users u ON u.id = r.student_id
      LEFT JOIN pgs p ON p.id = r.pg_id
      ORDER BY r.created_at DESC
    `);
    res.status(200).json({ reviews: result.rows });
  } catch (err) {
    console.error('Admin get reviews error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;