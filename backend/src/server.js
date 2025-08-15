import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/users.js';
import { transactionRoutes } from './routes/transactions.js';
import { goalRoutes } from './routes/goals.js';
import { analyticsRoutes } from './routes/analytics.js';
import { parentRoutes } from './routes/parent.js';
import { allowanceRoutes } from './routes/allowance.js';
import { mlRoutes } from './routes/ml.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/allowance', allowanceRoutes);
app.use('/api/ml', mlRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Database connection
mongoose.connect(config.mongoUri)
  .then(() => {
    logger.info('Connected to MongoDB');
    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
    });
  })
  .catch((error) => {
    logger.error('Database connection failed:', error);
    process.exit(1);
  });

export default app;