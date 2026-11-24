import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Helper to generate signed JWT token
const generateToken = (userId) => {
  const secret =
    process.env.JWT_SECRET ||
    'tripmate_development_secret_key_change_in_production_min32chars';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign({ id: userId }, secret, { expiresIn });
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

    // Create user record with India defaults
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      homeCity: homeCity?.trim() || 'Vidisha',
      homeCountry: 'India',
      avatarUrl:
        avatarUrl ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      settings: {
        distanceUnit: 'km',
        tempUnit: 'C',
        currency: 'INR',
        homeCountry: 'India',
        dateFormat: 'DD-MM-YYYY',
        timeFormat: '12h',
        locale: 'en-IN',
        theme: 'forest',
        themeFamily: 'forest',
        appearance: 'dark',
      },
    });

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
    let user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    // Safe migration: upgrade legacy US defaults to India defaults without touching custom settings
    let shouldSave = false;
    if (!user.homeCity || user.homeCity === 'San Francisco, CA' || user.homeCity.toUpperCase() === 'VIDISHA') {
      user.homeCity = 'Vidisha';
      shouldSave = true;
    }
    if (!user.homeCountry || user.homeCountry === 'United States') {
      user.homeCountry = 'India';
      shouldSave = true;
    }
    if (!user.settings) user.settings = {};
    if (!user.settings.currency || user.settings.currency === 'USD') {
      user.settings.currency = 'INR';
      shouldSave = true;
    }
    if (!user.settings.homeCountry || user.settings.homeCountry === 'United States') {
      user.settings.homeCountry = 'India';
      shouldSave = true;
    }
    if (!user.settings.dateFormat || user.settings.dateFormat === 'YYYY-MM-DD' || user.settings.dateFormat === 'DD/MM/YYYY') {
      user.settings.dateFormat = 'DD-MM-YYYY';
      shouldSave = true;
    }
    if (!user.settings.timeFormat || user.settings.timeFormat === '24h') {
      user.settings.timeFormat = '12h';
      shouldSave = true;
    }
    if (!user.settings.distanceUnit) {
      user.settings.distanceUnit = 'km';
      shouldSave = true;
    }
    if (!user.settings.tempUnit) {
      user.settings.tempUnit = 'C';
      shouldSave = true;
    }
    if (shouldSave) {
      await user.save();
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
    const { name, homeCity, homeCountry, avatarUrl, settings } = req.body;

    const fieldsToUpdate = {};
    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (trimmedName.length < 2 || trimmedName.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Full name must be between 2 and 50 characters long.',
        });
      }
      fieldsToUpdate.name = trimmedName;
    }

    if (homeCity !== undefined) fieldsToUpdate.homeCity = String(homeCity).trim();
    if (homeCountry !== undefined) fieldsToUpdate.homeCountry = String(homeCountry).trim();

    if (avatarUrl !== undefined) {
      // Validate image data URL or URL size to avoid giant mongo documents (> 500KB)
      if (typeof avatarUrl === 'string' && avatarUrl.length > 700000) {
        return res.status(400).json({
          success: false,
          message: 'Avatar image is too large. Please select an image under 500KB.',
        });
      }
      fieldsToUpdate.avatarUrl = avatarUrl;
    }

    if (settings !== undefined) {
      fieldsToUpdate.settings = settings;
    }

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
