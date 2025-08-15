import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  direction: {
    type: String,
    enum: ['debit', 'credit'],
    required: true
  },
  method: {
    type: String,
    enum: ['UPI', 'Card', 'Cash', 'Bank Transfer'],
    required: true
  },
  merchant: {
    type: String,
    trim: true
  },
  note: {
    type: String,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  rawSource: {
    type: String,
    enum: ['manual', 'smsMock', 'webhookMock', 'receiptOCR'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  subCategory: {
    type: String
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 1
  },
  isConfirmed: {
    type: Boolean,
    default: false
  },
  originalCategory: String, // Store ML prediction before user correction
  tags: [String]
}, {
  timestamps: true
});

transactionSchema.index({ userId: 1, timestamp: -1 });
transactionSchema.index({ category: 1 });
transactionSchema.index({ merchant: 1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);