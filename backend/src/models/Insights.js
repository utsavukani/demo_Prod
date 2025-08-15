import mongoose from 'mongoose';

const insightsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  period: {
    type: String,
    enum: ['week', 'month', 'quarter'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  metrics: {
    spendByCategory: [{
      category: String,
      amount: Number,
      percentage: Number
    }],
    avgTicket: Number,
    topMerchants: [{
      merchant: String,
      amount: Number,
      count: Number
    }],
    streaks: {
      savingDays: Number,
      noSpendDays: Number
    },
    volatility: {
      income: Number,
      expense: Number
    }
  },
  recommendations: [{
    type: String,
    message: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    actionable: Boolean
  }]
}, {
  timestamps: true
});

insightsSchema.index({ userId: 1, period: 1, startDate: -1 });

export const Insights = mongoose.model('Insights', insightsSchema);