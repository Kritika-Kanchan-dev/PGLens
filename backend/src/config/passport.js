const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { pool } = require('./db');
require('dotenv').config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName;
        const googleId = profile.id;
        const avatar = profile.photos[0]?.value || null;

        // Check if user already exists (by google_id or email)
        let result = await pool.query(
          'SELECT * FROM users WHERE google_id = $1 OR email = $2',
          [googleId, email]
        );

        let user = result.rows[0];

        if (!user) {
          // New user — create account (default role: student)
          const insertResult = await pool.query(
            `INSERT INTO users (name, email, google_id, avatar, role)
             VALUES ($1, $2, $3, $4, 'student')
             RETURNING *`,
            [name, email, googleId, avatar]
          );
          user = insertResult.rows[0];
        } else if (!user.google_id) {
          // Existing email/password user — link their Google account
          const updateResult = await pool.query(
            'UPDATE users SET google_id = $1, avatar = $2 WHERE email = $3 RETURNING *',
            [googleId, avatar, email]
          );
          user = updateResult.rows[0];
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Not using sessions — JWT handles auth state
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

module.exports = passport;