import mongoose from 'mongoose';
import User from '../models/User.js';
import Journey from '../models/Journey.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tripmate';

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB at', MONGODB_URI);

  // 1. Inspect and update mastergamer77ak@gmail.com
  const user = await User.findOne({ email: 'mastergamer77ak@gmail.com' });
  if (user) {
    console.log('Found user:', user.email, 'Current homeCity:', user.homeCity, 'Country:', user.homeCountry);
    let userChanged = false;
    if (!user.homeCountry || user.homeCountry !== 'India') {
      user.homeCountry = 'India';
      userChanged = true;
    }
    if (!user.homeCity || user.homeCity.toUpperCase() === 'VIDISHA' || user.homeCity === 'San Francisco, CA') {
      user.homeCity = 'Vidisha';
      userChanged = true;
    }
    if (!user.settings) user.settings = {};
    if (user.settings.currency !== 'INR') {
      user.settings.currency = 'INR';
      userChanged = true;
    }
    if (user.settings.timeFormat !== '12h') {
      user.settings.timeFormat = '12h';
      userChanged = true;
    }
    if (user.settings.dateFormat !== 'DD-MM-YYYY') {
      user.settings.dateFormat = 'DD-MM-YYYY';
      userChanged = true;
    }
    if (userChanged) {
      await user.save();
      console.log('Updated user settings to India defaults (Vidisha, India, INR, 12h, DD-MM-YYYY)');
    }
  }

  // 2. Remove seeded demo trips from authenticated accounts
  const deletedSeeded = await Journey.deleteMany({
    $or: [
      { isDemoData: true },
      { title: 'Kyoto Cultural Odyssey' },
    ],
  });
  console.log('Purged demo/seeded journeys from DB:', deletedSeeded.deletedCount);

  // 3. Inspect user journeys and deduplicate segments
  const journeys = await Journey.find({});
  for (const j of journeys) {
    const rawSegments = j.segments || [];
    const seen = new Set();
    const distinctSegments = [];

    for (const s of rawSegments) {
      const o = (s.origin || s.from || '').trim().toLowerCase();
      const d = (s.destination || s.to || '').trim().toLowerCase();
      const m = (s.transportMode || s.mode || s.type || '').trim().toLowerCase();
      const dist = parseFloat(s.distanceKm) || 0;
      const key = `${o}-->${d}::${m}::${dist.toFixed(1)}`;

      if (!seen.has(key)) {
        seen.add(key);
        distinctSegments.push(s);
      }
    }

    if (distinctSegments.length !== rawSegments.length) {
      console.log(`Deduplicating journey "${j.title}" from ${rawSegments.length} to ${distinctSegments.length} segments`);
      j.segments = distinctSegments;
      j.travelSegments = distinctSegments;
      const totalDist = parseFloat(
        distinctSegments.reduce((sum, s) => sum + (parseFloat(s.distanceKm) || 0), 0).toFixed(1)
      );
      j.totalDistanceKm = totalDist;
      await j.save();
      console.log(`Updated journey "${j.title}": totalDistanceKm is now ${totalDist} km`);
    } else {
      console.log(`Journey "${j.title}": segments are distinct (${rawSegments.length}), distance: ${j.totalDistanceKm} km`);
    }
  }

  await mongoose.disconnect();
  console.log('Database inspection & cleanup complete.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
