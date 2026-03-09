const cloudinary = require('../config/cloudinary');
const { pool } = require('../config/db');

// ─── UPLOAD PG IMAGES ─────────────────────────────────────────────────────────
// POST /api/images/upload/:pg_id
// Owner uploads 4-10 images for their PG
const uploadPGImages = async (req, res) => {
  try {
    const { pg_id } = req.params;
    const owner_id = req.user.id;

    // Verify this PG belongs to this owner
    const pgCheck = await pool.query(
      'SELECT id FROM pgs WHERE id = $1 AND owner_id = $2',
      [pg_id, owner_id]
    );
    if (pgCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Not authorized to upload images for this PG' });
    }

    // Check how many images already exist
    const existingCount = await pool.query(
      'SELECT COUNT(*) FROM pg_images WHERE pg_id = $1',
      [pg_id]
    );
    const currentCount = parseInt(existingCount.rows[0].count);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images provided' });
    }

    const newCount = currentCount + req.files.length;
    if (newCount > 10) {
      return res.status(400).json({
        message: `Too many images. You already have ${currentCount} images. Max is 10.`
      });
    }

    const uploadedImages = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];

      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `pglens/pg_${pg_id}`,
            transformation: [
              { width: 1200, height: 800, crop: 'fill', quality: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });

      // First image is primary if no images exist yet
      const isPrimary = currentCount === 0 && i === 0;

      // Save to database
      const dbResult = await pool.query(
        `INSERT INTO pg_images (pg_id, image_url, is_primary)
         VALUES ($1, $2, $3) RETURNING *`,
        [pg_id, result.secure_url, isPrimary]
      );

      uploadedImages.push(dbResult.rows[0]);
    }

    res.status(201).json({
      message: `${uploadedImages.length} image(s) uploaded successfully`,
      images: uploadedImages
    });
  } catch (err) {
    console.error('uploadPGImages error:', err.message);
    res.status(500).json({ message: 'Failed to upload images' });
  }
};

// ─── GET PG IMAGES ────────────────────────────────────────────────────────────
// GET /api/images/pg/:pg_id
const getPGImages = async (req, res) => {
  try {
    const { pg_id } = req.params;
    const result = await pool.query(
      'SELECT * FROM pg_images WHERE pg_id = $1 ORDER BY is_primary DESC, uploaded_at ASC',
      [pg_id]
    );
    res.status(200).json({ images: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch images' });
  }
};

// ─── SET PRIMARY IMAGE ────────────────────────────────────────────────────────
// PATCH /api/images/:image_id/primary
const setPrimaryImage = async (req, res) => {
  try {
    const { image_id } = req.params;
    const owner_id = req.user.id;

    // Get image and verify ownership
    const imgResult = await pool.query(
      `SELECT pi.*, p.owner_id FROM pg_images pi
       JOIN pgs p ON p.id = pi.pg_id
       WHERE pi.id = $1`,
      [image_id]
    );
    if (imgResult.rows.length === 0) {
      return res.status(404).json({ message: 'Image not found' });
    }
    if (imgResult.rows[0].owner_id !== owner_id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const pg_id = imgResult.rows[0].pg_id;

    // Unset all primary flags for this PG
    await pool.query('UPDATE pg_images SET is_primary = false WHERE pg_id = $1', [pg_id]);

    // Set this image as primary
    await pool.query('UPDATE pg_images SET is_primary = true WHERE id = $1', [image_id]);

    res.status(200).json({ message: 'Primary image updated' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update primary image' });
  }
};

// ─── DELETE IMAGE ─────────────────────────────────────────────────────────────
// DELETE /api/images/:image_id
const deleteImage = async (req, res) => {
  try {
    const { image_id } = req.params;
    const owner_id = req.user.id;

    // Verify ownership
    const imgResult = await pool.query(
      `SELECT pi.*, p.owner_id FROM pg_images pi
       JOIN pgs p ON p.id = pi.pg_id
       WHERE pi.id = $1`,
      [image_id]
    );
    if (imgResult.rows.length === 0) {
      return res.status(404).json({ message: 'Image not found' });
    }
    if (imgResult.rows[0].owner_id !== owner_id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const pg_id = imgResult.rows[0].pg_id;

    // Check minimum images (at least 1 must remain if PG is approved)
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM pg_images WHERE pg_id = $1', [pg_id]
    );
    if (parseInt(countResult.rows[0].count) <= 1) {
      return res.status(400).json({ message: 'Cannot delete the last image. Add more images first.' });
    }

    // Delete from database
    await pool.query('DELETE FROM pg_images WHERE id = $1', [image_id]);

    // If deleted image was primary, set next image as primary
    if (imgResult.rows[0].is_primary) {
      await pool.query(
        'UPDATE pg_images SET is_primary = true WHERE pg_id = $1 LIMIT 1',
        [pg_id]
      );
    }

    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete image' });
  }
};

module.exports = { uploadPGImages, getPGImages, setPrimaryImage, deleteImage };