// MongoDB initialization script
db = db.getSiblingDB('student_finance');

// Create collections with indexes
db.createCollection('users');
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ linkedUserIds: 1 });

db.createCollection('accounts');
db.accounts.createIndex({ userId: 1 }, { unique: true });

db.createCollection('transactions');
db.transactions.createIndex({ userId: 1, timestamp: -1 });
db.transactions.createIndex({ category: 1 });
db.transactions.createIndex({ merchant: 1 });

db.createCollection('goals');
db.goals.createIndex({ userId: 1, status: 1 });

db.createCollection('allowancerequests');
db.allowancerequests.createIndex({ studentId: 1, status: 1 });
db.allowancerequests.createIndex({ parentId: 1, status: 1 });

db.createCollection('insights');
db.insights.createIndex({ userId: 1, period: 1, startDate: -1 });

print('Database initialized with indexes');