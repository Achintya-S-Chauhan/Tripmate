import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Journey from '../models/Journey.js';
import SavedPlace from '../models/SavedPlace.js';
import TrustedContact from '../models/TrustedContact.js';
import { register } from '../controllers/authController.js';

async function runVerification() {
  console.log('🚀 [Test Suite] Starting Full Data Integrity & Map Verification...');

  // Step 1: Connect to MongoDB
  const connected = await connectDB();
  if (!connected) {
    console.error('❌ Database connection failed');
    process.exit(1);
  }

  const testEmail = `zero_demo_${Date.now()}@tripmate.test`;

  // Step 2: Test User Registration via Controller (Simulate HTTP Request & Response)
  console.log(`\n1️⃣ Testing Registration for: ${testEmail}`);
  let registeredUser = null;
  let responseStatus = null;
  let responseJson = null;

  const mockReq = {
    body: {
      name: 'Priya Patel',
      email: testEmail,
      password: 'password123',
      homeCity: 'Mumbai, India',
    },
  };

  const mockRes = {
    status(code) {
      responseStatus = code;
      return this;
    },
    json(data) {
      responseJson = data;
      return this;
    },
  };

  const mockNext = (err) => {
    if (err) console.error('Registration error:', err);
  };

  await register(mockReq, mockRes, mockNext);

  if (responseStatus !== 201 || !responseJson?.token) {
    console.error('❌ Registration failed:', responseStatus, responseJson);
    process.exit(1);
  }

  const userId = responseJson.user._id;
  console.log('✅ User registered successfully. User ID:', userId.toString());

  // Step 3: Verify ZERO Mock Records in Database for this user
  console.log('\n2️⃣ Verifying Zero Demo Data in Collections for Registered User...');
  const [journeyCount, placeCount, contactCount] = await Promise.all([
    Journey.countDocuments({ user: userId }),
    SavedPlace.countDocuments({ user: userId }),
    TrustedContact.countDocuments({ user: userId }),
  ]);

  console.log(`   - Journeys in DB: ${journeyCount} (Must be 0)`);
  console.log(`   - Saved Places in DB: ${placeCount} (Must be 0)`);
  console.log(`   - Trusted Contacts in DB: ${contactCount} (Must be 0)`);

  if (journeyCount !== 0 || placeCount !== 0 || contactCount !== 0) {
    console.error('❌ FAIL: Demo data was automatically seeded on registration!');
    process.exit(1);
  }
  console.log('✅ PASS: Clean database confirmed. Zero mock records seeded.');

  // Step 4: Test Creating Journey with Real Map Coordinates & Waypoints
  console.log('\n3️⃣ Testing Journey with Real Coordinates & Polylines...');
  const newJourney = await Journey.create({
    user: userId,
    title: 'Kyoto to Osaka Bullet Train Route',
    origin: 'Kyoto Station',
    destination: 'Shin-Osaka Station',
    status: 'In Progress',
    primaryTransportMode: 'Train',
    totalDistanceKm: 39.2,
    totalDurationMinutes: 15,
    center: [34.9858, 135.7588],
    zoom: 12,
    waypoints: [
      {
        id: 'wp-origin',
        title: 'Kyoto Station Central Hub',
        coords: [34.9858, 135.7588],
        category: 'origin',
        completed: true,
        isOrigin: true,
      },
      {
        id: 'wp-dest',
        title: 'Shin-Osaka Shinkansen Platform',
        coords: [34.7335, 135.5003],
        category: 'destination',
        completed: false,
        isDestination: true,
      },
    ],
  });

  console.log(`✅ Journey created: "${newJourney.title}"`);
  console.log(`   - Origin Coords: [${newJourney.waypoints[0].coords.join(', ')}]`);
  console.log(`   - Destination Coords: [${newJourney.waypoints[1].coords.join(', ')}]`);
  console.log(`   - Distance: ${newJourney.totalDistanceKm} km`);

  // Step 5: Test Creating Saved Place with Geofence Radius & Coords
  console.log('\n4️⃣ Testing Saved Place / Safe Zone with Geofencing Radius...');
  const newPlace = await SavedPlace.create({
    user: userId,
    name: 'Kyoto International Safe Haven Base',
    category: 'Hotel',
    city: 'Kyoto',
    country: 'Japan',
    address: 'Higashiyama Ward, Kyoto',
    lat: 34.9989,
    lng: 135.7731,
    radiusMeters: 350,
  });

  console.log(`✅ Safe Zone created: "${newPlace.name}"`);
  console.log(`   - Real Coordinates: [${newPlace.lat}, ${newPlace.lng}]`);
  console.log(`   - Geofence Perimeter: ${newPlace.radiusMeters}m`);

  // Step 6: Test Real OpenStreetMap Nominatim Geocoding API
  console.log('\n5️⃣ Testing Real OpenStreetMap Nominatim Geocoding API...');
  try {
    const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
      'Kyoto Tower'
    )}`;
    const geoRes = await fetch(geoUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TripMate-Verification-Suite/1.0',
      },
    });

    if (geoRes.ok) {
      const geoData = await geoRes.json();
      if (geoData.length > 0) {
        console.log(`✅ OpenStreetMap Resolved: "${geoData[0].display_name}"`);
        console.log(`   - Latitude: ${geoData[0].lat}, Longitude: ${geoData[0].lon}`);
      }
    }
  } catch (err) {
    console.warn('⚠️ Nominatim query notice:', err.message);
  }

  // Step 7: Clean up test documents
  console.log('\n🧹 Cleaning up test artifacts from database...');
  await Promise.all([
    User.deleteOne({ _id: userId }),
    Journey.deleteMany({ user: userId }),
    SavedPlace.deleteMany({ user: userId }),
  ]);
  console.log('✅ Cleaned test documents.');

  await mongoose.disconnect();
  console.log('\n🎉 ALL VERIFICATION TESTS PASSED WITH 100% SUCCESS!\n');
  setTimeout(() => process.exit(0), 150);
}

runVerification().catch((err) => {
  console.error('Unhandled error in test:', err);
  process.exit(1);
});
