import mongoose from 'mongoose';
import { config } from '../config/index.js';
import { User } from '../models/User.js';
import { Account } from '../models/Account.js';
import { Transaction } from '../models/Transaction.js';
import { Goal } from '../models/Goal.js';
import { AllowanceRequest } from '../models/AllowanceRequest.js';
import { categorizeTransaction } from '../utils/categorizer.js';

// Connect to database
await mongoose.connect(config.mongoUri);
console.log('Connected to MongoDB');

// Clear existing data
await Promise.all([
  User.deleteMany({}),
  Account.deleteMany({}),
  Transaction.deleteMany({}),
  Goal.deleteMany({}),
  AllowanceRequest.deleteMany({})
]);
console.log('Cleared existing data');

// Create test personas
const personas = [
  {
    // Aisha - High Part-Time Earner
    student: {
      role: 'student',
      name: 'Aisha Khan',
      email: 'aisha@example.com',
      phone: '+91-9876543210',
      segment: 'high-earner',
      onboardingData: {
        allowanceAmount: 12000,
        hasPartTimeJob: true,
        typicalSpendCategories: ['Food', 'Transport', 'Entertainment', 'Shopping']
      },
      isVerified: true
    },
    parent: {
      role: 'parent',
      name: 'Farida Khan',
      email: 'farida@example.com',
      phone: '+91-9876543211',
      isVerified: true
    },
    initialBalance: 15000
  },
  {
    // Rohit - Mid Part-Time Earner
    student: {
      role: 'student',
      name: 'Rohit Sharma',
      email: 'rohit@example.com',
      phone: '+91-9876543220',
      segment: 'mid-earner',
      onboardingData: {
        allowanceAmount: 5000,
        hasPartTimeJob: true,
        typicalSpendCategories: ['Food', 'Transport', 'Academic', 'Bills']
      },
      isVerified: true
    },
    parent: {
      role: 'parent',
      name: 'Mahesh Sharma',
      email: 'mahesh@example.com',
      phone: '+91-9876543221',
      isVerified: true
    },
    initialBalance: 8000
  },
  {
    // Meera - Budget-Conscious
    student: {
      role: 'student',
      name: 'Meera Patel',
      email: 'meera@example.com',
      phone: '+91-9876543230',
      segment: 'budget-conscious',
      onboardingData: {
        allowanceAmount: 6000,
        hasPartTimeJob: false,
        typicalSpendCategories: ['Food', 'Academic', 'Transport']
      },
      isVerified: true
    },
    parent: {
      role: 'parent',
      name: 'Priya Patel',
      email: 'priya@example.com',
      phone: '+91-9876543231',
      isVerified: true
    },
    initialBalance: 6500
  },
  {
    // Kunal - Low-Income Dependent
    student: {
      role: 'student',
      name: 'Kunal Singh',
      email: 'kunal@example.com',
      phone: '+91-9876543240',
      segment: 'low-income',
      onboardingData: {
        allowanceAmount: 2500,
        hasPartTimeJob: false,
        typicalSpendCategories: ['Food', 'Transport', 'Academic']
      },
      isVerified: true
    },
    parent: {
      role: 'parent',
      name: 'Arun Singh',
      email: 'arun@example.com',
      phone: '+91-9876543241',
      isVerified: true
    },
    initialBalance: 3000
  }
];

// Create users and accounts
const createdUsers = [];
for (const persona of personas) {
  // Create student
  const student = new User(persona.student);
  await student.save();
  
  // Create parent
  const parent = new User(persona.parent);
  await parent.save();
  
  // Link them
  student.linkedUserIds.push(parent._id);
  parent.linkedUserIds.push(student._id);
  await student.save();
  await parent.save();
  
  // Create account for student
  const account = new Account({
    userId: student._id,
    balanceSimulated: persona.initialBalance
  });
  await account.save();
  
  createdUsers.push({ student, parent, account });
}

console.log('Created users and accounts');

