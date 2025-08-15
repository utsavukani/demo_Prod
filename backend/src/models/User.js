import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['student', 'parent'],
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  linkedUserIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  segment: {
    type: String,
    enum: ['high-earner', 'mid-earner', 'budget-conscious', 'low-income'],
    required: function() { return this.role === 'student'; }
  },
  onboardingData: {
    allowanceAmount: Number,
    hasPartTimeJob: Boolean,
    typicalSpendCategories: [String]
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

userSchema.index({ email: 1 });
userSchema.index({ linkedUserIds: 1 });

export const User = mongoose.model('User', userSchema);