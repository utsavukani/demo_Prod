 # Wallex - Student Finance Management App

A comprehensive financial management application designed specifically for Indian college students, featuring AI-powered expense tracking, goal-based savings, financial education, and parent connection features.

## 🎯 Features

### Core Features (All Students)
- **Smart Expense Tracking**: AI-powered categorization with student-specific categories
- **Goal-Based Savings**: Visual progress tracking for multiple goals with gamification
- **Financial Education Hub**: Bite-sized articles, interactive quizzes, and challenges
- **Parent Connection Portal**: Transparent expense sharing and allowance management

### Segment-Specific Features

#### High Part-Time Earners
- Income volatility tracker for multiple revenue streams
- Investment recommendation engine
- Personal finance suggestions

#### Mid Part-Time Earners
- Irregular income smoothing algorithms
- Side hustle opportunity marketplace
- Parent-student financial communication tools

#### Budget-Conscious Students
- AI-powered spending pattern analysis
- Overspending alerts
- Budget optimization recommendations

#### Low-Income Dependents
- ₹10–₹50 micro-savings automation
- Emergency fund building strategies
- Financial aid & scholarship alerts

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project
   ```

2. **Start the application**
   ```bash
   docker-compose up
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001
   - MongoDB: mongodb://localhost:27017

## 🎮 Demo Guide

### Demo Accounts

The app includes 8 pre-configured demo accounts:

#### Students
- **Aisha Patel** (aisha@example.com) - High Earner
- **Rohit Kumar** (rohit@example.com) - Mid Earner  
- **Meera Singh** (meera@example.com) - Budget Conscious
- **Kunal Sharma** (kunal@example.com) - Low Income

#### Parents
- **Farida Ahmed** (farida@example.com) - Aisha's parent
- **Mahesh Patel** (mahesh@example.com) - Rohit's parent
- **Priya Singh** (priya@example.com) - Meera's parent
- **Arun Kumar** (arun@example.com) - Kunal's parent

**OTP for all accounts: `123456`**

### Feature Walkthrough

#### 1. Login & Onboarding
- Use any demo email + OTP 123456
- New users get segment-specific onboarding
- Existing users go directly to dashboard

#### 2. Dashboard Experience
- **High Earner**: Investment recommendations, income volatility tracking
- **Mid Earner**: Side hustle opportunities, parent communication tools
- **Budget Conscious**: Spending alerts, budget optimization
- **Low Income**: Micro-savings automation, emergency fund building

#### 3. Core Features Demo

**Smart Expense Tracking:**
- Add transactions with AI categorization
- View spending patterns and insights
- Receive smart alerts and recommendations

**Goal-Based Savings:**
- Create short-term and long-term goals
- Track progress with visual indicators
- Earn achievements and rewards

**Financial Education:**
- Read segment-specific articles
- Take interactive quizzes
- Complete weekly challenges

**Parent Portal:**
- View student spending insights
- Approve/reject allowance requests
- Monitor financial progress

## 🏗️ Architecture

### Frontend
- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Chart.js with react-chartjs-2
- **Icons**: Lucide React
- **State Management**: React Context
- **Routing**: React Router DOM

### Backend
- **Runtime**: Node.js + Express
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with OTP
- **Validation**: Zod
- **Logging**: Winston

### ML Services
- **Language**: Python
- **Framework**: FastAPI
- **ML Libraries**: scikit-learn, pandas
- **Features**: Transaction categorization, income prediction

## 📁 Project Structure

```
project/
├── src/                    # Frontend React app
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── contexts/          # React contexts
│   ├── services/          # API services
│   └── types/             # TypeScript types
├── backend/               # Node.js backend
│   ├── src/
│   │   ├── models/        # MongoDB models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Express middleware
│   │   ├── utils/         # Utility functions
│   │   └── scripts/       # Database scripts
├── ml-service/            # Python ML service
│   ├── main.py           # FastAPI app
│   └── requirements.txt  # Python dependencies
└── docker-compose.yml    # Docker configuration
```

## 🔧 Development

### Frontend Development
```bash
cd src
npm install
npm run dev
```

### Backend Development
```bash
cd backend
npm install
npm run dev
```

### ML Service Development
```bash
cd ml-service
pip install -r requirements.txt
uvicorn main:app --reload
```

### Database
```bash
# Seed demo data
cd backend
npm run seed
```

## 🎨 UI/UX Design

The app follows a mobile-first design approach with:
- **Color Scheme**: Purple (#6B21A8) and light green (#E8F5E9)
- **Typography**: Clean sans-serif fonts
- **Components**: Rounded corners, soft shadows
- **Navigation**: Bottom tab navigation for mobile
- **Responsive**: Works on all screen sizes

## 🔒 Security Features

- JWT-based authentication
- OTP verification for login
- Input validation and sanitization
- Rate limiting on API endpoints
- CORS protection
- Helmet.js security headers

## 📊 Data Models

### User
- Basic info (name, email, phone)
- Role (student/parent)
- Segment (high-earner, mid-earner, etc.)
- Linked accounts (parent-child relationships)

### Transaction
- Amount, category, type
- AI confidence score
- Timestamp and metadata
- Receipt images (OCR support)

### Goal
- Title, target amount, current amount
- Category (short-term/long-term)
- Deadline and progress tracking
- Icon and color customization

### Allowance Request
- Student request details
- Parent approval workflow
- Status tracking and notifications

## 🚀 Deployment

### Production Build
```bash
# Frontend
npm run build

# Backend
npm run build

# Docker
docker-compose -f docker-compose.prod.yml up
```

### Environment Variables
```env
# Frontend
VITE_API_URL=http://localhost:3001/api

# Backend
MONGODB_URI=mongodb://localhost:27017/wallex
JWT_SECRET=your-secret-key
PORT=3001

# ML Service
ML_SERVICE_URL=http://localhost:8000
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the demo guide

## 🔮 Future Enhancements

- Real-time notifications
- Advanced ML features
- Integration with Indian banks
- Social features and challenges
- Advanced analytics and insights
- Multi-language support

---

**Note**: This is a demo application. No real financial data is stored or processed. All transactions and features are simulated for demonstration purposes.
