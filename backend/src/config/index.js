export const config = {
  port: process.env.PORT || 3001,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/student_finance',
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://ml-service:8000'
};