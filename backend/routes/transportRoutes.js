import express from 'express';
import {
  discoverTransportOptions,
  searchRealAccommodations,
} from '../services/transportProvider.js';

const router = express.Router();

// @desc    Discover transport options between two locations
// @route   GET /api/transport/discover
// @access  Public (or protected if token present)
router.get('/discover', async (req, res, next) => {
  try {
    const { origin, destination, originLat, originLng, destLat, destLng, date, mode } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination are required.',
      });
    }

    const originCoords = originLat && originLng ? [parseFloat(originLat), parseFloat(originLng)] : null;
    const destCoords = destLat && destLng ? [parseFloat(destLat), parseFloat(destLng)] : null;

    const results = await discoverTransportOptions({
      origin,
      destination,
      originCoords,
      destCoords,
      travelDate: date,
      requestedMode: mode || 'all',
    });

    res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Search real accommodations around destination
// @route   GET /api/transport/stays
// @access  Public
router.get('/stays', async (req, res, next) => {
  try {
    const { destination, lat, lng, limit } = req.query;

    const coords = lat && lng ? [parseFloat(lat), parseFloat(lng)] : null;
    const stays = await searchRealAccommodations({
      destination,
      coords,
      limit: parseInt(limit, 10) || 8,
    });

    res.status(200).json({
      success: true,
      count: stays.length,
      stays,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
