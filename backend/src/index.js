const express = require('express');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const passport = require('./config/passport');
const { initDB } = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const pgRoutes = require('./routes/pg.routes');
const reviewRoutes = require('./routes/review.routes');
const adminRoutes = require('./routes/admin.routes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:3000',
    process.env.CLIENT_URL
  ].filter(Boolean),
  credentials: true
}));

app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again later.' }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// ─── Routes ───────────────────────────────────────────────────────────────────
const imageRoutes = require('./routes/image.routes');

app.use('/api/auth', authRoutes);
app.use('/api/pgs', pgRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/images', imageRoutes);
const analysisRoutes = require('./routes/analysis.routes');
app.use('/api/analysis', analysisRoutes);
// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'PGLens API is running 🚀', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ message: 'Internal server error' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const start = async () => {
  await initDB();   // Connect DB and create tables
  app.listen(PORT, () => {
    console.log(`🚀 PGLens backend running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  });

  setTimeout(async () => {
    const { analysePGImages } = require('./services/aiAnalysisService');
    await analysePGImages(13); // replace 1 with your actual PG id
  }, 3000);
};

start();