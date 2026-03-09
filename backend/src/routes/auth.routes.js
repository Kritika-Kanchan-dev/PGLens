const express = require('express');
const passport = require('../config/passport');
const { register, login, googleCallback, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// ─── Email + Password ─────────────────────────────────────────────────────────
router.post('/register', register);   // POST /api/auth/register
router.post('/login', login);         // POST /api/auth/login

// ─── Google OAuth ─────────────────────────────────────────────────────────────
// Step 1: Redirect user to Google consent screen
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// Step 2: Google redirects back here after user approves
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  googleCallback
);

// ─── Protected Routes ─────────────────────────────────────────────────────────
router.get('/me', protect, getMe);    // GET /api/auth/me  → get logged-in user info

module.exports = router;