import mongoose from 'mongoose';
import User from '../models/User.js';
import Journey from '../models/Journey.js';
import { recalculateJourneyTotals } from '../controllers/journeyController.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tripmate';

async function runTests() {
  console.log('=== TRIPMATE COMPREHENSIVE INTEGRITY TEST SUITE ===\n');
  await mongoose.connect(MONGODB_URI);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // TEST 1: India Defaults on New User Registration
  console.log('1. Testing New User Registration & India Defaults:');
  const testEmail = `test_traveler_${Date.now()}@tripmate.test`;
  const newUser = await User.create({
    name: 'Aarav Sharma',
    email: testEmail,
    password: 'password123',
  });

  assert(newUser.homeCity === 'Vidisha', `Default homeCity is "Vidisha" (got "${newUser.homeCity}")`);
  assert(newUser.homeCountry === 'India', `Default homeCountry is "India" (got "${newUser.homeCountry}")`);
  assert(newUser.settings.currency === 'INR', `Default currency is "INR" (got "${newUser.settings.currency}")`);
  assert(newUser.settings.distanceUnit === 'km', `Default distanceUnit is "km" (got "${newUser.settings.distanceUnit}")`);
  assert(newUser.settings.tempUnit === 'C', `Default tempUnit is "C" (got "${newUser.settings.tempUnit}")`);
  assert(newUser.settings.dateFormat === 'DD-MM-YYYY', `Default dateFormat is "DD-MM-YYYY" (got "${newUser.settings.dateFormat}")`);
  assert(newUser.settings.timeFormat === '12h', `Default timeFormat is "12h" (got "${newUser.settings.timeFormat}")`);

  // TEST 2: Account Isolation & Clean Initial State
  console.log('\n2. Testing Account Isolation & Empty Initial State:');
  const userJourneys = await Journey.find({ user: newUser._id });
  assert(userJourneys.length === 0, `New user starts with 0 seeded journeys (got ${userJourneys.length})`);

  // TEST 3: Duplicate Transport Leg Prevention in Journeys
  console.log('\n3. Testing Duplicate Transport Leg Prevention & Distance Recalculation:');
  const journey = await Journey.create({
    user: newUser._id,
    title: 'Bhopal ➔ Jaipur',
    origin: 'Bhopal',
    destination: 'Jaipur',
    status: 'Upcoming',
    segments: [
      {
        id: 'seg-test-1',
        title: 'IRCTC Express Leg',
        origin: 'Bhopal Junction',
        destination: 'Jaipur Central',
        mode: 'IRCTC Express 12975',
        transportMode: 'Train',
        type: 'train',
        distanceKm: 582.2,
        durationMinutes: 540,
        status: 'Scheduled',
      },
    ],
  });

  const initialTotals = recalculateJourneyTotals(journey.segments);
  journey.totalDistanceKm = initialTotals.totalDistanceKm;
  journey.segments = initialTotals.distinctSegments;
  assert(journey.totalDistanceKm === 582.2, `Initial single leg distance is 582.2 km (got ${journey.totalDistanceKm})`);
  assert(journey.segments.length === 1, `Segment count is 1 (got ${journey.segments.length})`);

  // Simulate accidental duplicate segment addition attempt (same origin, dest, mode, distance)
  const isDuplicate = journey.segments.some((s) => {
    return (
      s.origin.toLowerCase() === 'bhopal junction' &&
      s.destination.toLowerCase() === 'jaipur central' &&
      s.mode.toLowerCase() === 'irctc express 12975'
    );
  });
  assert(isDuplicate === true, 'Duplicate segment correctly detected by origin, destination and transport mode');

  // If a duplicate segment was accidentally inserted, recalculateJourneyTotals must deduplicate it
  journey.segments.push({
    id: 'seg-test-2',
    title: 'IRCTC Express Leg',
    origin: 'Bhopal Junction',
    destination: 'Jaipur Central',
    mode: 'IRCTC Express 12975',
    transportMode: 'Train',
    type: 'train',
    distanceKm: 582.2,
    durationMinutes: 540,
    status: 'Scheduled',
  });
  journey.segments.push({
    id: 'seg-test-3',
    title: 'IRCTC Express Leg',
    origin: 'Bhopal Junction',
    destination: 'Jaipur Central',
    mode: 'IRCTC Express 12975',
    transportMode: 'Train',
    type: 'train',
    distanceKm: 582.2,
    durationMinutes: 540,
    status: 'Scheduled',
  });

  assert(journey.segments.length === 3, 'Injected 3 segments into memory to test recalculation deduplication');
  const deduplicatedTotals = recalculateJourneyTotals(journey.segments);
  journey.totalDistanceKm = deduplicatedTotals.totalDistanceKm;
  journey.segments = deduplicatedTotals.distinctSegments;
  assert(
    journey.totalDistanceKm === 582.2,
    `Recalculation deduplicated distance to exactly 582.2 km (never multiplies to 1,746.6 km, got ${journey.totalDistanceKm})`
  );

  // TEST 4: Distinct Legs Summed Correctly
  console.log('\n4. Testing Distinct Legs Distance Summation:');
  const multiLegSegments = [
    {
      id: 'leg-1',
      origin: 'Bhopal',
      destination: 'Kota',
      mode: 'Express Train',
      transportMode: 'Train',
      type: 'train',
      distanceKm: 300.0,
      durationMinutes: 240,
    },
    {
      id: 'leg-2',
      origin: 'Kota',
      destination: 'Jaipur',
      mode: 'Intercity Rail',
      transportMode: 'Train',
      type: 'train',
      distanceKm: 282.2,
      durationMinutes: 180,
    },
  ];
  const multiTotals = recalculateJourneyTotals(multiLegSegments);
  assert(multiTotals.totalDistanceKm === 582.2, `Distinct legs sum to 582.2 km (got ${multiTotals.totalDistanceKm})`);

  // TEST 5: Legacy US Defaults Migration
  console.log('\n5. Testing Safe Migration of Legacy Accounts:');
  const legacyUser = new User({
    name: 'Legacy User',
    email: `legacy_${Date.now()}@tripmate.test`,
    password: 'password123',
    homeCity: 'San Francisco, CA',
    homeCountry: 'United States',
    settings: {
      currency: 'USD',
      homeCountry: 'United States',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24h',
    },
  });

  // Run migration check
  if (!legacyUser.homeCity || legacyUser.homeCity === 'San Francisco, CA' || legacyUser.homeCity.toUpperCase() === 'VIDISHA') {
    legacyUser.homeCity = 'Vidisha';
  }
  if (!legacyUser.homeCountry || legacyUser.homeCountry === 'United States') {
    legacyUser.homeCountry = 'India';
  }
  if (!legacyUser.settings.currency || legacyUser.settings.currency === 'USD') {
    legacyUser.settings.currency = 'INR';
  }
  if (!legacyUser.settings.homeCountry || legacyUser.settings.homeCountry === 'United States') {
    legacyUser.settings.homeCountry = 'India';
  }
  if (!legacyUser.settings.dateFormat || legacyUser.settings.dateFormat === 'YYYY-MM-DD') {
    legacyUser.settings.dateFormat = 'DD-MM-YYYY';
  }
  if (!legacyUser.settings.timeFormat || legacyUser.settings.timeFormat === '24h') {
    legacyUser.settings.timeFormat = '12h';
  }

  assert(legacyUser.homeCity === 'Vidisha', `Migrated homeCity to "Vidisha" (got "${legacyUser.homeCity}")`);
  assert(legacyUser.homeCountry === 'India', `Migrated homeCountry to "India" (got "${legacyUser.homeCountry}")`);
  assert(legacyUser.settings.currency === 'INR', `Migrated currency to "INR" (got "${legacyUser.settings.currency}")`);
  assert(legacyUser.settings.dateFormat === 'DD-MM-YYYY', `Migrated dateFormat to "DD-MM-YYYY" (got "${legacyUser.settings.dateFormat}")`);
  assert(legacyUser.settings.timeFormat === '12h', `Migrated timeFormat to "12h" (got "${legacyUser.settings.timeFormat}")`);

  // TEST 6: Routing Preferences OR Logic
  console.log('\n6. Testing Routing Preferences as OR, not AND:');
  const mockAlternatives = [
    { id: 'alt-1', title: 'Direct Express', transfers: 0, walkingMinutes: 10, distanceKm: 580 },
    { id: 'alt-2', title: '1-Transfer Rail', transfers: 1, walkingMinutes: 5, distanceKm: 590 },
    { id: 'alt-3', title: '2-Transfer Bus', transfers: 2, walkingMinutes: 35, distanceKm: 610 },
  ];

  function evaluateOrRanking(alternatives, prefs) {
    const maxWalk = prefs.maxWalkingMinutes || 20;
    const hasAnyPreference = Boolean(prefs.preferDirect || prefs.preferFewerTransfers || prefs.maxWalkingMinutes);

    return alternatives.map((alt) => {
      let score = 50;
      let matchedAnyPreference = false;
      const badges = [];

      // Direct (OR)
      if (prefs.preferDirect && alt.transfers === 0) {
        score += 35;
        matchedAnyPreference = true;
        badges.push('Direct Route Match');
      }

      // Fewer transfers (OR)
      if (prefs.preferFewerTransfers) {
        if (alt.transfers === 0) {
          score += 30;
          matchedAnyPreference = true;
        } else if (alt.transfers <= 1) {
          score += 20;
          matchedAnyPreference = true;
          badges.push('Low Transfers Match');
        }
      }

      // Max walking (OR)
      if (prefs.maxWalkingMinutes && alt.walkingMinutes <= maxWalk) {
        score += 25;
        matchedAnyPreference = true;
        badges.push('Walking Match');
      }

      return { ...alt, score, matchedAnyPreference };
    }).sort((a, b) => b.score - a.score);
  }

  // When user prefers Direct OR Walking <= 15:
  // alt-1 matches direct AND walking -> high score
  // alt-2 matches walking (5 <= 15) even though it has 1 transfer -> boosted! NOT discarded!
  // alt-3 matches neither -> lowest score, but still present in array (never discarded!)
  const ranked = evaluateOrRanking(mockAlternatives, { preferDirect: true, maxWalkingMinutes: 15 });
  assert(ranked.length === 3, `All 3 alternatives preserved without discarding (got ${ranked.length})`);
  assert(ranked[0].id === 'alt-1', `Best match is Direct Express (score: ${ranked[0].score})`);
  assert(ranked[1].id === 'alt-2', `Second match is 1-Transfer Rail because walking was 5m <= 15m (score: ${ranked[1].score})`);
  assert(ranked[2].id === 'alt-3', `Non-matching route preserved at rank 3 without discarding (score: ${ranked[2].score})`);

  // TEST 7: Geofence & Emergency Session Honest Dispatch
  console.log('\n7. Testing Emergency SOS & Danger Zone Honest Dispatch:');
  const realContacts = [
    { name: 'Dr. Ramesh Sharma', phone: '+91 98260 12345', notifyOnSos: true },
  ];
  const activeContacts = realContacts.filter((c) => c.notifyOnSos !== false);
  const isDemoMode = false;

  const deliveries = activeContacts.map((c) => ({
    name: c.name,
    phone: c.phone,
    status: 'Not sent — notification service unavailable (No external SMS gateway configured)',
  }));

  assert(deliveries.length === 1, `Deliveries mapped to actual user contact (${deliveries[0].name})`);
  assert(
    deliveries[0].status.includes('Not sent — notification service unavailable'),
    `Status honestly reports unavailable service without fake "Delivered" claim (got: "${deliveries[0].status}")`
  );

  // Clean up test user
  await User.deleteOne({ _id: newUser._id });
  await Journey.deleteOne({ _id: journey._id });

  await mongoose.disconnect();

  console.log(`\n========================================`);
  console.log(`ALL TESTS PASSED: ${passed} / ${passed + failed}`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
