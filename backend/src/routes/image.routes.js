const express = require('express');
const multer = require('multer');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  uploadCategoryImages,
  getPGImages,
  setPrimaryImage,
  deleteImage,
} = require('../controllers/image.controller');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// POST /api/images/upload/:pg_id/:category
// category must be: bedroom | washroom | hallway | outside
// min 2, max 4 images per category
router.post(
  '/upload/:pg_id/:category',
  protect,
  restrictTo('owner'),
  upload.array('images', 4),
  uploadCategoryImages
);

// GET /api/images/pg/:pg_id
router.get('/pg/:pg_id', getPGImages);

// PATCH /api/images/:image_id/primary
router.patch('/:image_id/primary', protect, restrictTo('owner'), setPrimaryImage);

// DELETE /api/images/:image_id
router.delete('/:image_id', protect, restrictTo('owner'), deleteImage);

module.exports = router;