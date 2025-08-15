import express from 'express';
import { z } from 'zod';
import { Transaction } from '../models/Transaction.js';
import { Account } from '../models/Account.js';
import { authenticate } from '../middleware/auth.js';
import { categorizeTransaction } from '../utils/categorizer.js';

const router = express.Router();

const createTransactionSchema = z.object({
  amount: z.number().positive(),
  direction: z.enum(['debit', 'credit']),
  method: z.enum(['UPI', 'Card', 'Cash', 'Bank Transfer']),
  merchant: z.string().optional(),
  note: z.string().optional(),
  rawSource: z.enum(['manual', 'smsMock', 'webhookMock', 'receiptOCR']),
  category: z.string().optional(),
  timestamp: z.string().datetime().optional()
});

const parseSmsSchema = z.object({
  smsText: z.string().min(10)
});

// Create transaction
router.post('/', authenticate, async (req, res) => {
  try {
    const data = createTransactionSchema.parse(req.body);
    
    // Auto-categorize if category not provided
    let category = data.category;
    let confidence = 1;
    
    if (!category) {
      const result = categorizeTransaction(data);
      category = result.category;
      confidence = result.confidence;
    }
    
    const transaction = new Transaction({
      ...data,
      userId: req.user._id,
      category,
      confidence,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      isConfirmed: data.rawSource === 'manual' || confidence >= 0.8
    });
    
    await transaction.save();
    
    // Update account balance
    const account = await Account.findOne({ userId: req.user._id });
    if (account) {
      const change = data.direction === 'credit' ? data.amount : -data.amount;
      account.balanceSimulated += change;
      await account.save();
    }
    
    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Parse SMS and create transaction
router.post('/parse-sms', authenticate, async (req, res) => {
  try {
    const { smsText } = parseSmsSchema.parse(req.body);
    
    // Mock SMS parsing logic
    const parsed = parseSmsText(smsText);
    
    if (!parsed) {
      return res.status(400).json({ error: 'Could not parse SMS' });
    }
    
    // Auto-categorize
    const categorization = categorizeTransaction(parsed);
    
    const transaction = new Transaction({
      ...parsed,
      userId: req.user._id,
      rawSource: 'smsMock',
      category: categorization.category,
      confidence: categorization.confidence,
      isConfirmed: categorization.confidence >= 0.8
    });
    
    await transaction.save();
    
    // Update account balance
    const account = await Account.findOne({ userId: req.user._id });
    if (account) {
      const change = parsed.direction === 'credit' ? parsed.amount : -parsed.amount;
      account.balanceSimulated += change;
      await account.save();
    }
    
    res.status(201).json({
      transaction,
      parsed: true,
      confidence: categorization.confidence
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mock UPI webhook
router.post('/mock-upi', authenticate, async (req, res) => {
  try {
    const mockTransaction = {
      amount: Math.floor(Math.random() * 500) + 50,
      direction: Math.random() > 0.3 ? 'debit' : 'credit',
      method: 'UPI',
      merchant: getMockMerchant(),
      note: 'Mock UPI transaction',
      rawSource: 'webhookMock'
    };
    
    const categorization = categorizeTransaction(mockTransaction);
    
    const transaction = new Transaction({
      ...mockTransaction,
      userId: req.user._id,
      category: categorization.category,
      confidence: categorization.confidence,
      isConfirmed: categorization.confidence >= 0.8
    });
    
    await transaction.save();
    
    // Update account balance
    const account = await Account.findOne({ userId: req.user._id });
    if (account) {
      const change = mockTransaction.direction === 'credit' ? mockTransaction.amount : -mockTransaction.amount;
      account.balanceSimulated += change;
      await account.save();
    }
    
    res.status(201).json({
      transaction,
      message: 'Mock UPI transaction created successfully'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get transactions
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, category, startDate, endDate } = req.query;
    
    const filter = { userId: req.user._id };
    
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    
    const transactions = await Transaction.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Transaction.countDocuments(filter);
    
    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update transaction category
router.patch('/:id/category', authenticate, async (req, res) => {
  try {
    const { category } = req.body;
    
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    // Store original category if this is the first correction
    if (!transaction.originalCategory) {
      transaction.originalCategory = transaction.category;
    }
    
    transaction.category = category;
    transaction.isConfirmed = true;
    transaction.confidence = 1;
    
    await transaction.save();
    
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Helper functions
function parseSmsText(smsText) {
  // Mock SMS parsing - in production, use regex patterns for different banks
  const patterns = [
    /debited.*?Rs\.?\s*(\d+(?:\.\d{2})?)/i,
    /credited.*?Rs\.?\s*(\d+(?:\.\d{2})?)/i,
    /paid.*?Rs\.?\s*(\d+(?:\.\d{2})?)/i,
    /received.*?Rs\.?\s*(\d+(?:\.\d{2})?)/i
  ];
  
  let amount = null;
  let direction = 'debit';
  
  for (const pattern of patterns) {
    const match = smsText.match(pattern);
    if (match) {
      amount = parseFloat(match[1]);
      direction = /credited|received/i.test(match[0]) ? 'credit' : 'debit';
      break;
    }
  }
  
  if (!amount) return null;
  
  // Extract merchant
  const merchantPatterns = [
    /at\s+([A-Z\s]+)/i,
    /to\s+([A-Z\s]+)/i,
    /from\s+([A-Z\s]+)/i
  ];
  
  let merchant = 'Unknown';
  for (const pattern of merchantPatterns) {
    const match = smsText.match(pattern);
    if (match) {
      merchant = match[1].trim();
      break;
    }
  }
  
  return {
    amount,
    direction,
    method: 'UPI',
    merchant,
    note: 'Parsed from SMS'
  };
}

function getMockMerchant() {
  const merchants = [
    'Swiggy', 'Zomato', 'Uber', 'Ola', 'Amazon', 'Flipkart',
    'Dominos', 'McDonalds', 'Cafe Coffee Day', 'Metro Card',
    'BookMyShow', 'Netflix', 'Spotify', 'College Canteen'
  ];
  return merchants[Math.floor(Math.random() * merchants.length)];
}

export { router as transactionRoutes };