import mongoose from 'mongoose';

const TrustedContactSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide contact name'],
      trim: true,
    },
    relation: {
      type: String,
      default: 'Family / Emergency Contact',
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Please provide phone number'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    notifyOnSos: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      default: 'Verified Contact',
    },
    channels: [
      {
        type: String,
        default: 'Simulated SMS',
      },
    ],
  },
  {
    timestamps: true,
  }
);

TrustedContactSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

TrustedContactSchema.set('toJSON', {
  virtuals: true,
});
TrustedContactSchema.set('toObject', {
  virtuals: true,
});

const TrustedContact = mongoose.model('TrustedContact', TrustedContactSchema);
export default TrustedContact;

