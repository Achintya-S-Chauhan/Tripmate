import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Don't return password in query results by default
    },
    avatarUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    },
    homeCity: {
      type: String,
      default: 'Vidisha, Madhya Pradesh',
    },
    homeCountry: {
      type: String,
      default: 'India',
    },
    membership: {
      type: String,
      default: 'TripMate Explorer',
    },
    safeTravelScore: {
      type: Number,
      default: 98,
      min: 0,
      max: 100,
    },
    settings: {
      distanceUnit: { type: String, enum: ['km', 'mi'], default: 'km' },
      tempUnit: { type: String, enum: ['C', 'F'], default: 'C' },
      currency: { type: String, default: 'INR' },
      homeCountry: { type: String, default: 'India' },
      dateFormat: { type: String, default: 'DD/MM/YYYY' },
      timeFormat: { type: String, enum: ['12h', '24h'], default: '24h' },
      locale: { type: String, default: 'en-IN' },
      theme: { type: String, enum: ['forest', 'ocean', 'sand', 'slate', 'dark', 'light'], default: 'forest' },
      themeFamily: { type: String, default: 'forest' },
      appearance: { type: String, enum: ['light', 'dark', 'system'], default: 'dark' },
      reducedMotion: { type: Boolean, default: false },
      travelPreferences: {
        preferFewerTransfers: { type: Boolean, default: false },
        preferDirect: { type: Boolean, default: false },
        maxWalkingMinutes: { type: Number, default: 20 },
      },
      safetySensitivity: { type: String, default: 'Standard' },
      autoCheckinInterval: { type: String, default: '8h' },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving if modified
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to compare password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Safe JSON serialization
UserSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

const User = mongoose.model('User', UserSchema);
export default User;
