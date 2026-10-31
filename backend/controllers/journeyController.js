import Journey from '../models/Journey.js';

// Helper to recalculate distance, duration, and CO2 from segments
const recalculateJourneyTotals = (segments = []) => {
  let totalDistanceKm = 0;
  let totalDurationMinutes = 0;
  let estimatedCo2Kg = 0;

  segments.forEach((seg) => {
    const dist = parseFloat(seg.distanceKm) || 0;
    const dur = parseInt(seg.durationMinutes, 10) || 0;
    totalDistanceKm += dist;
    totalDurationMinutes += dur;

    // Standard DEFRA emissions: Car ~171g/km, Train ~35g/km, Bus ~89g/km, Walk/Bike 0g/km
    const type = (seg.type || seg.mode || '').toLowerCase();
    let factor = 0.089;
    if (type.includes('walk') || type.includes('bike') || type.includes('foot')) factor = 0;
    else if (type.includes('train') || type.includes('rail')) factor = 0.035;
    else if (type.includes('car')) factor = 0.171;
    else if (type.includes('flight')) factor = 0.244;

    estimatedCo2Kg += dist * factor;
  });

  return {
    totalDistanceKm: parseFloat(totalDistanceKm.toFixed(1)),
    totalDurationMinutes,
    estimatedCo2Kg: parseFloat(estimatedCo2Kg.toFixed(2)),
  };
};

