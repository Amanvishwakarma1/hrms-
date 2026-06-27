const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const { getAddressFromCoords } = require('../utils/geocoder');

router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    const whereClause = userId ? { userId } : {};
    const history = await Attendance.findAll({ 
      where: whereClause,
      order: [['createdAt', 'DESC']] 
    });
    return res.status(200).json(history);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { userId, userName, date, checkIn, checkOut, workingHours, coords } = req.body;
    const newRecord = await Attendance.create({ userId, userName, date, checkIn, checkOut, workingHours, coords });

    if (coords && coords.lat && coords.lon) {
      getAddressFromCoords(coords.lat, coords.lon).then(async (addr) => {
        if (addr) {
          newRecord.address = addr;
          await newRecord.save();
          console.log(`[Attendance Geocode] Geocoded record ${newRecord.id} to: ${addr}`);
        }
      }).catch(err => {
        console.warn("[Attendance Geocode Error] Failed to resolve address:", err.message);
      });
    }

    return res.status(201).json(newRecord);
  } catch (error) {
    console.error('Error creating attendance:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.delete('/', async (req, res) => {
  try {
    await Attendance.destroy({ where: {}, truncate: true });
    return res.status(200).json({ message: 'Attendance history cleared.' });
  } catch (error) {
    console.error('Error clearing attendance:', error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
