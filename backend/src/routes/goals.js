import express from 'express';
import { z } from 'zod';
import { Goal } from '../models/Goal.js';
import { Account } from '../models/Account.js';
import { Transaction } from '../models/Transaction.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const createGoalSchema = z.object({
  title: z.string().min(1).max(100),
  targetAmount: z.number().positive(),
  deadline: z.string().datetime().optional(),
  type: z.enum(['Emergency', 'Trip', 'Gadget', 'Education', 'Other']),
  autoRoundup: z.boolean().default(false),
  scheduledAmount: z.number().min(0).optional(),
  scheduledFrequency: z.enum(['daily', 'weekly', 'monthly']).optional()
});

const topupSchema = z.object({
  amount: z.number().positive()
});

// Create goal
router.post('/', authenticate, async (req, res) => {
  try {
    const data = createGoalSchema.parse(req.body);
    
    const goal = new Goal({
      ...data,
      userId: req.user._id,
      deadline: data.deadline ? new Date(data.deadline) : undefined
    });
    
    await goal.save();
    res.status(201).json(goal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user goals
router.get('/', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { userId: req.user._id };
    
    if (status) filter.status = status;
    
    const goals = await Goal.find(filter).sort({ createdAt: -1 });
    res.json(goals);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Top up goal
router.patch('/:id/topup', authenticate, async (req, res) => {
  try {
    const { amount } = topupSchema.parse(req.body);
    
    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    // Check account balance
    const account = await Account.findOne({ userId: req.user._id });
    if (!account || account.balanceSimulated < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Update goal
    goal.currentAmount += amount;
    if (goal.currentAmount >= goal.targetAmount) {
      goal.status = 'completed';
    }
    await goal.save();
    
    // Update account balance
    account.balanceSimulated -= amount;
    await account.save();
    
    // Create transaction record
    const transaction = new Transaction({
      userId: req.user._id,
      amount,
      direction: 'debit',
      method: 'Bank Transfer',
      merchant: 'Goal Savings',
      note: `Top-up for goal: ${goal.title}`,
      rawSource: 'manual',
      category: 'Savings',
      confidence: 1,
      isConfirmed: true
    });
    await transaction.save();
    
    res.json({
      goal,
      transaction,
      message: goal.status === 'completed' ? 'Congratulations! Goal completed!' : 'Goal topped up successfully'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update goal
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const updates = req.body;
    
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updates,
      { new: true, runValidators: true }
    );
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    res.json(goal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete goal
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    // If goal had money, return it to account
    if (goal.currentAmount > 0) {
      const account = await Account.findOne({ userId: req.user._id });
      if (account) {
        account.balanceSimulated += goal.currentAmount;
        await account.save();
        
        // Create refund transaction
        const transaction = new Transaction({
          userId: req.user._id,
          amount: goal.currentAmount,
          direction: 'credit',
          method: 'Bank Transfer',
          merchant: 'Goal Refund',
          note: `Refund from deleted goal: ${goal.title}`,
          rawSource: 'manual',
          category: 'Refund',
          confidence: 1,
          isConfirmed: true
        });
        await transaction.save();
      }
    }
    
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export { router as goalRoutes };