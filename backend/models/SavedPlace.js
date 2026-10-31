import mongoose from 'mongoose';

const SavedPlaceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a place name'],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'Hotel',
        'Tourist Spot',
        'Checkpoint',
        'Dining',
        'Transit Hub',
        'Lodging',
        'Sights',
        'Emergency',
        'Transit',
      ],
      default: 'Hotel',
    },
    city: { type: String, default: '' },
    country: { type: String, default: '' },
    address: { type: String, default: '' },
    rating: { type: Number, default: 4.5 },
    hours: { type: String, default: '24/7 Access' },
    tags: [{ type: String }],
    notes: { type: String, default: '' },
    radiusMeters: { type: Number, default: 250 },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    imageUrl: {
      type: String,
      default:
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
    },
    isMustVisit: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

SavedPlaceSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

SavedPlaceSchema.virtual('coords').get(function () {
  return [this.lat, this.lng];
});

SavedPlaceSchema.set('toJSON', {
  virtuals: true,
});
SavedPlaceSchema.set('toObject', {
  virtuals: true,
});

const SavedPlace = mongoose.model('SavedPlace', SavedPlaceSchema);
export default SavedPlace;

