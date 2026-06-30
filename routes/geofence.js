const express = require('express');
const router = express.Router();
const Geofence = require('../models/Geofence');

// GET all active geofence settings
router.get('/', async (req, res) => {
  try {
    const list = await Geofence.findAll({
      order: [['createdAt', 'ASC']]
    });

    if (list.length === 0) {
      // Return default if none created
      return res.status(200).json([{
        id: 1,
        name: 'Default Office',
        latitude: 28.6692,
        longitude: 77.4538,
        radius: 100.0
      }]);
    }
    return res.status(200).json(list);
  } catch (error) {
    console.error('Error fetching geofences:', error);
    return res.status(500).json({ error: error.message });
  }
});

// POST Create a new geofence boundary
router.post('/', async (req, res) => {
  try {
    const { name, latitude, longitude, radius } = req.body;
    if (latitude === undefined || longitude === undefined || radius === undefined) {
      return res.status(400).json({ error: 'Latitude, longitude and radius are required.' });
    }

    const newGf = await Geofence.create({
      name: name || 'Office Geofence',
      latitude: Number(latitude),
      longitude: Number(longitude),
      radius: Number(radius)
    });

    return res.status(201).json(newGf);
  } catch (error) {
    console.error('Error creating geofence:', error);
    return res.status(500).json({ error: error.message });
  }
});

// DELETE Geofence by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCount = await Geofence.destroy({
      where: { id }
    });

    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Geofence not found.' });
    }
    return res.status(200).json({ message: 'Geofence deleted successfully.' });
  } catch (error) {
    console.error('Error deleting geofence:', error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
