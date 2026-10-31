import SavedPlace from '../models/SavedPlace.js';

// @desc    Get all saved places for authenticated user
// @route   GET /api/saved-places
// @access  Private
export const getSavedPlaces = async (req, res, next) => {
  try {
    const places = await SavedPlace.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: places.length,
      places,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new saved place / safe zone
// @route   POST /api/saved-places
// @access  Private
export const createSavedPlace = async (req, res, next) => {
  try {
    let {
      name,
      category,
      city,
      country,
      address,
      rating,
      hours,
      tags,
      notes,
      radiusMeters,
      lat,
      lng,
      coords,
      imageUrl,
      isMustVisit,
    } = req.body;

    if ((lat === undefined || lng === undefined) && Array.isArray(coords) && coords.length === 2) {
      lat = coords[0];
      lng = coords[1];
    }

    if (!name || lat === undefined || lng === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide place name, latitude, and longitude.',
      });
    }

    const place = await SavedPlace.create({
      user: req.user._id,
      name: name.trim(),
      category: category || 'Hotel',
      city: city || '',
      country: country || '',
      address: address || '',
      rating: parseFloat(rating) || 4.5,
      hours: hours || '24/7 Access',
      tags: Array.isArray(tags)
        ? tags
        : typeof tags === 'string'
        ? tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
      notes: notes || '',
      radiusMeters: parseInt(radiusMeters, 10) || 250,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      imageUrl:
        imageUrl ||
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
      isMustVisit: isMustVisit === true,
    });

    res.status(201).json({
      success: true,
      message: 'Saved place created successfully.',
      place,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update saved place by ID
// @route   PUT /api/saved-places/:id
// @access  Private
export const updateSavedPlace = async (req, res, next) => {
  try {
    const place = await SavedPlace.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'Saved place not found or unauthorized to edit.',
      });
    }

    const {
      name,
      category,
      city,
      country,
      address,
      rating,
      hours,
      tags,
      notes,
      radiusMeters,
      lat,
      lng,
      coords,
      imageUrl,
      isMustVisit,
    } = req.body;

    if (name) place.name = name.trim();
    if (category) place.category = category;
    if (city !== undefined) place.city = city;
    if (country !== undefined) place.country = country;
    if (address !== undefined) place.address = address;
    if (rating !== undefined) place.rating = parseFloat(rating) || place.rating;
    if (hours !== undefined) place.hours = hours;
    if (notes !== undefined) place.notes = notes;
    if (radiusMeters !== undefined) place.radiusMeters = parseInt(radiusMeters, 10) || place.radiusMeters;
    if (imageUrl) place.imageUrl = imageUrl;
    if (isMustVisit !== undefined) place.isMustVisit = Boolean(isMustVisit);

    if (lat !== undefined) place.lat = parseFloat(lat);
    if (lng !== undefined) place.lng = parseFloat(lng);
    if (Array.isArray(coords) && coords.length === 2) {
      place.lat = parseFloat(coords[0]);
      place.lng = parseFloat(coords[1]);
    }

    if (tags !== undefined) {
      place.tags = Array.isArray(tags)
        ? tags
        : typeof tags === 'string'
        ? tags.split(',').map((t) => t.trim()).filter(Boolean)
        : place.tags;
    }

    await place.save();

    res.status(200).json({
      success: true,
      message: 'Saved place updated successfully.',
      place,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete saved place by ID
// @route   DELETE /api/saved-places/:id
// @access  Private
export const deleteSavedPlace = async (req, res, next) => {
  try {
    const place = await SavedPlace.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'Saved place not found or unauthorized to delete.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Saved place deleted successfully.',
      id: req.params.id,
    });
  } catch (error) {
    next(error);
  }
};

