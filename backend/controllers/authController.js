import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Journey from '../models/Journey.js';
import SavedPlace from '../models/SavedPlace.js';
import TrustedContact from '../models/TrustedContact.js';

// Helper to generate signed JWT token
const generateToken = (userId) => {
  const secret =
    process.env.JWT_SECRET ||
    'tripmate_development_secret_key_change_in_production_min32chars';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign({ id: userId }, secret, { expiresIn });
};

// Seed initial starter data for a newly registered user
const seedUserData = async (userId) => {
  try {
    // 1. Starter Journey (Kyoto Cultural Odyssey)
    await Journey.create({
      user: userId,
      title: 'Kyoto Cultural Odyssey',
      origin: 'Kansai International Airport (KIX)',
      destination: 'Kyoto Cultural District',
      travelDate: new Date().toISOString().split('T')[0],
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      currentDay: 1,
      totalDays: 4,
      status: 'In Progress',
      countryCode: 'JP',
      primaryTransportMode: 'Haruka Express + Walking',
      transitTypes: ['train', 'walking', 'bus'],
      totalDistanceKm: 78.4,
      totalDurationMinutes: 110,
      estimatedCo2Kg: 5.6,
      budget: 1800,
      spent: 420,
      center: [35.0037, 135.777],
      zoom: 13,
      currentLocation: {
        name: 'The Celestine Hotel Gion Base',
        coords: [34.9989, 135.7731],
        updatedAgo: 'Just now',
        safeZone: true,
      },
      hotelInfo: {
        name: 'The Celestine Hotel Gion',
        address: '572 Komatsucho, Higashiyama Ward, Kyoto 605-0931',
        phone: '+81 75-532-3111',
      },
      localEmergencyNumbers: {
        police: '110',
        ambulance: '119',
        campusSecurity: '075-753-2250',
      },
      waypoints: [
        {
          id: 'wp-1',
          title: 'Kansai Airport Terminal 1',
          category: 'origin',
          coords: [34.4347, 135.2442],
          day: 1,
          time: '09:00 AM',
          notes: 'Immigration & Kansai IC card pickup',
          completed: true,
          isOrigin: true,
        },
        {
          id: 'wp-2',
          title: 'JR Haruka Express Leg',
          category: 'transit',
          coords: [34.6937, 135.5023],
          day: 1,
          time: '10:15 AM',
          notes: 'Direct limited express rail to Kyoto Station',
          completed: true,
        },
        {
          id: 'wp-3',
          title: 'Kyoto Station Central Hub',
          category: 'transit',
          coords: [34.9858, 135.7588],
          day: 1,
          time: '10:45 AM',
          notes: 'Transfer to municipal subway / taxi',
          completed: true,
        },
        {
          id: 'wp-4',
          title: 'The Celestine Hotel Gion',
          category: 'destination',
          coords: [34.9989, 135.7731],
          day: 1,
          time: '11:30 AM',
          notes: 'Luggage drop & initial safety base check-in',
          completed: false,
          isDestination: true,
        },
      ],
      segments: [
        {
          id: 'seg-1',
          order: 1,
          type: 'train',
          mode: 'Haruka Limited Express',
          transportMode: 'Train',
          title: 'Haruka Airport Express: KIX to Kyoto Central',
          origin: 'Kansai Int Airport (KIX)',
          destination: 'Kyoto Station Hub',
          distanceKm: 75.0,
          distanceMi: 46.6,
          durationMinutes: 75,
          duration: '1h 15m',
          startTime: '09:30 AM',
          endTime: '10:45 AM',
          transitLine: 'JR West Haruka Line',
          co2SavedKg: 14.2,
          isStop: false,
          status: 'Completed',
          notes: 'Clean electric express rail. Ticket verified.',
        },
        {
          id: 'seg-2',
          order: 2,
          type: 'walking',
          mode: 'Walking',
          transportMode: 'Walking',
          title: 'Scenic Historic Walk to Gion Lodging',
          origin: 'Kyoto Station Karasuma Exit',
          destination: 'The Celestine Hotel Gion',
          distanceKm: 3.4,
          distanceMi: 2.1,
          durationMinutes: 35,
          duration: '35m',
          startTime: '10:55 AM',
          endTime: '11:30 AM',
          transitLine: 'Pedestrian Green Way',
          co2SavedKg: 0.6,
          isStop: false,
          status: 'In Progress',
          notes: 'Walk past Kamo River and Kennin-ji temple grounds.',
        },
      ],
      travelSegments: [
        {
          id: 'seg-1',
          order: 1,
          type: 'train',
          mode: 'Haruka Limited Express',
          transportMode: 'Train',
          title: 'Haruka Airport Express: KIX to Kyoto Central',
          origin: 'Kansai Int Airport (KIX)',
          destination: 'Kyoto Station Hub',
          distanceKm: 75.0,
          distanceMi: 46.6,
          durationMinutes: 75,
          duration: '1h 15m',
          startTime: '09:30 AM',
          endTime: '10:45 AM',
          transitLine: 'JR West Haruka Line',
          co2SavedKg: 14.2,
          isStop: false,
          status: 'Completed',
        },
        {
          id: 'seg-2',
          order: 2,
          type: 'walking',
          mode: 'Walking',
          transportMode: 'Walking',
          title: 'Scenic Historic Walk to Gion Lodging',
          origin: 'Kyoto Station Karasuma Exit',
          destination: 'The Celestine Hotel Gion',
          distanceKm: 3.4,
          distanceMi: 2.1,
          durationMinutes: 35,
          duration: '35m',
          startTime: '10:55 AM',
          endTime: '11:30 AM',
          transitLine: 'Pedestrian Green Way',
          co2SavedKg: 0.6,
          isStop: false,
          status: 'In Progress',
        },
      ],
    });

    // 2. Starter Saved Places / Geofence Zones
    await SavedPlace.create([
      {
        user: userId,
        name: 'The Celestine Hotel Gion',
        category: 'Hotel',
        city: 'Kyoto',
        country: 'Japan',
        address: '572 Komatsucho, Higashiyama Ward, Kyoto 605-0931',
        rating: 4.9,
        hours: '24/7 Front Desk',
        tags: ['Hotel Base', 'Concierge', 'Safe Haven'],
        notes: 'Primary lodging base with 24h assistance and English-speaking staff.',
        radiusMeters: 250,
        lat: 34.9989,
        lng: 135.7731,
        isMustVisit: true,
      },
      {
        user: userId,
        name: 'Kyoto Prefectural Police Foreign Desk',
        category: 'Checkpoint',
        city: 'Kyoto',
        country: 'Japan',
        address: 'Kamigyo Ward, Yabunouchicho 85-3',
        rating: 4.9,
        hours: '24 Hours Emergency',
        tags: ['24/7 Police', 'Lost & Found', 'English Support'],
        notes: 'Dedicated consular desk for foreign visitors and emergency filings.',
        radiusMeters: 300,
        lat: 35.021,
        lng: 135.754,
        isMustVisit: false,
      },
      {
        user: userId,
        name: 'Kyoto Central Rail Hub',
        category: 'Transit Hub',
        city: 'Kyoto',
        country: 'Japan',
        address: 'Shimogyo Ward, Higashishiokojicho',
        rating: 4.8,
        hours: '05:00 AM - 11:45 PM',
        tags: ['Shinkansen', 'Bus Terminal', 'Medical Clinic'],
        notes: 'Main transit interchange with JR lines, subways, and airport express.',
        radiusMeters: 500,
        lat: 34.9858,
        lng: 135.7588,
        isMustVisit: false,
      },
    ]);

    // 3. Starter Trusted Contacts
    await TrustedContact.create([
      {
        user: userId,
        name: 'Morgan Sterling',
        relation: 'Spouse / Primary Contact',
        phone: '+1 (415) 555-0192',
        email: 'morgan.s@example.com',
        notifyOnSos: true,
        status: 'Verified Contact',
        channels: ['Simulated SMS', 'Relay Ping'],
      },
      {
        user: userId,
        name: 'David Sterling',
        relation: 'Brother / Alternate Contact',
        phone: '+1 (415) 555-0144',
        email: 'david.s@example.com',
        notifyOnSos: true,
        status: 'Verified Contact',
        channels: ['Simulated SMS'],
      },
    ]);
  } catch (error) {
    console.error('⚠️ [Seed Error] Could not seed starter data for new user:', error.message);
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password, homeCity, avatarUrl } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email, and password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Check existing email
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.',
      });
    }

    // Create user record
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      homeCity: homeCity?.trim() || 'San Francisco, CA',
      avatarUrl:
        avatarUrl ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    });

    // Populate initial starter records for presentation readiness
    await seedUserData(user._id);

    // Issue JWT
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    // Find user with password selected
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      '+password'
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. No account found with this email.',
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password does not match.',
      });
    }

    // Issue token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Signed in successfully.',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently authenticated user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile & settings
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const { name, homeCity, avatarUrl, settings } = req.body;

    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name.trim();
    if (homeCity) fieldsToUpdate.homeCity = homeCity.trim();
    if (avatarUrl) fieldsToUpdate.avatarUrl = avatarUrl;
    if (settings) fieldsToUpdate.settings = settings;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: fieldsToUpdate },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