// @desc    Get all journeys for authenticated user
// @route   GET /api/journeys
// @access  Private
export const getJourneys = async (req, res, next) => {
  try {
    const journeys = await Journey.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: journeys.length,
      journeys,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single journey by ID (with ownership check)
// @route   GET /api/journeys/:id
// @access  Private
export const getJourneyById = async (req, res, next) => {
  try {
    const journey = await Journey.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'Journey record not found or access denied.',
      });
    }

    res.status(200).json({
      success: true,
      journey,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new journey
// @route   POST /api/journeys
// @access  Private
export const createJourney = async (req, res, next) => {
  try {
    const {
      title,
      origin,
      destination,
      travelDate,
      startDate,
      endDate,
      status,
      primaryTransportMode,
      transitTypes,
      summary,
      budget,
      segments,
      waypoints,
      coverImage,
    } = req.body;

    if (!title || !origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Please provide journey title, origin, and destination.',
      });
    }

    // Default starter segment if none provided
    const initialSegments =
      Array.isArray(segments) && segments.length > 0
        ? segments
        : [
            {
              id: 'seg-' + Date.now(),
              order: 1,
              type: (primaryTransportMode || '').toLowerCase().includes('bus')
                ? 'bus'
                : (primaryTransportMode || '').toLowerCase().includes('train')
                ? 'train'
                : 'walking',
              mode: primaryTransportMode || 'Walking',
              transportMode: primaryTransportMode || 'Walking',
              title: `Primary Transit Leg: ${origin} to ${destination}`,
              origin,
              from: origin,
              destination,
              to: destination,
              distanceKm: parseFloat(req.body.totalDistanceKm) || 4.5,
              distanceMi: parseFloat(
                ((parseFloat(req.body.totalDistanceKm) || 4.5) * 0.621371).toFixed(1)
              ),
              durationMinutes: parseInt(req.body.totalDurationMinutes, 10) || 30,
              duration: `${parseInt(req.body.totalDurationMinutes, 10) || 30}m`,
              startTime: '09:00 AM',
              endTime: '09:30 AM',
              co2SavedKg: 0.8,
              status: status === 'In Progress' ? 'In Progress' : 'Scheduled',
              notes: summary || 'Initial registered segment for this trip chain.',
            },
          ];

    const totals = recalculateJourneyTotals(initialSegments);

    const journey = await Journey.create({
      user: req.user._id,
      title: title.trim(),
      origin: origin.trim(),
      destination: destination.trim(),
      travelDate: travelDate || new Date().toISOString().split('T')[0],
      startDate: startDate || travelDate || new Date().toISOString().split('T')[0],
      endDate: endDate || travelDate || new Date().toISOString().split('T')[0],
      status: status || 'Upcoming',
      primaryTransportMode: primaryTransportMode || 'Transit + Walking',
      transitTypes: transitTypes || [
        (primaryTransportMode || 'transit').toLowerCase(),
      ],
      totalDistanceKm: totals.totalDistanceKm,
      totalDurationMinutes: totals.totalDurationMinutes,
      estimatedCo2Kg: totals.estimatedCo2Kg,
      summary: summary || '',
      budget: parseFloat(budget) || 0,
      spent: 0,
      coverImage:
        coverImage ||
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
      waypoints: waypoints || [
        {
          id: `wp-${Date.now()}-1`,
          title: origin,
          coords: [35.0116, 135.7681],
          completed: false,
          isOrigin: true,
        },
        {
          id: `wp-${Date.now()}-2`,
          title: destination,
          coords: [35.0216, 135.7781],
          completed: false,
          isDestination: true,
        },
      ],
      segments: initialSegments,
      travelSegments: initialSegments,
    });

    res.status(201).json({
      success: true,
      message: 'Journey created successfully.',
      journey,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update journey by ID
// @route   PUT /api/journeys/:id
// @access  Private
export const updateJourney = async (req, res, next) => {
  try {
    let journey = await Journey.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'Journey not found or unauthorized to edit.',
      });
    }

    const {
      title,
      origin,
      destination,
      travelDate,
      startDate,
      endDate,
      status,
      primaryTransportMode,
      summary,
      budget,
      spent,
      coverImage,
      segments,
      travelSegments,
      waypoints,
      packingList,
      itineraryDays,
      expenses,
      hotelInfo,
      currentLocation,
    } = req.body;

    if (title) journey.title = title.trim();
    if (origin) journey.origin = origin.trim();
    if (destination) journey.destination = destination.trim();
    if (travelDate) journey.travelDate = travelDate;
    if (startDate) journey.startDate = startDate;
    if (endDate) journey.endDate = endDate;
    if (status) journey.status = status;
    if (primaryTransportMode) journey.primaryTransportMode = primaryTransportMode;
    if (summary !== undefined) journey.summary = summary;
    if (budget !== undefined) journey.budget = parseFloat(budget) || 0;
    if (spent !== undefined) journey.spent = parseFloat(spent) || 0;
    if (coverImage) journey.coverImage = coverImage;
    if (waypoints) journey.waypoints = waypoints;
    if (packingList) journey.packingList = packingList;
    if (itineraryDays) journey.itineraryDays = itineraryDays;
    if (expenses) journey.expenses = expenses;
    if (hotelInfo) journey.hotelInfo = hotelInfo;
    if (currentLocation) journey.currentLocation = currentLocation;

    const newSegs = segments || travelSegments;
    if (Array.isArray(newSegs)) {
      journey.segments = newSegs;
      journey.travelSegments = newSegs;
      const totals = recalculateJourneyTotals(newSegs);
      journey.totalDistanceKm = totals.totalDistanceKm;
      journey.totalDurationMinutes = totals.totalDurationMinutes;
      journey.estimatedCo2Kg = totals.estimatedCo2Kg;
    }

    await journey.save();

    res.status(200).json({
      success: true,
      message: 'Journey updated successfully.',
      journey,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete journey by ID
// @route   DELETE /api/journeys/:id
// @access  Private
export const deleteJourney = async (req, res, next) => {
  try {
    const journey = await Journey.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'Journey not found or unauthorized to delete.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Journey deleted successfully.',
      id: req.params.id,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add segment to a journey
// @route   POST /api/journeys/:id/segments
// @access  Private
export const addSegment = async (req, res, next) => {
  try {
    const journey = await Journey.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'Journey not found or unauthorized.',
      });
    }

    const {
      title,
      origin,
      destination,
      type,
      mode,
      transportMode,
      distanceKm,
      durationMinutes,
      startTime,
      transitLine,
      notes,
    } = req.body;

    if (!title || !origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Please provide segment title, origin, and destination.',
      });
    }

    const dist = parseFloat(distanceKm) || 1.0;
    const dur = parseInt(durationMinutes, 10) || 15;
    const order = (journey.segments?.length || 0) + 1;

    const newSegment = {
      id: 'seg-' + Date.now(),
      order,
      type: type || 'walking',
      mode: mode || transportMode || 'Walking',
      transportMode: transportMode || mode || 'Walking',
      title,
      origin,
      from: origin,
      destination,
      to: destination,
      distanceKm: dist,
      distanceMi: parseFloat((dist * 0.621371).toFixed(1)),
      durationMinutes: dur,
      duration: `${dur}m`,
      startTime: startTime || '10:00 AM',
      transitLine: transitLine || null,
      co2SavedKg: parseFloat((dist * 0.12).toFixed(1)),
      status: 'Scheduled',
      notes: notes || '',
    };

    journey.segments.push(newSegment);
    journey.travelSegments = journey.segments;

    const totals = recalculateJourneyTotals(journey.segments);
    journey.totalDistanceKm = totals.totalDistanceKm;
    journey.totalDurationMinutes = totals.totalDurationMinutes;
    journey.estimatedCo2Kg = totals.estimatedCo2Kg;

    await journey.save();

    res.status(201).json({
      success: true,
      message: 'Segment added successfully.',
      journey,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update or delete segment in journey
// @route   PUT /api/journeys/:id/segments/:segmentId
// @access  Private
export const updateSegment = async (req, res, next) => {
  try {
    const journey = await Journey.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'Journey not found or unauthorized.',
      });
    }

    const segment = journey.segments.find(
      (s) => (s._id && s._id.toString() === req.params.segmentId) || s.id === req.params.segmentId
    );
    if (!segment) {
      return res.status(404).json({
        success: false,
        message: 'Segment not found in this journey.',
      });
    }

    Object.assign(segment, req.body);
    if (req.body.distanceKm) {
      segment.distanceMi = parseFloat((req.body.distanceKm * 0.621371).toFixed(1));
    }
    if (req.body.durationMinutes) {
      segment.duration = `${req.body.durationMinutes}m`;
    }

    journey.travelSegments = journey.segments;
    const totals = recalculateJourneyTotals(journey.segments);
    journey.totalDistanceKm = totals.totalDistanceKm;
    journey.totalDurationMinutes = totals.totalDurationMinutes;
    journey.estimatedCo2Kg = totals.estimatedCo2Kg;

    await journey.save();

    res.status(200).json({
      success: true,
      message: 'Segment updated successfully.',
      journey,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete segment from journey
// @route   DELETE /api/journeys/:id/segments/:segmentId
// @access  Private
export const deleteSegment = async (req, res, next) => {
  try {
    const journey = await Journey.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'Journey not found or unauthorized.',
      });
    }

    const segIdx = journey.segments.findIndex(
      (s) => (s._id && s._id.toString() === req.params.segmentId) || s.id === req.params.segmentId
    );

    if (segIdx === -1) {
      return res.status(404).json({
        success: false,
        message: 'Segment not found in this journey.',
      });
    }

    journey.segments.splice(segIdx, 1);
    // Re-index orders
    journey.segments.forEach((s, idx) => {
      s.order = idx + 1;
    });
    journey.travelSegments = journey.segments;

    const totals = recalculateJourneyTotals(journey.segments);
    journey.totalDistanceKm = totals.totalDistanceKm;
    journey.totalDurationMinutes = totals.totalDurationMinutes;
    journey.estimatedCo2Kg = totals.estimatedCo2Kg;

    await journey.save();

    res.status(200).json({
      success: true,
      message: 'Segment deleted successfully.',
      journey,
    });
  } catch (error) {
    next(error);
  }
};

