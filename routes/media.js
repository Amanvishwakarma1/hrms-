const express = require('express');
const router = express.Router();
const Media = require('../models/Media');
const upload = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// GET all geotagged media
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    const whereClause = userId ? { userId } : {};
    const mediaList = await Media.findAll({
      where: whereClause,
      order: [['timestamp', 'DESC']]
    });
    return res.status(200).json(mediaList);
  } catch (error) {
    console.error('Error fetching media list:', error);
    return res.status(500).json({ error: error.message });
  }
});

// POST upload geotagged media
router.post('/', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('❌ Multer upload error:', err.message);
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const {
      userId,
      userName,
      latitude,
      longitude,
      address,
      mediaType,
      timestamp,
      date
    } = req.body;

    let filePath = `/static/uploads/${req.file.filename}`;
    let cloudinaryUrl = null;

    const apiSecret = cloudinary.config().api_secret;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'ml_default';

    // Upload to Cloudinary if configured
    if (apiSecret) {
      try {
        console.log('Uploading image to Cloudinary (Signed)...');
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'geotagged_media'
        });
        cloudinaryUrl = result.secure_url;
        console.log('Cloudinary upload successful (Signed):', cloudinaryUrl);
        // Hybrid: We intentionally do NOT unlink the local file here.
      } catch (cloudinaryError) {
        console.error('Cloudinary Signed upload failed, using local fallback:', cloudinaryError.message);
      }
    } else if (uploadPreset) {
      try {
        console.log(`Uploading image to Cloudinary (Unsigned with preset: ${uploadPreset})...`);
        const result = await cloudinary.uploader.unsigned_upload(req.file.path, uploadPreset, {
          folder: 'geotagged_media'
        });
        cloudinaryUrl = result.secure_url;
        console.log('Cloudinary upload successful (Unsigned):', cloudinaryUrl);
        // Hybrid: We intentionally do NOT unlink the local file here.
      } catch (cloudinaryError) {
        console.error('Cloudinary Unsigned upload failed, using local fallback:', cloudinaryError.message);
      }
    } else {
      console.warn('Neither Cloudinary API Secret nor Upload Preset found. Using local file storage.');
    }

    const newMedia = await Media.create({
      userId,
      userName,
      filePath,
      cloudinaryUrl,
      mediaType,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      address: address || null,
      timestamp: timestamp ? parseInt(timestamp, 10) : Date.now(),
      date: date || new Date().toISOString().split('T')[0]
    });

    return res.status(201).json(newMedia);
  } catch (error) {
    console.error('Error creating geotagged media:', error);
    return res.status(500).json({ error: error.message });
  }
});

// DELETE a geotagged media by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const mediaItem = await Media.findByPk(id);
    if (!mediaItem) {
      return res.status(404).json({ error: 'Media not found' });
    }
    await mediaItem.destroy();
    return res.status(200).json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Error deleting media:', error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
