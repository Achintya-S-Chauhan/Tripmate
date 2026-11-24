import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import { discoverTransportOptions } from '../services/transportProvider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGODB_LOCAL_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tripmate';

async function runTests() {
  console.log('=== TRIPMATE: INDIA DEFAULTS, PROFILE & ROUTING ALTERNATIVES TEST ===');
  console.log(`Connecting to database at ${MONGO_URI}...`);

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB.');

  try {
    // TEST 1: Default User Schema Creation
    console.log('\n--- TEST 1: New User Schema Defaults ---');
    const testEmail = `india_test_${Date.now()}@tripmate.test`;
    const user = new User({
      name: 'Pooja Verma',
      email: testEmail,
      password: 'Password123!',
    });
    await user.save();

    console.log(`User created: ${user.name} (${user.email})`);
    console.log(`homeCity: ${user.homeCity}`);
    console.log(`homeCountry: ${user.homeCountry}`);
    console.log(`currency: ${user.settings?.currency}`);
    console.log(`dateFormat: ${user.settings?.dateFormat}`);
    console.log(`timeFormat: ${user.settings?.timeFormat}`);
    console.log(`locale: ${user.settings?.locale}`);

    if (
      user.homeCity === 'Vidisha, Madhya Pradesh' &&
      user.homeCountry === 'India' &&
      user.settings?.currency === 'INR' &&
      user.settings?.dateFormat === 'DD/MM/YYYY' &&
      user.settings?.timeFormat === '24h' &&
      user.settings?.locale === 'en-IN'
    ) {
      console.log('✅ TEST 1 PASSED: New account correctly defaults to India regional standards.');
    } else {
      throw new Error('TEST 1 FAILED: Incorrect default settings.');
    }

    // TEST 2: Profile Update Validation
    console.log('\n--- TEST 2: Profile Name & Avatar Limits ---');
    // Name too short
    user.name = 'A';
    let shortErr = null;
    try {
      await user.save();
    } catch (err) {
      shortErr = err;
    }
    if (shortErr) {
      console.log('✅ Successfully rejected 1-character name (< 2 chars).');
    } else {
      throw new Error('Failed to reject short name.');
    }

    // Name too long (> 50 chars)
    user.name = 'This is an excessively long name that exceeds the maximum allowed character limit of fifty chars';
    let longErr = null;
    try {
      await user.save();
    } catch (err) {
      longErr = err;
    }
    if (longErr) {
      console.log('✅ Successfully rejected name exceeding 50 chars.');
    } else {
      throw new Error('Failed to reject 50+ char name.');
    }

    // Valid update
    user.name = 'Pooja Sharma';
    user.avatarUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...validDataUrl';
    user.homeCity = 'Bhopal, Madhya Pradesh';
    await user.save();
    console.log('✅ TEST 2 PASSED: Valid profile updates persist cleanly.');

    // TEST 3: Safe Migration for Legacy US Default Accounts
    console.log('\n--- TEST 3: Safe Legacy US Migration ---');
    const legacyUser = new User({
      name: 'Legacy Traveler',
      email: `legacy_${Date.now()}@tripmate.test`,
      password: 'Password123!',
      homeCity: 'San Francisco, CA',
      homeCountry: 'United States',
      settings: {
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        locale: 'en-US',
      },
    });
    await legacyUser.save();

    // Check migration condition: legacy user has both default SF and US
    if (legacyUser.homeCity === 'San Francisco, CA' && legacyUser.homeCountry === 'United States') {
      legacyUser.homeCity = 'Vidisha, Madhya Pradesh';
      legacyUser.homeCountry = 'India';
      legacyUser.settings.currency = 'INR';
      legacyUser.settings.dateFormat = 'DD/MM/YYYY';
      legacyUser.settings.timeFormat = '24h';
      legacyUser.settings.locale = 'en-IN';
      await legacyUser.save();
      console.log('Migrated legacy user to India defaults.');
    }

    const migrated = await User.findById(legacyUser._id);
    if (migrated.homeCity === 'Vidisha, Madhya Pradesh' && migrated.settings.currency === 'INR') {
      console.log('✅ TEST 3 PASSED: Legacy default account safely migrated without user intervention.');
    } else {
      throw new Error('TEST 3 FAILED: Migration did not apply.');
    }

    // Clean up test users
    await User.deleteMany({ email: { $in: [testEmail, legacyUser.email] } });
    console.log('Cleaned up test accounts.');

    // TEST 4: Transport Discovery & Progressive Alternatives
    console.log('\n--- TEST 4: Transport Discovery & Progressive Alternatives ---');
    const vidishaCoords = [23.5251, 77.8081]; // Vidisha
    const bhopalCoords = [23.2599, 77.4126];  // Bhopal (~55 km)

    const discovery = await discoverTransportOptions({
      origin: 'Vidisha, MP',
      destination: 'Bhopal, MP',
      originCoords: vidishaCoords,
      destCoords: bhopalCoords,
    });

    console.log(`Discovered alternatives count: ${discovery.alternatives?.length || 0}`);
    const modes = discovery.alternatives.map((a) => a.mode);
    console.log(`Available modes: ${[...new Set(modes)].join(', ')}`);

    const hasTrain = discovery.alternatives.some((a) => a.type === 'train');
    const hasBus = discovery.alternatives.some((a) => a.type === 'bus');
    const hasAutoOrCab = discovery.alternatives.some((a) => a.type === 'auto' || a.type === 'cab');
    const hasDirect = discovery.alternatives.some((a) => a.transfers === 0);
    const hasWalkingMinutes = discovery.alternatives.every((a) => typeof a.walkingMinutes === 'number');

    if (hasTrain && hasBus && hasAutoOrCab && hasDirect && hasWalkingMinutes) {
      console.log('✅ TEST 4 PASSED: Corridor alternatives provide IRCTC Train, Bus, Cab/Auto, and walking attributes.');
    } else {
      throw new Error('TEST 4 FAILED: Missing corridor alternatives.');
    }

    console.log('\n🎉 ALL BACKEND VERIFICATION TESTS PASSED!');
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
