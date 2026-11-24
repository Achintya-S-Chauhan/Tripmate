import mongoose from 'mongoose';

/**
 * Transport Leg Schema
 * Supports multi-modal journey legs: Train, Bus, Flight, Transit, Walking, Driving.
 */
const TripSegmentSchema = new mongoose.Schema(
  {
    id: { type: String },
    order: { type: Number, default: 1 },
    type: { type: String, default: 'walking' }, // 'train' | 'bus' | 'flight' | 'transit' | 'walking' | 'car' | 'ferry'
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
    startTime: { type: String, default: '' },
    endTime: { type: String, default: '' },
    departureDate: { type: String },
    arrivalDate: { type: String },
    departureStation: { type: String },
    arrivalStation: { type: String },
    operator: { type: String }, // e.g., 'Deutsche Bahn', 'FlixBus', 'Delta', etc.
    serviceNumber: { type: String }, // e.g., 'ICE 574', 'FLIX 204'
    transfers: { type: Number, default: 0 },
    transitLine: { type: String },
    price: { type: Number },
    currency: { type: String, default: 'USD' },
    costType: {
      type: String,
      enum: ['planned', 'provider_fare', 'estimate', 'recorded'],
      default: 'planned',
    },
    bookingStatus: {
      type: String,
      enum: ['planned', 'booked', 'canceled'],
      default: 'planned',
    },
    bookingUrl: { type: String },
    source: { type: String, default: 'manual' }, // 'osrm' | 'google_routes' | 'railway' | 'manual'
    co2SavedKg: { type: Number, default: 0 },
    isStop: { type: Boolean, default: false },
    notes: { type: String, default: '' },
    status: { type: String, default: 'Scheduled' },
    telemetry: { type: String },
    originCoords: { type: [Number] },
    destinationCoords: { type: [Number] },
    geometry: { type: [[Number]], default: [] }, // Polyline points [lat, lng]
  },
  { _id: true }
);

/**
 * Accommodation / Stay Schema
 */
const StaySchema = new mongoose.Schema(
  {
    id: { type: String },
    name: { type: String, required: true },
    propertyType: {
      type: String,
      enum: ['hotel', 'hostel', 'guesthouse', 'homestay', 'apartment', 'resort', 'other'],
      default: 'hotel',
    },
    address: { type: String, default: '' },
    coords: { type: [Number] }, // [lat, lng]
    checkInDate: { type: String },
    checkInTime: { type: String, default: '14:00' },
    checkOutDate: { type: String },
    checkOutTime: { type: String, default: '11:00' },
    nights: { type: Number, default: 1 },
    totalPrice: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    bookingStatus: {
      type: String,
      enum: ['planned', 'booked', 'stayed'],
      default: 'planned',
    },
    bookingUrl: { type: String },
    confirmationNumber: { type: String },
    phone: { type: String },
    notes: { type: String, default: '' },
    source: { type: String, default: 'manual' }, // 'manual' | 'osm' | 'provider'
  },
  { _id: true }
);

/**
 * Places & Activities Schema
 */
const PlaceSchema = new mongoose.Schema(
  {
    id: { type: String },
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ['attraction', 'restaurant', 'landmark', 'shopping', 'activity', 'viewpoint', 'other'],
      default: 'attraction',
    },
    address: { type: String, default: '' },
    coords: { type: [Number] }, // [lat, lng]
    day: { type: Number, default: 1 },
    visitDate: { type: String },
    visitTime: { type: String },
    notes: { type: String, default: '' },
    visited: { type: Boolean, default: false },
    source: { type: String, default: 'manual' },
  },
  { _id: true }
);

/**
 * Expense Schema
 */
const ExpenseSchema = new mongoose.Schema(
  {
    id: { type: String },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    originalAmount: { type: Number },
    originalCurrency: { type: String, default: 'USD' },
    category: {
      type: String,
      enum: ['Transport', 'Accommodation', 'Food', 'Activities', 'Shopping', 'Other', 'Dining'],
      default: 'Other',
    },
    date: { type: String },
    linkedType: {
      type: String,
      enum: ['none', 'transport_leg', 'stay', 'place'],
      default: 'none',
    },
    linkedId: { type: String },
    notes: { type: String, default: '' },
    receiptUrl: { type: String },
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
    },
    startDate: { type: String },
    endDate: { type: String },
    isUndated: { type: Boolean, default: false },
    currentDay: { type: Number, default: 1 },
    totalDays: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['In Progress', 'Upcoming', 'Completed', 'Draft'],
      default: 'Upcoming',
    },
    countryCode: { type: String, default: 'INT' },
    currency: { type: String, default: 'USD' },
    primaryTransportMode: { type: String, default: 'Multi-Modal' },
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
    notes: { type: String, default: '' },
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
      name: { type: String, default: '' },
      address: { type: String, default: '' },
      phone: { type: String, default: '' },
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
    stays: [StaySchema],
    places: [PlaceSchema],
    packingList: [PackingItemSchema],
    itineraryDays: [ItineraryDaySchema],
    expenses: [ExpenseSchema],
    routeGeometry: { type: [[Number]], default: [] },
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
