// Heuristic-based transaction categorization
const merchantDictionary = {
  // Food & Dining
  'swiggy': 'Food',
  'zomato': 'Food',
  'dominos': 'Food',
  'mcdonalds': 'Food',
  'kfc': 'Food',
  'subway': 'Food',
  'cafe': 'Food',
  'restaurant': 'Food',
  'canteen': 'Food',
  'mess': 'Food',
  
  // Transport
  'uber': 'Transport',
  'ola': 'Transport',
  'rapido': 'Transport',
  'metro': 'Transport',
  'bus': 'Transport',
  'auto': 'Transport',
  'petrol': 'Transport',
  'fuel': 'Transport',
  
  // Academic
  'xerox': 'Academic',
  'books': 'Academic',
  'stationery': 'Academic',
  'college': 'Academic',
  'university': 'Academic',
  'course': 'Academic',
  'exam': 'Academic',
  'library': 'Academic',
  
  // Entertainment
  'netflix': 'Entertainment',
  'amazon prime': 'Entertainment',
  'spotify': 'Entertainment',
  'movie': 'Entertainment',
  'cinema': 'Entertainment',
  'game': 'Entertainment',
  'youtube': 'Entertainment',
  
  // Shopping
  'amazon': 'Shopping',
  'flipkart': 'Shopping',
  'myntra': 'Shopping',
  'ajio': 'Shopping',
  'mall': 'Shopping',
  'store': 'Shopping',
  
  // Bills & Utilities
  'electricity': 'Bills',
  'water': 'Bills',
  'internet': 'Bills',
  'mobile': 'Bills',
  'recharge': 'Bills',
  'rent': 'Bills'
};

const keywordRules = {
  'Food': ['food', 'eat', 'lunch', 'dinner', 'breakfast', 'snack', 'meal'],
  'Transport': ['travel', 'trip', 'ride', 'taxi', 'bus', 'train', 'metro'],
  'Academic': ['book', 'study', 'exam', 'assignment', 'project', 'research'],
  'Entertainment': ['movie', 'music', 'game', 'fun', 'party', 'event'],
  'Shopping': ['buy', 'purchase', 'shop', 'cloth', 'dress', 'shoe'],
  'Bills': ['bill', 'payment', 'recharge', 'rent', 'utility']
};

const amountHeuristics = {
  'Food': { min: 20, max: 1000, typical: 150 },
  'Transport': { min: 10, max: 500, typical: 80 },
  'Academic': { min: 50, max: 5000, typical: 300 },
  'Entertainment': { min: 100, max: 2000, typical: 400 },
  'Shopping': { min: 200, max: 10000, typical: 1500 },
  'Bills': { min: 100, max: 5000, typical: 800 }
};

export const categorizeTransaction = (transaction) => {
  const { merchant = '', note = '', amount, timestamp } = transaction;
  const text = `${merchant} ${note}`.toLowerCase();
  
  let category = 'Other';
  let confidence = 0.3;
  
  // 1. Merchant dictionary lookup (highest confidence)
  for (const [key, cat] of Object.entries(merchantDictionary)) {
    if (text.includes(key.toLowerCase())) {
      category = cat;
      confidence = 0.9;
      break;
    }
  }
  
  // 2. Keyword matching (medium confidence)
  if (confidence < 0.8) {
    for (const [cat, keywords] of Object.entries(keywordRules)) {
      const matches = keywords.filter(keyword => text.includes(keyword)).length;
      if (matches > 0) {
        const keywordConfidence = Math.min(0.7, 0.4 + (matches * 0.1));
        if (keywordConfidence > confidence) {
          category = cat;
          confidence = keywordConfidence;
        }
      }
    }
  }
  
  // 3. Amount-based heuristics (boost confidence if amount fits typical range)
  if (category !== 'Other' && amountHeuristics[category]) {
    const { min, max, typical } = amountHeuristics[category];
    if (amount >= min && amount <= max) {
      const deviation = Math.abs(amount - typical) / typical;
      if (deviation < 0.5) {
        confidence = Math.min(0.95, confidence + 0.1);
      }
    }
  }
  
  // 4. Time-based heuristics
  const hour = new Date(timestamp).getHours();
  if (category === 'Food') {
    // Meal times boost confidence
    if ((hour >= 7 && hour <= 10) || (hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 22)) {
      confidence = Math.min(0.95, confidence + 0.05);
    }
  }
  
  return {
    category,
    confidence: Math.round(confidence * 100) / 100,
    subCategory: getSubCategory(category, text, amount)
  };
};

const getSubCategory = (category, text, amount) => {
  switch (category) {
    case 'Food':
      if (text.includes('swiggy') || text.includes('zomato')) return 'Delivery';
      if (text.includes('canteen') || text.includes('mess')) return 'Campus';
      if (amount < 100) return 'Snacks';
      return 'Dining';
    
    case 'Transport':
      if (text.includes('uber') || text.includes('ola')) return 'Ride-sharing';
      if (text.includes('metro') || text.includes('bus')) return 'Public Transport';
      if (text.includes('petrol') || text.includes('fuel')) return 'Fuel';
      return 'Other Transport';
    
    case 'Academic':
      if (text.includes('book')) return 'Books';
      if (text.includes('xerox') || text.includes('print')) return 'Printing';
      if (text.includes('fee')) return 'Fees';
      return 'Supplies';
    
    default:
      return null;
  }
};