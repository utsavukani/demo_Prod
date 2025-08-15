import express from 'express';
import { Transaction } from '../models/Transaction.js';
import { Goal } from '../models/Goal.js';
import { Account } from '../models/Account.js';
import { authenticate } from '../middleware/auth.js';
import { getPersonalizedWidgets } from '../utils/segmentation.js';

const router = express.Router();

// Get spending summary
router.get('/summary', authenticate, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    // Get transactions for the period
    const transactions = await Transaction.find({
      userId: req.user._id,
      timestamp: { $gte: startDate, $lte: now }
    });
    
    // Calculate metrics
    const totalSpent = transactions
      .filter(t => t.direction === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalEarned = transactions
      .filter(t => t.direction === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Spending by category
    const spendByCategory = {};
    transactions
      .filter(t => t.direction === 'debit')
      .forEach(t => {
        spendByCategory[t.category] = (spendByCategory[t.category] || 0) + t.amount;
      });
    
    // Top merchants
    const merchantSpend = {};
    transactions
      .filter(t => t.direction === 'debit' && t.merchant)
      .forEach(t => {
        if (!merchantSpend[t.merchant]) {
          merchantSpend[t.merchant] = { amount: 0, count: 0 };
        }
        merchantSpend[t.merchant].amount += t.amount;
        merchantSpend[t.merchant].count += 1;
      });
    
    const topMerchants = Object.entries(merchantSpend)
      .map(([merchant, data]) => ({ merchant, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    
    // Average transaction amount
    const avgTicket = transactions.length > 0 
      ? totalSpent / transactions.filter(t => t.direction === 'debit').length 
      : 0;
    
    // Get account balance
    const account = await Account.findOne({ userId: req.user._id });
    
    // Get goals progress
    const goals = await Goal.find({ userId: req.user._id, status: 'active' });
    const totalGoalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalGoalProgress = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    
    res.json({
      period,
      startDate,
      endDate: now,
      summary: {
        totalSpent,
        totalEarned,
        netFlow: totalEarned - totalSpent,
        avgTicket: Math.round(avgTicket),
        transactionCount: transactions.length,
        currentBalance: account?.balanceSimulated || 0
      },
      spendByCategory: Object.entries(spendByCategory)
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: Math.round((amount / totalSpent) * 100)
        }))
        .sort((a, b) => b.amount - a.amount),
      topMerchants,
      goals: {
        active: goals.length,
        totalTarget: totalGoalTarget,
        totalProgress: totalGoalProgress,
        completionRate: totalGoalTarget > 0 ? Math.round((totalGoalProgress / totalGoalTarget) * 100) : 0
      },
      widgets: getPersonalizedWidgets(req.user.segment)
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get spending trends
router.get('/trends', authenticate, async (req, res) => {
  try {
    const { period = 'month', category } = req.query;
    const now = new Date();
    let startDate;
    let groupBy;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = { $dayOfYear: '$timestamp' };
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupBy = { $dayOfMonth: '$timestamp' };
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        groupBy = { $week: '$timestamp' };
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupBy = { $dayOfMonth: '$timestamp' };
    }
    
    const matchFilter = {
      userId: req.user._id,
      timestamp: { $gte: startDate, $lte: now },
      direction: 'debit'
    };
    
    if (category) {
      matchFilter.category = category;
    }
    
    const trends = await Transaction.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: groupBy,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          date: { $first: '$timestamp' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    res.json({
      period,
      category: category || 'all',
      trends: trends.map(t => ({
        period: t._id,
        amount: t.totalAmount,
        count: t.count,
        date: t.date
      }))
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get insights and recommendations
router.get('/insights', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get this month and last month transactions
    const [thisMonthTxns, lastMonthTxns] = await Promise.all([
      Transaction.find({
        userId: req.user._id,
        timestamp: { $gte: thisMonth, $lte: now },
        direction: 'debit'
      }),
      Transaction.find({
        userId: req.user._id,
        timestamp: { $gte: lastMonth, $lt: thisMonth },
        direction: 'debit'
      })
    ]);
    
    const thisMonthSpend = thisMonthTxns.reduce((sum, t) => sum + t.amount, 0);
    const lastMonthSpend = lastMonthTxns.reduce((sum, t) => sum + t.amount, 0);
    
    const recommendations = [];
    
    // Spending increase alert
    if (thisMonthSpend > lastMonthSpend * 1.2) {
      recommendations.push({
        type: 'spending_alert',
        message: `Your spending increased by ${Math.round(((thisMonthSpend - lastMonthSpend) / lastMonthSpend) * 100)}% this month`,
        priority: 'high',
        actionable: true
      });
    }
    
    // Category-specific insights
    const categorySpend = {};
    thisMonthTxns.forEach(t => {
      categorySpend[t.category] = (categorySpend[t.category] || 0) + t.amount;
    });
    
    const topCategory = Object.entries(categorySpend)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topCategory && topCategory[1] > thisMonthSpend * 0.4) {
      recommendations.push({
        type: 'category_insight',
        message: `${topCategory[0]} accounts for ${Math.round((topCategory[1] / thisMonthSpend) * 100)}% of your spending`,
        priority: 'medium',
        actionable: true
      });
    }
    
    // Goal progress insights
    const goals = await Goal.find({ userId: req.user._id, status: 'active' });
    goals.forEach(goal => {
      const progress = (goal.currentAmount / goal.targetAmount) * 100;
      if (progress < 25 && goal.deadline) {
        const daysLeft = Math.ceil((new Date(goal.deadline) - now) / (1000 * 60 * 60 * 24));
        if (daysLeft < 30) {
          recommendations.push({
            type: 'goal_alert',
            message: `Goal "${goal.title}" needs ₹${Math.round((goal.targetAmount - goal.currentAmount) / daysLeft)} per day to reach target`,
            priority: 'medium',
            actionable: true
          });
        }
      }
    });
    
    // Segment-specific recommendations
    if (req.user.segment === 'low-income') {
      recommendations.push({
        type: 'micro_saving',
        message: 'Try saving ₹10 daily - small amounts add up to big goals!',
        priority: 'low',
        actionable: true
      });
    }
    
    res.json({
      period: 'month',
      metrics: {
        thisMonthSpend,
        lastMonthSpend,
        changePercent: lastMonthSpend > 0 ? Math.round(((thisMonthSpend - lastMonthSpend) / lastMonthSpend) * 100) : 0,
        avgDailySpend: Math.round(thisMonthSpend / now.getDate()),
        topCategory: topCategory ? topCategory[0] : null
      },
      recommendations: recommendations.slice(0, 5) // Limit to top 5
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export { router as analyticsRoutes };