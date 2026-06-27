const express = require('express');
const router = express.Router();
const Geofence = require('../models/Geofence');

// GET active geofence settings
router.get('/', async (req, res) => {
  try {
    let settings = await Geofence.findOne();
    if (!settings) {
      // Return defaults if none created
      return res.status(200).json({
        latitude: 28.6692,
        longitude: 77.4538,
        radius: 100.0
      });
    }
    return res.status(200).json(settings);
  } catch (error) {
    console.error('Error fetching geofence:', error);
    return res.status(500).json({ error: error.message });
  }
});

// POST Update geofence settings
router.post('/', async (req, res) => {
  try {
    const { latitude, longitude, radius } = req.body;
    if (latitude === undefined || longitude === undefined || radius === undefined) {
      return res.status(400).json({ error: 'Latitude, longitude and radius are required.' });
    }

    let settings = await Geofence.findOne();
    if (settings) {
      settings.latitude = Number(latitude);
      settings.longitude = Number(longitude);
      settings.radius = Number(radius);
      await settings.save();
    } else {
      settings = await Geofence.create({
        latitude: Number(latitude),
        longitude: Number(longitude),
        radius: Number(radius)
      });
    }

    return res.status(200).json(settings);
  } catch (error) {
    console.error('Error updating geofence:', error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
