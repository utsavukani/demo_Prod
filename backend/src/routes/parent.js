import express from 'express';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { Goal } from '../models/Goal.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

const inviteSchema = z.object({
  parentEmail: z.string().email()
});

const acceptInviteSchema = z.object({
  studentId: z.string().regex(/^[0-9a-fA-F]{24}$/) // MongoDB ObjectId
});

// Student invites parent
router.post('/invite', authenticate, authorize(['student']), async (req, res) => {
  try {
    const { parentEmail } = inviteSchema.parse(req.body);
    
    // Check if parent exists
    const parent = await User.findOne({ email: parentEmail, role: 'parent' });
    
    if (!parent) {
      return res.status(404).json({ 
        error: 'Parent not found. Please ask them to register first.' 
      });
    }
    
    // Check if already linked
    if (req.user.linkedUserIds.includes(parent._id)) {
      return res.status(400).json({ error: 'Parent already linked' });
    }
    
    // Add to linked users (both ways)
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { linkedUserIds: parent._id }
    });
    
    await User.findByIdAndUpdate(parent._id, {
      $addToSet: { linkedUserIds: req.user._id }
    });
    
    // In production, send email notification to parent
    console.log(`Parent invite sent to ${parentEmail} from ${req.user.name}`);
    
    res.json({ 
      message: 'Parent linked successfully',
      parent: {
        id: parent._id,
        name: parent.name,
        email: parent.email
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Parent accepts invite (alternative flow)
router.post('/accept', authenticate, authorize(['parent']), async (req, res) => {
  try {
    const { studentId } = acceptInviteSchema.parse(req.body);
    
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Add to linked users (both ways)
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { linkedUserIds: student._id }
    });
    
    await User.findByIdAndUpdate(student._id, {
      $addToSet: { linkedUserIds: req.user._id }
    });
    
    res.json({ 
      message: 'Student linked successfully',
      student: {
        id: student._id,
        name: student.name,
        email: student.email
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get linked children (for parents)
router.get('/children', authenticate, authorize(['parent']), async (req, res) => {
  try {
    const children = await User.find({
      _id: { $in: req.user.linkedUserIds },
      role: 'student'
    }).select('name email segment createdAt');
    
    res.json(children);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get child's spending summary (for parents)
router.get('/child/:childId/summary', authenticate, authorize(['parent']), async (req, res) => {
  try {
    const { childId } = req.params;
    const { period = 'month' } = req.query;
    
    // Verify parent has access to this child
    if (!req.user.linkedUserIds.includes(childId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const child = await User.findById(childId);
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    // Get transactions
    const transactions = await Transaction.find({
      userId: childId,
      timestamp: { $gte: startDate, $lte: now }
    }).sort({ timestamp: -1 }).limit(10);
    
    const totalSpent = transactions
      .filter(t => t.direction === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalReceived = transactions
      .filter(t => t.direction === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Spending by category
    const spendByCategory = {};
    transactions
      .filter(t => t.direction === 'debit')
      .forEach(t => {
        spendByCategory[t.category] = (spendByCategory[t.category] || 0) + t.amount;
      });
    
    // Get goals
    const goals = await Goal.find({ userId: childId, status: 'active' });
    
    res.json({
      child: {
        id: child._id,
        name: child.name,
        segment: child.segment
      },
      period,
      summary: {
        totalSpent,
        totalReceived,
        netFlow: totalReceived - totalSpent,
        transactionCount: transactions.length
      },
      spendByCategory: Object.entries(spendByCategory)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount),
      recentTransactions: transactions.slice(0, 5),
      goals: goals.map(g => ({
        id: g._id,
        title: g.title,
        progress: Math.round((g.currentAmount / g.targetAmount) * 100),
        currentAmount: g.currentAmount,
        targetAmount: g.targetAmount
      }))
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Remove child link
router.delete('/child/:childId', authenticate, authorize(['parent']), async (req, res) => {
  try {
    const { childId } = req.params;
    
    // Remove from both users' linked lists
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { linkedUserIds: childId }
    });
    
    await User.findByIdAndUpdate(childId, {
      $pull: { linkedUserIds: req.user._id }
    });
    
    res.json({ message: 'Child unlinked successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export { router as parentRoutes };