// Generate realistic transactions for the last 90 days
const merchants = {
  Food: ['Swiggy', 'Zomato', 'Dominos', 'McDonalds', 'KFC', 'College Canteen', 'Cafe Coffee Day', 'Subway'],
  Transport: ['Uber', 'Ola', 'Metro Card', 'Bus Pass', 'Auto Rickshaw', 'Petrol Pump'],
  Academic: ['Book Store', 'Xerox Shop', 'Stationery Store', 'College Fee', 'Library Fine', 'Lab Equipment'],
  Entertainment: ['BookMyShow', 'Netflix', 'Spotify', 'Gaming Store', 'Concert Ticket', 'Movie Theater'],
  Shopping: ['Amazon', 'Flipkart', 'Myntra', 'Local Store', 'Mall', 'Electronics Shop'],
  Bills: ['Electricity Bill', 'Internet Bill', 'Mobile Recharge', 'Rent', 'Water Bill']
};

const now = new Date();
const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

for (const { student, account } of createdUsers) {
  const transactions = [];
  const transactionCount = student.segment === 'high-earner' ? 120 : 
                          student.segment === 'mid-earner' ? 80 :
                          student.segment === 'budget-conscious' ? 60 : 40;
  
  for (let i = 0; i < transactionCount; i++) {
    // Random date in last 90 days
    const timestamp = new Date(ninetyDaysAgo.getTime() + Math.random() * (now.getTime() - ninetyDaysAgo.getTime()));
    
    // Determine transaction type (90% debit, 10% credit)
    const direction = Math.random() < 0.9 ? 'debit' : 'credit';
    
    let amount, category, merchant;
    
    if (direction === 'credit') {
      // Credits: allowance, part-time income, refunds
      if (Math.random() < 0.7) {
        // Allowance
        amount = student.onboardingData.allowanceAmount;
        category = 'Allowance';
        merchant = 'Parent Transfer';
      } else if (student.onboardingData.hasPartTimeJob && Math.random() < 0.8) {
        // Part-time income
        amount = Math.floor(Math.random() * 3000) + 1000;
        category = 'Income';
        merchant = 'Part-time Job';
      } else {
        // Refund
        amount = Math.floor(Math.random() * 200) + 50;
        category = 'Refund';
        merchant = 'Refund';
      }
    } else {
      // Debits: spending based on segment
      const categories = Object.keys(merchants);
      const segmentWeights = {
        'high-earner': { Food: 0.3, Transport: 0.2, Entertainment: 0.2, Shopping: 0.15, Academic: 0.1, Bills: 0.05 },
        'mid-earner': { Food: 0.35, Transport: 0.25, Academic: 0.15, Bills: 0.1, Entertainment: 0.1, Shopping: 0.05 },
        'budget-conscious': { Food: 0.4, Academic: 0.25, Transport: 0.2, Bills: 0.1, Entertainment: 0.03, Shopping: 0.02 },
        'low-income': { Food: 0.5, Academic: 0.2, Transport: 0.2, Bills: 0.05, Entertainment: 0.03, Shopping: 0.02 }
      };
      
      const weights = segmentWeights[student.segment];
      const rand = Math.random();
      let cumulative = 0;
      
      for (const [cat, weight] of Object.entries(weights)) {
        cumulative += weight;
        if (rand <= cumulative) {
          category = cat;
          break;
        }
      }
      
      // Select merchant and amount based on category
      const categoryMerchants = merchants[category];
      merchant = categoryMerchants[Math.floor(Math.random() * categoryMerchants.length)];
      
      // Amount ranges by category and segment
      const amountRanges = {
        Food: student.segment === 'high-earner' ? [100, 800] : 
              student.segment === 'mid-earner' ? [50, 400] :
              student.segment === 'budget-conscious' ? [30, 200] : [20, 150],
        Transport: [20, 300],
        Academic: [100, 2000],
        Entertainment: student.segment === 'low-income' ? [50, 200] : [100, 1000],
        Shopping: student.segment === 'low-income' ? [100, 500] : [200, 3000],
        Bills: [500, 2000]
      };
      
      const [min, max] = amountRanges[category];
      amount = Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    // Create transaction
    const txnData = {
      amount,
      direction,
      method: Math.random() < 0.7 ? 'UPI' : Math.random() < 0.5 ? 'Card' : 'Cash',
      merchant,
      note: `${direction === 'credit' ? 'Received from' : 'Payment to'} ${merchant}`,
      timestamp,
      rawSource: Math.random() < 0.6 ? 'webhookMock' : Math.random() < 0.5 ? 'smsMock' : 'manual'
    };
    
    // Categorize
    const categorization = categorizeTransaction(txnData);
    
    const transaction = new Transaction({
      ...txnData,
      userId: student._id,
      category: category || categorization.category,
      confidence: category ? 1 : categorization.confidence,
      isConfirmed: true
    });
    
    transactions.push(transaction);
  }
  
  // Sort by timestamp and save
  transactions.sort((a, b) => a.timestamp - b.timestamp);
  await Transaction.insertMany(transactions);
  
  // Update account balance based on transactions
  let balance = 0;
  for (const txn of transactions) {
    balance += txn.direction === 'credit' ? txn.amount : -txn.amount;
  }
  account.balanceSimulated = Math.max(0, balance + 2000); // Add some buffer
  await account.save();
}

console.log('Generated realistic transaction history');

// Create sample goals for each student
const goalTypes = ['Emergency', 'Trip', 'Gadget', 'Education'];
const goalTitles = {
  Emergency: ['Emergency Fund', 'Medical Emergency', 'Unexpected Expenses'],
  Trip: ['Goa Trip', 'Home Visit', 'Weekend Getaway', 'Study Tour'],
  Gadget: ['New Laptop', 'iPhone', 'Gaming Console', 'Headphones'],
  Education: ['Course Fee', 'Certification', 'Books', 'Online Course']
};

for (const { student } of createdUsers) {
  const goalCount = Math.floor(Math.random() * 3) + 1; // 1-3 goals per student
  
  for (let i = 0; i < goalCount; i++) {
    const type = goalTypes[Math.floor(Math.random() * goalTypes.length)];
    const titles = goalTitles[type];
    const title = titles[Math.floor(Math.random() * titles.length)];
    
    const targetAmount = type === 'Emergency' ? 5000 :
                        type === 'Trip' ? Math.floor(Math.random() * 8000) + 2000 :
                        type === 'Gadget' ? Math.floor(Math.random() * 30000) + 5000 :
                        Math.floor(Math.random() * 10000) + 1000;
    
    const currentAmount = Math.floor(Math.random() * targetAmount * 0.6); // 0-60% progress
    
    const goal = new Goal({
      userId: student._id,
      title,
      targetAmount,
      currentAmount,
      type,
      deadline: new Date(now.getTime() + Math.random() * 180 * 24 * 60 * 60 * 1000), // Next 6 months
      autoRoundup: Math.random() < 0.3
    });
    
    await goal.save();
  }
}

console.log('Created sample goals');

// Create some allowance requests
for (let i = 0; i < 3; i++) {
  const { student, parent } = createdUsers[i];
  
  const request = new AllowanceRequest({
    studentId: student._id,
    parentId: parent._id,
    amount: Math.floor(Math.random() * 3000) + 1000,
    reason: [
      'Need money for college fest registration',
      'Books and stationery for new semester',
      'Emergency medical expense',
      'Group project expenses'
    ][Math.floor(Math.random() * 4)],
    status: i === 0 ? 'pending' : Math.random() < 0.7 ? 'approved' : 'rejected'
  });
  
  if (request.status !== 'pending') {
    request.resolvedAt = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    if (request.status === 'rejected') {
      request.parentNote = 'Please provide more details about the expense';
    }
  }
  
  await request.save();
}

console.log('Created sample allowance requests');

console.log('\n=== SEED DATA CREATED SUCCESSFULLY ===');
console.log('\nTest Accounts:');
console.log('Students:');
console.log('- aisha@example.com (High Earner) - OTP: 123456');
console.log('- rohit@example.com (Mid Earner) - OTP: 123456');
console.log('- meera@example.com (Budget Conscious) - OTP: 123456');
console.log('- kunal@example.com (Low Income) - OTP: 123456');
console.log('\nParents:');
console.log('- farida@example.com (Aisha\'s parent) - OTP: 123456');
console.log('- mahesh@example.com (Rohit\'s parent) - OTP: 123456');
console.log('- priya@example.com (Meera\'s parent) - OTP: 123456');
console.log('- arun@example.com (Kunal\'s parent) - OTP: 123456');

await mongoose.disconnect();
console.log('\nDatabase connection closed');
process.exit(0);