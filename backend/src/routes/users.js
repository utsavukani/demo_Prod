import express from 'express';
import { User } from '../models/User.js';
import { Account } from '../models/Account.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('linkedUserIds', 'name email role')
      .select('-__v');
    
    let account = null;
    if (user.role === 'student') {
      account = await Account.findOne({ userId: user._id });
    }
    
    res.json({
      user,
      account
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update user profile
router.patch('/profile', authenticate, async (req, res) => {
  try {
    const allowedUpdates = ['name', 'phone'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-__v');
    
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get account balance (for students)
router.get('/balance', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students have account balances' });
    }
    
    const account = await Account.findOne({ userId: req.user._id });
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    res.json({
      balance: account.balanceSimulated,
      currency: account.currency,
      lastUpdated: account.updatedAt
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export { router as userRoutes };