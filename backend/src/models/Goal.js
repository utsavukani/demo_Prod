import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  targetAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  deadline: {
    type: Date
  },
  type: {
    type: String,
    enum: ['Emergency', 'Trip', 'Gadget', 'Education', 'Other'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused'],
    default: 'active'
  },
  autoRoundup: {
    type: Boolean,
    default: false
  },
  scheduledAmount: {
    type: Number,
    default: 0
  },
  scheduledFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly']
  }
}, {
  timestamps: true
});

goalSchema.index({ userId: 1, status: 1 });

export const Goal = mongoose.model('Goal', goalSchema);