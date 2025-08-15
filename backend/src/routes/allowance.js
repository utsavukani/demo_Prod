import express from 'express';
import { z } from 'zod';
import { AllowanceRequest } from '../models/AllowanceRequest.js';
import { User } from '../models/User.js';
import { Account } from '../models/Account.js';
import { Transaction } from '../models/Transaction.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

const createRequestSchema = z.object({
  parentId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  amount: z.number().positive().max(50000),
  reason: z.string().min(5).max(500)
});

const decisionSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  parentNote: z.string().max(500).optional()
});

// Student creates allowance request
router.post('/', authenticate, authorize(['student']), async (req, res) => {
  try {
    const data = createRequestSchema.parse(req.body);
    
    // Verify parent is linked
    if (!req.user.linkedUserIds.includes(data.parentId)) {
      return res.status(403).json({ error: 'Parent not linked to your account' });
    }
    
    // Check for pending requests to same parent
    const existingRequest = await AllowanceRequest.findOne({
      studentId: req.user._id,
      parentId: data.parentId,
      status: 'pending'
    });
    
    if (existingRequest) {
      return res.status(400).json({ error: 'You already have a pending request with this parent' });
    }
    
    const request = new AllowanceRequest({
      studentId: req.user._id,
      parentId: data.parentId,
      amount: data.amount,
      reason: data.reason
    });
    
    await request.save();
    
    // Populate parent info
    await request.populate('parentId', 'name email');
    
    res.status(201).json(request);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get allowance requests (for students - their requests, for parents - requests to them)
router.get('/', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};
    
    if (req.user.role === 'student') {
      filter.studentId = req.user._id;
    } else {
      filter.parentId = req.user._id;
    }
    
    if (status) {
      filter.status = status;
    }
    
    const requests = await AllowanceRequest.find(filter)
      .populate('studentId', 'name email')
      .populate('parentId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(requests);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Parent makes decision on allowance request
router.post('/:id/decision', authenticate, authorize(['parent']), async (req, res) => {
  try {
    const { status, parentNote } = decisionSchema.parse(req.body);
    
    const request = await AllowanceRequest.findOne({
      _id: req.params.id,
      parentId: req.user._id,
      status: 'pending'
    });
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found or already processed' });
    }
    
    request.status = status;
    request.parentNote = parentNote;
    request.resolvedAt = new Date();
    
    await request.save();
    
    // If approved, simulate transfer
    if (status === 'approved') {
      // Find student's account
      const studentAccount = await Account.findOne({ userId: request.studentId });
      
      if (studentAccount) {
        // Add money to student account
        studentAccount.balanceSimulated += request.amount;
        await studentAccount.save();
        
        // Create transaction record
        const transaction = new Transaction({
          userId: request.studentId,
          amount: request.amount,
          direction: 'credit',
          method: 'Bank Transfer',
          merchant: 'Parent Allowance',
          note: `Allowance: ${request.reason}`,
          rawSource: 'manual',
          category: 'Allowance',
          confidence: 1,
          isConfirmed: true
        });
        
        await transaction.save();
      }
    }
    
    // Populate for response
    await request.populate('studentId', 'name email');
    
    res.json({
      request,
      message: status === 'approved' 
        ? 'Allowance approved and transferred successfully' 
        : 'Allowance request rejected'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get specific request details
router.get('/:id', authenticate, async (req, res) => {
  try {
    const request = await AllowanceRequest.findById(req.params.id)
      .populate('studentId', 'name email')
      .populate('parentId', 'name email');
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    // Check access permissions
    const hasAccess = req.user.role === 'student' 
      ? request.studentId._id.toString() === req.user._id.toString()
      : request.parentId._id.toString() === req.user._id.toString();
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(request);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export { router as allowanceRoutes };