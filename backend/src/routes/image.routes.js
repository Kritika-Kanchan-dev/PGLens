const express = require('express');
const multer = require('multer');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  uploadPGImages,
  getPGImages,
  setPrimaryImage,
  deleteImage,
} = require('../controllers/image.controller');

const router = express.Router();

// Multer — store in memory, then push to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per image
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// POST   /api/images/upload/:pg_id  — upload 4-10 images (owner only)
router.post(
  '/upload/:pg_id',
  protect,
  restrictTo('owner'),
  upload.array('images', 10),
  uploadPGImages
);

// GET    /api/images/pg/:pg_id      — get all images for a PG (public)
router.get('/pg/:pg_id', getPGImages);

// PATCH  /api/images/:image_id/primary — set primary image (owner only)
router.patch('/:image_id/primary', protect, restrictTo('owner'), setPrimaryImage);

// DELETE /api/images/:image_id      — delete an image (owner only)
router.delete('/:image_id', protect, restrictTo('owner'), deleteImage);

module.exports = router;