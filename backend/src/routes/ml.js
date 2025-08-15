import express from 'express';
import { categorizeTransaction } from '../utils/categorizer.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Categorize transaction
router.post('/categorize', authenticate, async (req, res) => {
  try {
    const { merchant, note, amount, timestamp } = req.body;
    
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }
    
    const result = categorizeTransaction({
      merchant: merchant || '',
      note: note || '',
      amount,
      timestamp: timestamp || new Date()
    });
    
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get categorization confidence stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    // In a real implementation, this would query the database for ML performance metrics
    res.json({
      totalCategorized: 1250,
      averageConfidence: 0.78,
      manualCorrections: 156,
      accuracyRate: 0.875,
      topCategories: [
        { category: 'Food', accuracy: 0.92 },
        { category: 'Transport', accuracy: 0.85 },
        { category: 'Academic', accuracy: 0.81 },
        { category: 'Entertainment', accuracy: 0.76 }
      ]
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export { router as mlRoutes };