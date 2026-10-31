import mongoose from 'mongoose';

const TripSegmentSchema = new mongoose.Schema(
  {
    id: { type: String },
    order: { type: Number, default: 1 },
    type: { type: String, default: 'walking' },
    mode: { type: String, default: 'Walking' },
    transportMode: { type: String, default: 'Walking' },
    title: { type: String, required: true },
    origin: { type: String, required: true },
    from: { type: String },
    destination: { type: String, required: true },
    to: { type: String },
    distanceKm: { type: Number, default: 0 },
    distanceMi: { type: Number, default: 0 },
    durationMinutes: { type: Number, default: 0 },
    duration: { type: String, default: '0m' },
    startTime: { type: String, default: '09:00 AM' },
    endTime: { type: String },
    transitLine: { type: String },
    co2SavedKg: { type: Number, default: 0 },
    isStop: { type: Boolean, default: false },
    notes: { type: String, default: '' },
    status: { type: String, default: 'Scheduled' },
    telemetry: { type: String },
  },
  { _id: true }
);

const PackingItemSchema = new mongoose.Schema(
  {
    id: { type: String },
    item: { type: String, required: true },
    category: { type: String, default: 'Gear' },
    checked: { type: Boolean, default: false },
    mandatory: { type: Boolean, default: false },
  },
  { _id: true }
);

const ItineraryDaySchema = new mongoose.Schema(
  {
    day: { type: Number, required: true },
    title: { type: String },
    date: { type: String },
    items: [
      {
        time: { type: String },
        title: { type: String },
        desc: { type: String },
        done: { type: Boolean, default: false },
        tag: { type: String },
      },
    ],
  },
  { _id: true }
);

const ExpenseSchema = new mongoose.Schema(
  {
    id: { type: String },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, default: 'Dining' },
    date: { type: String },
  },
  { _id: true }
);

const JourneySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a journey title'],
      trim: true,
    },
    origin: {
      type: String,
      required: [true, 'Please provide an origin location'],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, 'Please provide a destination location'],
      trim: true,
    },
    travelDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
    startDate: { type: String },
    endDate: { type: String },
    currentDay: { type: Number, default: 1 },
    totalDays: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['In Progress', 'Upcoming', 'Completed', 'Draft'],
      default: 'Upcoming',
    },
    countryCode: { type: String, default: 'INT' },
    primaryTransportMode: { type: String, default: 'Walking + Transit' },
    transitTypes: [{ type: String }],
    totalDistanceKm: { type: Number, default: 0 },
    totalDurationMinutes: { type: Number, default: 0 },
    estimatedCo2Kg: { type: Number, default: 0 },
    coverImage: {
      type: String,
      default:
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
    },
    summary: { type: String, default: '' },
    budget: { type: Number, default: 0 },
    spent: { type: Number, default: 0 },
    center: {
      type: [Number],
      default: [35.0116, 135.7681],
    },
    zoom: { type: Number, default: 13 },
    currentLocation: {
      name: { type: String, default: 'Departure Point' },
      coords: { type: [Number], default: [35.0116, 135.7681] },
      updatedAgo: { type: String, default: 'Just now' },
      safeZone: { type: Boolean, default: true },
    },
    hotelInfo: {
      name: { type: String, default: 'Lodging Pending' },
      address: { type: String, default: '' },
      phone: { type: String, default: 'N/A' },
    },
    localEmergencyNumbers: {
      police: { type: String, default: '112 / 911' },
      ambulance: { type: String, default: '112 / 911' },
      campusSecurity: { type: String },
    },
    waypoints: [
      {
        id: { type: String },
        title: { type: String },
        category: { type: String },
        coords: [{ type: Number }],
        day: { type: Number, default: 1 },
        time: { type: String },
        notes: { type: String },
        completed: { type: Boolean, default: false },
        isOrigin: { type: Boolean, default: false },
        isDestination: { type: Boolean, default: false },
      },
    ],
    segments: [TripSegmentSchema],
    travelSegments: [TripSegmentSchema],
    packingList: [PackingItemSchema],
    itineraryDays: [ItineraryDaySchema],
    expenses: [ExpenseSchema],
    isDemoData: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Virtual for id getter
JourneySchema.virtual('id').get(function () {
  return this._id.toHexString();
});

JourneySchema.set('toJSON', {
  virtuals: true,
});
JourneySchema.set('toObject', {
  virtuals: true,
});

const Journey = mongoose.model('Journey', JourneySchema);
export default Journey;

