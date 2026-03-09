const express = require('express');
const {
  submitReview, getPGReviews, getScorecard,
  replyToReview, flagReview,
  submitResidencyVerification, updateResidencyStatus, getPendingVerifications
} = require('../controllers/review.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

// ─── Public Routes ────────────────────────────────────────────────────────────
router.get('/pg/:pg_id', getPGReviews);                   // GET  /api/reviews/pg/:pg_id
router.get('/scorecard/:pg_id', getScorecard);            // GET  /api/reviews/scorecard/:pg_id

// ─── Student Routes ───────────────────────────────────────────────────────────
router.post('/', protect, restrictTo('student'), submitReview);                               // POST  /api/reviews
router.post('/verify-residency', protect, restrictTo('student'), submitResidencyVerification); // POST  /api/reviews/verify-residency

// ─── Owner Routes ─────────────────────────────────────────────────────────────
router.post('/:id/reply', protect, restrictTo('owner'), replyToReview);                       // POST  /api/reviews/:id/reply

// ─── Admin Routes ─────────────────────────────────────────────────────────────
router.get('/verify-residency/pending', protect, restrictTo('admin'), getPendingVerifications); // GET   /api/reviews/verify-residency/pending
router.patch('/verify-residency/:id', protect, restrictTo('admin'), updateResidencyStatus);     // PATCH /api/reviews/verify-residency/:id
router.patch('/:id/flag', protect, restrictTo('admin'), flagReview);                            // PATCH /api/reviews/:id/flag

module.exports = router;