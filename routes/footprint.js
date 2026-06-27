const express = require('express');
const router = express.Router();
const Footprint = require('../models/Footprint');
const { getAddressFromCoords } = require('../utils/geocoder');
const { resolveCellToCoords } = require('../utils/cellResolver');
const { Op } = require('sequelize');

router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    const whereClause = userId ? { userId } : {};
    const footprints = await Footprint.findAll({ 
      where: whereClause,
      order: [['timestamp', 'ASC']] 
    });
    return res.status(200).json(footprints);
  } catch (error) {
    console.error('Error fetching footprints:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { 
      userId, 
      latitude, 
      longitude, 
      timestamp, 
      date, 
      locationEnabled, 
      trackingMethod,
      accuracy,
      cellId,
      lac,
      tac,
      mcc,
      mnc,
      signalStrength,
      batteryLevel,
      batteryTemp,
      networkType,
      reason,
      isMockLocation
    } = req.body;

    let finalLat = latitude;
    let finalLon = longitude;
    let finalAccuracy = accuracy;
    let finalAddress = null;

    // 1. If tracking method is CELLULAR and cellId is present, try to resolve cellular tower coordinates
    if (trackingMethod === 'CELLULAR' && cellId) {
      const resolvedCell = await resolveCellToCoords(mcc, mnc, lac || tac, cellId);
      if (resolvedCell) {
        finalLat = resolvedCell.latitude;
        finalLon = resolvedCell.longitude;
        finalAccuracy = resolvedCell.accuracy;
        console.log(`[Footprint Router] Cellular resolved Cell ID ${cellId} to (${finalLat}, ${finalLon})`);
      } else {
        console.log(`[Footprint Router] Cellular resolver returned null for Cell ID ${cellId}, falling back to client coordinates`);
      }
    }

    // 2. If coordinates are still missing, fallback to last known coords or default office
    if (!finalLat || !finalLon) {
      // Find latest footprint with coordinates for this user
      const lastCoordPoint = await Footprint.findOne({
        where: {
          userId: userId,
          latitude: { [Op.ne]: null },
          longitude: { [Op.ne]: null }
        },
        order: [['timestamp', 'DESC']]
      });

      if (lastCoordPoint) {
        finalLat = lastCoordPoint.latitude;
        finalLon = lastCoordPoint.longitude;
        finalAccuracy = lastCoordPoint.accuracy || 50;
        finalAddress = lastCoordPoint.address;
        console.log(`[Footprint Geocode Backend Fallback] Reused last known coords (${finalLat}, ${finalLon}) and address for user ${userId}`);
      } else {
        // Fallback to Noida Office
        finalLat = 28.6692;
        finalLon = 77.4538;
        finalAccuracy = 100;
        finalAddress = "HRMS HQ Office, Sector 62, Noida, Uttar Pradesh, India";
        console.log(`[Footprint Geocode Backend Fallback] No last coordinates. Defaulted to office coordinates for user ${userId}`);
      }
    }
    
    const newPoint = await Footprint.create({ 
      userId, 
      latitude: finalLat, 
      longitude: finalLon, 
      timestamp, 
      date, 
      locationEnabled, 
      trackingMethod,
      accuracy: finalAccuracy,
      address: finalAddress,
      cellId,
      lac,
      tac,
      mcc,
      mnc,
      signalStrength,
      batteryLevel,
      batteryTemp,
      networkType,
      reason,
      isMockLocation
    });

    if (finalLat && finalLon && !finalAddress) {
      getAddressFromCoords(finalLat, finalLon).then(async (addr) => {
        if (addr) {
          newPoint.address = addr;
          await newPoint.save();
          console.log(`[Footprint Geocode] Geocoded record ${newPoint.id} to: ${addr}`);
        }
      }).catch(err => {
        console.warn("[Footprint Geocode Error] Failed to resolve address:", err.message);
      });
    }

    return res.status(201).json(newPoint);
  } catch (error) {
    console.error('Error creating footprint:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.delete('/', async (req, res) => {
  try {
    await Footprint.destroy({ where: {}, truncate: true });
    return res.status(200).json({ message: 'Footprint history cleared.' });
  } catch (error) {
    console.error('Error clearing footprints:', error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
