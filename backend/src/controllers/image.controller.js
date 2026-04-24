const cloudinary = require('../config/cloudinary');
const { pool } = require('../config/db');

const VALID_CATEGORIES = ['bedroom', 'washroom', 'hallway', 'outside'];
const REQUIRED_CATEGORIES = ['bedroom', 'washroom'];
const OPTIONAL_CATEGORIES = ['hallway', 'outside'];
const MIN_PER_CATEGORY = 2;
const MAX_PER_CATEGORY = 4;

// ─── UPLOAD IMAGES FOR A SPECIFIC CATEGORY ────────────────────────────────────
// POST /api/images/upload/:pg_id/:category
const uploadCategoryImages = async (req, res) => {
  try {
    const { pg_id, category } = req.params;
    const owner_id = req.user.id;

    // Validate category
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`
      });
    }

    // Verify this PG belongs to this owner
    const pgCheck = await pool.query(
      'SELECT id FROM pgs WHERE id = $1 AND owner_id = $2',
      [pg_id, owner_id]
    );
    if (pgCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Not authorized to upload images for this PG' });
    }

    // Check files present
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images provided' });
    }

    // Check existing count for this category
    const existingResult = await pool.query(
      'SELECT COUNT(*) FROM pg_images WHERE pg_id = $1 AND category = $2',
      [pg_id, category]
    );
    const existingCount = parseInt(existingResult.rows[0].count);
    const newTotal = existingCount + req.files.length;

    if (req.files.length < MIN_PER_CATEGORY && existingCount === 0) {
      return res.status(400).json({
        message: `Please upload at least ${MIN_PER_CATEGORY} images for ${category}`
      });
    }

    if (newTotal > MAX_PER_CATEGORY) {
      return res.status(400).json({
        message: `Too many images for ${category}. Already have ${existingCount}, max is ${MAX_PER_CATEGORY}.`
      });
    }

    const uploadedImages = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];

      // Upload to Cloudinary under category subfolder
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `pglens/pg_${pg_id}/${category}`,
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

      // First bedroom image uploaded ever = primary
      const totalExisting = await pool.query(
        'SELECT COUNT(*) FROM pg_images WHERE pg_id = $1',
        [pg_id]
      );
      const isPrimary =
        parseInt(totalExisting.rows[0].count) === 0 &&
        category === 'bedroom' &&
        i === 0;

      const dbResult = await pool.query(
        `INSERT INTO pg_images (pg_id, image_url, category, is_primary)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [pg_id, result.secure_url, category, isPrimary]
      );

      uploadedImages.push(dbResult.rows[0]);
    }

    res.status(201).json({
      message: `${uploadedImages.length} image(s) uploaded for ${category}`,
      images: uploadedImages
    });

  } catch (err) {
    console.error('uploadCategoryImages error:', err.message);
    res.status(500).json({ message: 'Failed to upload images' });
  }
};

// ─── GET ALL PG IMAGES (grouped by category) ─────────────────────────────────
// GET /api/images/pg/:pg_id
const getPGImages = async (req, res) => {
  try {
    const { pg_id } = req.params;

    const result = await pool.query(
      `SELECT * FROM pg_images 
       WHERE pg_id = $1 
       ORDER BY 
         CASE category 
           WHEN 'bedroom'  THEN 1 
           WHEN 'washroom' THEN 2 
           WHEN 'hallway'  THEN 3 
           WHEN 'outside'  THEN 4 
           ELSE 5 
         END,
         is_primary DESC, 
         uploaded_at ASC`,
      [pg_id]
    );

    // Group by category for easy frontend use
    const grouped = VALID_CATEGORIES.reduce((acc, cat) => {
      acc[cat] = result.rows.filter(img => img.category === cat);
      return acc;
    }, {});

    // Check which required categories are complete
    const completionStatus = {
      bedroom:  grouped.bedroom.length  >= MIN_PER_CATEGORY,
      washroom: grouped.washroom.length >= MIN_PER_CATEGORY,
      hallway:  true, // optional
      outside:  true, // optional
      isReadyToSubmit:
        grouped.bedroom.length  >= MIN_PER_CATEGORY &&
        grouped.washroom.length >= MIN_PER_CATEGORY,
    };

    res.status(200).json({
      images: result.rows,
      grouped,
      completionStatus
    });

  } catch (err) {
    console.error('getPGImages error:', err.message);
    res.status(500).json({ message: 'Failed to fetch images' });
  }
};

// ─── SET PRIMARY IMAGE ────────────────────────────────────────────────────────
// PATCH /api/images/:image_id/primary
const setPrimaryImage = async (req, res) => {
  try {
    const { image_id } = req.params;
    const owner_id = req.user.id;

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

    await pool.query('UPDATE pg_images SET is_primary = false WHERE pg_id = $1', [pg_id]);
    await pool.query('UPDATE pg_images SET is_primary = true WHERE id = $1', [image_id]);

    res.status(200).json({ message: 'Primary image updated' });

  } catch (err) {
    console.error('setPrimaryImage error:', err.message);
    res.status(500).json({ message: 'Failed to update primary image' });
  }
};

// ─── DELETE IMAGE ─────────────────────────────────────────────────────────────
// DELETE /api/images/:image_id
const deleteImage = async (req, res) => {
  try {
    const { image_id } = req.params;
    const owner_id = req.user.id;

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

    const { pg_id, category, is_primary } = imgResult.rows[0];

    // For required categories, must keep at least MIN_PER_CATEGORY images
    if (REQUIRED_CATEGORIES.includes(category)) {
      const countResult = await pool.query(
        'SELECT COUNT(*) FROM pg_images WHERE pg_id = $1 AND category = $2',
        [pg_id, category]
      );
      if (parseInt(countResult.rows[0].count) <= MIN_PER_CATEGORY) {
        return res.status(400).json({
          message: `Cannot delete. ${category} must have at least ${MIN_PER_CATEGORY} images.`
        });
      }
    }

    await pool.query('DELETE FROM pg_images WHERE id = $1', [image_id]);

    // If deleted image was primary, promote next bedroom image as primary
    if (is_primary) {
      await pool.query(
        `UPDATE pg_images SET is_primary = true 
         WHERE pg_id = $1 AND category = 'bedroom'
         ORDER BY uploaded_at ASC LIMIT 1`,
        [pg_id]
      );
    }

    res.status(200).json({ message: 'Image deleted successfully' });

  } catch (err) {
    console.error('deleteImage error:', err.message);
    res.status(500).json({ message: 'Failed to delete image' });
  }
};

module.exports = { uploadCategoryImages, getPGImages, setPrimaryImage, deleteImage };