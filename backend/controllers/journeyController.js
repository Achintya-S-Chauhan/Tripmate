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

// @desc    Create a new journey / trip
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
      isUndated,
      status,
      currency,
      primaryTransportMode,
      transitTypes,
      summary,
      notes,
      budget,
      segments,
      stays,
      places,
      waypoints,
      coverImage,
    } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Please provide origin and destination.',
      });
    }

    // New trips start clean with supplied segments or empty array
    const initialSegments = Array.isArray(segments) ? segments : [];
    const totals = recalculateJourneyTotals(initialSegments);

    const sDate = startDate || travelDate || null;
    const eDate = endDate || null;
    const isTripUndated = Boolean(isUndated || (!sDate && !eDate));

    const finalTitle = title && title.trim() ? title.trim() : `${origin.trim()} ➔ ${destination.trim()}`;

    const journey = await Journey.create({
      user: req.user._id,
      title: finalTitle,
      origin: origin.trim(),
      destination: destination.trim(),
      travelDate: sDate || '',
      startDate: sDate || '',
      endDate: eDate || '',
      isUndated: isTripUndated,
      status: status || 'Upcoming',
      currency: currency || 'USD',
      primaryTransportMode: primaryTransportMode || 'Multi-Modal',
      transitTypes: transitTypes || ['multi-modal'],
      totalDistanceKm: totals.totalDistanceKm,
      totalDurationMinutes: totals.totalDurationMinutes,
      estimatedCo2Kg: totals.estimatedCo2Kg,
      summary: summary || '',
      notes: notes || '',
      budget: parseFloat(budget) || 0,
      spent: 0,
      center: req.body.center || (waypoints && waypoints[0]?.coords) || [20, 0],
      zoom: req.body.zoom || (waypoints && waypoints.length > 0 ? 12 : 2),
      coverImage:
        coverImage ||
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
      waypoints: Array.isArray(waypoints) ? waypoints : [],
      routeGeometry: Array.isArray(req.body.routeGeometry) ? req.body.routeGeometry : [],
      segments: initialSegments,
      travelSegments: initialSegments,
      stays: Array.isArray(stays) ? stays : [],
      places: Array.isArray(places) ? places : [],
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
      isUndated,
      status,
      currency,
      primaryTransportMode,
      summary,
      notes,
      budget,
      spent,
      coverImage,
      segments,
      travelSegments,
      stays,
      places,
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
    if (travelDate !== undefined) journey.travelDate = travelDate;
    if (startDate !== undefined) journey.startDate = startDate;
    if (endDate !== undefined) journey.endDate = endDate;
    if (isUndated !== undefined) journey.isUndated = Boolean(isUndated);
    if (status) journey.status = status;
    if (currency) journey.currency = currency;
    if (primaryTransportMode) journey.primaryTransportMode = primaryTransportMode;
    if (summary !== undefined) journey.summary = summary;
    if (notes !== undefined) journey.notes = notes;
    if (budget !== undefined) journey.budget = parseFloat(budget) || 0;
    if (spent !== undefined) journey.spent = parseFloat(spent) || 0;
    if (coverImage) journey.coverImage = coverImage;
    if (waypoints) journey.waypoints = waypoints;
    if (stays) journey.stays = stays;
    if (places) journey.places = places;
    if (packingList) journey.packingList = packingList;
    if (itineraryDays) journey.itineraryDays = itineraryDays;
    if (expenses) journey.expenses = expenses;
    if (hotelInfo) journey.hotelInfo = hotelInfo;
    if (currentLocation) journey.currentLocation = currentLocation;
    if (req.body.center) journey.center = req.body.center;
    if (req.body.zoom) journey.zoom = req.body.zoom;
    if (req.body.routeGeometry) journey.routeGeometry = req.body.routeGeometry;

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

// @desc    Duplicate an existing journey / trip
// @route   POST /api/journeys/:id/duplicate
// @access  Private
export const duplicateJourney = async (req, res, next) => {
  try {
    const original = await Journey.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!original) {
      return res.status(404).json({
        success: false,
        message: 'Original journey not found.',
      });
    }

    const origObj = original.toObject();
    delete origObj._id;
    delete origObj.id;
    delete origObj.createdAt;
    delete origObj.updatedAt;

    origObj.title = `${original.title} (Copy)`;
    origObj.status = 'Draft';

    const duplicated = await Journey.create(origObj);

    res.status(201).json({
      success: true,
      message: 'Journey duplicated successfully.',
      journey: duplicated,
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
      endTime,
      departureDate,
      arrivalDate,
      departureStation,
      arrivalStation,
      operator,
      serviceNumber,
      transfers,
      price,
      currency,
      costType,
      bookingStatus,
      bookingUrl,
      source,
      transitLine,
      notes,
      originCoords,
      destinationCoords,
      geometry,
    } = req.body;

    if (!title || !origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Please provide segment title, origin, and destination.',
      });
    }

    const dist = parseFloat(distanceKm) || 0;
    const dur = parseInt(durationMinutes, 10) || 0;
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
      startTime: startTime || '',
      endTime: endTime || '',
      departureDate: departureDate || journey.startDate || '',
      arrivalDate: arrivalDate || journey.startDate || '',
      departureStation: departureStation || '',
      arrivalStation: arrivalStation || '',
      operator: operator || '',
      serviceNumber: serviceNumber || '',
      transfers: parseInt(transfers, 10) || 0,
      price: price != null ? parseFloat(price) : undefined,
      currency: currency || journey.currency || 'USD',
      costType: costType || 'planned',
      bookingStatus: bookingStatus || 'planned',
      bookingUrl: bookingUrl || '',
      source: source || 'manual',
      transitLine: transitLine || null,
      co2SavedKg: parseFloat((dist * 0.12).toFixed(1)),
      status: 'Scheduled',
      notes: notes || '',
      originCoords: originCoords || undefined,
      destinationCoords: destinationCoords || undefined,
      geometry: Array.isArray(geometry) ? geometry : [],
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

// @desc    Update segment in journey
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
    if (req.body.distanceKm != null) {
      segment.distanceMi = parseFloat((Number(req.body.distanceKm) * 0.621371).toFixed(1));
    }
    if (req.body.durationMinutes != null) {
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
