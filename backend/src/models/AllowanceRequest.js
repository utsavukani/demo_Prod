import mongoose from 'mongoose';

const allowanceRequestSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  parentNote: {
    type: String,
    trim: true
  },
  resolvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

allowanceRequestSchema.index({ studentId: 1, status: 1 });
allowanceRequestSchema.index({ parentId: 1, status: 1 });

export const AllowanceRequest = mongoose.model('AllowanceRequest', allowanceRequestSchema);