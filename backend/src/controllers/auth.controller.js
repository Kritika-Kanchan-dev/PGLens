const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
require('dotenv').config();

// ─── Helper: Generate JWT ────────────────────────────────────────────────────
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ─── Helper: Safe user object (remove password) ──────────────────────────────
const safeUser = (user) => {
  const { password, ...rest } = user;
  return rest;
};

// ─── REGISTER ────────────────────────────────────────────────────────────────
// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    // Validate role
    const allowedRoles = ['student', 'owner'];
    const userRole = allowedRoles.includes(role) ? role : 'student';

    // Check if email already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert new user
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, email, hashedPassword, userRole]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: safeUser(user)
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// ─── LOGIN ───────────────────────────────────────────────────────────────────
// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Google-only users can't login with password
    if (!user.password) {
      return res.status(401).json({ message: 'This account uses Google login. Please sign in with Google.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({ message: 'Account has been deactivated' });
    }

    const token = generateToken(user);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: safeUser(user)
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// ─── GOOGLE OAUTH CALLBACK ───────────────────────────────────────────────────
// GET /api/auth/google/callback  (called after Passport handles OAuth)
const googleCallback = (req, res) => {
  try {
    const user = req.user;
    const token = generateToken(user);

    // Redirect to frontend with token in URL
    // Frontend will extract token and store it
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}&role=${user.role}`);
  } catch (err) {
    console.error('Google callback error:', err.message);
    res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
  }
};

// ─── GET CURRENT USER ────────────────────────────────────────────────────────
// GET /api/auth/me  (protected — requires JWT)
const getMe = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user: safeUser(user) });
  } catch (err) {
    console.error('GetMe error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, login, googleCallback, getMe };