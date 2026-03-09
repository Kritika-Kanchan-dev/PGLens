const express = require('express');
const {
  createPG, getAllPGs, getPGById, getOwnerPGs,
  updatePG, deletePG, updatePGStatus,
  toggleSavePG, getSavedPGs
} = require('../controllers/pg.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

// ─── Public Routes (no login needed) ─────────────────────────────────────────
router.get('/', getAllPGs);                           // GET  /api/pgs  (browse + filter)
router.get('/:id', getPGById);                       // GET  /api/pgs/:id  (PG detail page)

// ─── Owner Routes ─────────────────────────────────────────────────────────────
router.post('/', protect, restrictTo('owner'), createPG);                        // POST   /api/pgs
router.get('/owner/my-listings', protect, restrictTo('owner'), getOwnerPGs);     // GET    /api/pgs/owner/my-listings
router.put('/:id', protect, restrictTo('owner'), updatePG);                      // PUT    /api/pgs/:id
router.delete('/:id', protect, restrictTo('owner', 'admin'), deletePG);          // DELETE /api/pgs/:id

// ─── Admin Routes ─────────────────────────────────────────────────────────────
router.patch('/:id/status', protect, restrictTo('admin'), updatePGStatus);       // PATCH  /api/pgs/:id/status

// ─── Student Routes ───────────────────────────────────────────────────────────
router.post('/:id/save', protect, restrictTo('student'), toggleSavePG);          // POST   /api/pgs/:id/save
router.get('/student/saved', protect, restrictTo('student'), getSavedPGs);       // GET    /api/pgs/student/saved

module.exports = router;