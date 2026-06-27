const express = require('express');
const router = express.Router();
const Media = require('../models/Media');
const upload = require('../middleware/upload');

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

    // Build the static file path accessible by the mobile client
    const filePath = `/static/uploads/${req.file.filename}`;

    const newMedia = await Media.create({
      userId,
      userName,
      filePath,
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

module.exports = router;
