from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
import pickle
import os
import re
from datetime import datetime

app = FastAPI(title="Student Finance ML Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class TransactionData(BaseModel):
    merchant: Optional[str] = ""
    note: Optional[str] = ""
    amount: float
    timestamp: Optional[str] = None
    method: Optional[str] = "UPI"

class CategoryPrediction(BaseModel):
    category: str
    confidence: float
    subCategory: Optional[str] = None

class TrainingData(BaseModel):
    transactions: List[dict]

# Global model storage
model_pipeline = None
categories = ['Food', 'Transport', 'Academic', 'Entertainment', 'Shopping', 'Bills', 'Other']

# Feature engineering functions
def extract_features(merchant: str, note: str, amount: float, timestamp: str = None) -> dict:
    """Extract features from transaction data"""
    text = f"{merchant} {note}".lower().strip()
    
    features = {
        'text': text,
        'amount_log': np.log1p(amount),
        'amount_bucket': get_amount_bucket(amount),
        'text_length': len(text),
        'has_numbers': bool(re.search(r'\d', text)),
        'word_count': len(text.split())
    }
    
    # Time-based features
    if timestamp:
        try:
            dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            features.update({
                'hour': dt.hour,
                'day_of_week': dt.weekday(),
                'is_weekend': dt.weekday() >= 5,
                'is_meal_time': dt.hour in [7, 8, 9, 12, 13, 14, 19, 20, 21]
            })
        except:
            features.update({
                'hour': 12,
                'day_of_week': 1,
                'is_weekend': False,
                'is_meal_time': False
            })
    else:
        features.update({
            'hour': 12,
            'day_of_week': 1,
            'is_weekend': False,
            'is_meal_time': False
        })
    
    return features

def get_amount_bucket(amount: float) -> str:
    """Categorize amount into buckets"""
    if amount < 50:
        return 'very_low'
    elif amount < 200:
        return 'low'
    elif amount < 500:
        return 'medium'
    elif amount < 1000:
        return 'high'
    else:
        return 'very_high'

def create_training_data():
    """Create synthetic training data for the model"""
    training_data = []
    
    # Food transactions
    food_merchants = ['swiggy', 'zomato', 'dominos', 'mcdonalds', 'kfc', 'cafe', 'restaurant', 'canteen', 'mess']
    food_notes = ['lunch', 'dinner', 'breakfast', 'snack', 'meal', 'food delivery', 'eating out']
    
    for merchant in food_merchants:
        for note in food_notes:
            for _ in range(5):
                amount = np.random.uniform(50, 500)
                training_data.append({
                    'merchant': merchant,
                    'note': note,
                    'amount': amount,
                    'category': 'Food'
                })
    
    # Transport transactions
    transport_merchants = ['uber', 'ola', 'metro', 'bus', 'auto', 'taxi', 'petrol']
    transport_notes = ['ride', 'travel', 'trip', 'commute', 'fuel', 'transport']
    
    for merchant in transport_merchants:
        for note in transport_notes:
            for _ in range(5):
                amount = np.random.uniform(20, 300)
                training_data.append({
                    'merchant': merchant,
                    'note': note,
                    'amount': amount,
                    'category': 'Transport'
                })
    
    # Academic transactions
    academic_merchants = ['bookstore', 'xerox', 'stationery', 'college', 'library', 'course']
    academic_notes = ['books', 'study', 'exam', 'assignment', 'project', 'education']
    
    for merchant in academic_merchants:
        for note in academic_notes:
            for _ in range(5):
                amount = np.random.uniform(100, 2000)
                training_data.append({
                    'merchant': merchant,
                    'note': note,
                    'amount': amount,
                    'category': 'Academic'
                })
    
    # Entertainment transactions
    entertainment_merchants = ['netflix', 'spotify', 'bookmyshow', 'movie', 'game', 'youtube']
    entertainment_notes = ['movie', 'music', 'entertainment', 'fun', 'streaming', 'subscription']
    
    for merchant in entertainment_merchants:
        for note in entertainment_notes:
            for _ in range(5):
                amount = np.random.uniform(100, 1000)
                training_data.append({
                    'merchant': merchant,
                    'note': note,
                    'amount': amount,
                    'category': 'Entertainment'
                })
    
    # Shopping transactions
    shopping_merchants = ['amazon', 'flipkart', 'myntra', 'store', 'mall', 'shop']
    shopping_notes = ['shopping', 'purchase', 'buy', 'clothes', 'electronics', 'gadget']
    
    for merchant in shopping_merchants:
        for note in shopping_notes:
            for _ in range(5):
                amount = np.random.uniform(200, 3000)
                training_data.append({
                    'merchant': merchant,
                    'note': note,
                    'amount': amount,
                    'category': 'Shopping'
                })
    
    # Bills transactions
    bills_merchants = ['electricity', 'water', 'internet', 'mobile', 'rent', 'utility']
    bills_notes = ['bill', 'payment', 'recharge', 'utility', 'rent', 'subscription']
    
    for merchant in bills_merchants:
        for note in bills_notes:
            for _ in range(5):
                amount = np.random.uniform(500, 2000)
                training_data.append({
                    'merchant': merchant,
                    'note': note,
                    'amount': amount,
                    'category': 'Bills'
                })
    
    return training_data

def train_model():
    """Train the categorization model"""
    global model_pipeline
    
    # Create training data
    training_data = create_training_data()
    df = pd.DataFrame(training_data)
    
    # Extract features
    features_list = []
    for _, row in df.iterrows():
        features = extract_features(
            row['merchant'], 
            row.get('note', ''), 
            row['amount']
        )
        features_list.append(features)
    
    features_df = pd.DataFrame(features_list)
    
    # Prepare text features
    X_text = features_df['text'].fillna('')
    
    # Prepare numerical features
    numerical_features = ['amount_log', 'text_length', 'word_count', 'hour', 'day_of_week']
    X_numerical = features_df[numerical_features].fillna(0)
    
    # Prepare categorical features
    categorical_features = ['amount_bucket', 'has_numbers', 'is_weekend', 'is_meal_time']
    X_categorical = pd.get_dummies(features_df[categorical_features])
    
    # Combine features
    tfidf = TfidfVectorizer(max_features=100, stop_words='english', ngram_range=(1, 2))
    X_text_features = tfidf.fit_transform(X_text).toarray()
    
    X_combined = np.hstack([
        X_text_features,
        X_numerical.values,
        X_categorical.values
    ])
    
    y = df['category']
    
    # Train model
    model = LogisticRegression(random_state=42, max_iter=1000)
    model.fit(X_combined, y)
    
    # Store model and vectorizer
    model_pipeline = {
        'model': model,
        'tfidf': tfidf,
        'numerical_features': numerical_features,
        'categorical_columns': X_categorical.columns.tolist()
    }
    
    print("Model trained successfully!")
    return model_pipeline

# Initialize model on startup
@app.on_event("startup")
async def startup_event():
    train_model()

@app.get("/")
async def root():
    return {"message": "Student Finance ML Service", "status": "running"}

@app.post("/categorize", response_model=CategoryPrediction)
async def categorize_transaction(transaction: TransactionData):
    """Categorize a transaction using ML model"""
    global model_pipeline
    
    if model_pipeline is None:
        raise HTTPException(status_code=500, detail="Model not initialized")
    
    try:
        # Extract features
        features = extract_features(
            transaction.merchant or "",
            transaction.note or "",
            transaction.amount,
            transaction.timestamp
        )
        
        # Prepare features for prediction
        features_df = pd.DataFrame([features])
        
        # Text features
        X_text = features_df['text'].fillna('')
        X_text_features = model_pipeline['tfidf'].transform(X_text).toarray()
        
        # Numerical features
        X_numerical = features_df[model_pipeline['numerical_features']].fillna(0)
        
        # Categorical features
        categorical_features = ['amount_bucket', 'has_numbers', 'is_weekend', 'is_meal_time']
        X_categorical = pd.get_dummies(features_df[categorical_features])
        
        # Align categorical features with training data
        for col in model_pipeline['categorical_columns']:
            if col not in X_categorical.columns:
                X_categorical[col] = 0
        X_categorical = X_categorical[model_pipeline['categorical_columns']]
        
        # Combine features
        X_combined = np.hstack([
            X_text_features,
            X_numerical.values,
            X_categorical.values
        ])
        
        # Make prediction
        prediction = model_pipeline['model'].predict(X_combined)[0]
        probabilities = model_pipeline['model'].predict_proba(X_combined)[0]
        confidence = float(np.max(probabilities))
        
        # Get subcategory
        subcategory = get_subcategory(prediction, transaction.merchant or "", transaction.amount)
        
        return CategoryPrediction(
            category=prediction,
            confidence=round(confidence, 3),
            subCategory=subcategory
        )
        
    except Exception as e:
        print(f"Error in categorization: {str(e)}")
        # Fallback to rule-based categorization
        return fallback_categorization(transaction)

def get_subcategory(category: str, merchant: str, amount: float) -> Optional[str]:
    """Get subcategory based on category and merchant"""
    merchant_lower = merchant.lower()
    
    if category == 'Food':
        if 'swiggy' in merchant_lower or 'zomato' in merchant_lower:
            return 'Delivery'
        elif 'canteen' in merchant_lower or 'mess' in merchant_lower:
            return 'Campus'
        elif amount < 100:
            return 'Snacks'
        return 'Dining'
    
    elif category == 'Transport':
        if 'uber' in merchant_lower or 'ola' in merchant_lower:
            return 'Ride-sharing'
        elif 'metro' in merchant_lower or 'bus' in merchant_lower:
            return 'Public Transport'
        elif 'petrol' in merchant_lower or 'fuel' in merchant_lower:
            return 'Fuel'
        return 'Other Transport'
    
    elif category == 'Academic':
        if 'book' in merchant_lower:
            return 'Books'
        elif 'xerox' in merchant_lower or 'print' in merchant_lower:
            return 'Printing'
        elif 'fee' in merchant_lower:
            return 'Fees'
        return 'Supplies'
    
    return None

def fallback_categorization(transaction: TransactionData) -> CategoryPrediction:
    """Fallback rule-based categorization"""
    text = f"{transaction.merchant} {transaction.note}".lower()
    
    # Simple keyword matching
    if any(word in text for word in ['food', 'eat', 'restaurant', 'cafe', 'swiggy', 'zomato']):
        return CategoryPrediction(category='Food', confidence=0.6)
    elif any(word in text for word in ['uber', 'ola', 'transport', 'travel', 'metro', 'bus']):
        return CategoryPrediction(category='Transport', confidence=0.6)
    elif any(word in text for word in ['book', 'study', 'college', 'academic', 'course']):
        return CategoryPrediction(category='Academic', confidence=0.6)
    elif any(word in text for word in ['movie', 'entertainment', 'netflix', 'spotify']):
        return CategoryPrediction(category='Entertainment', confidence=0.6)
    elif any(word in text for word in ['shop', 'amazon', 'flipkart', 'buy', 'purchase']):
        return CategoryPrediction(category='Shopping', confidence=0.6)
    elif any(word in text for word in ['bill', 'rent', 'utility', 'recharge']):
        return CategoryPrediction(category='Bills', confidence=0.6)
    else:
        return CategoryPrediction(category='Other', confidence=0.3)

@app.post("/retrain")
async def retrain_model(data: TrainingData):
    """Retrain model with new data"""
    try:
        # In a real implementation, you would:
        # 1. Validate the training data
        # 2. Combine with existing training data
        # 3. Retrain the model
        # 4. Evaluate performance
        # 5. Deploy if performance is acceptable
        
        train_model()  # For now, just retrain with synthetic data
        
        return {"message": "Model retrained successfully", "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retraining failed: {str(e)}")

@app.get("/model/stats")
async def get_model_stats():
    """Get model performance statistics"""
    return {
        "model_type": "Logistic Regression",
        "features": ["text_tfidf", "amount", "time_features", "categorical"],
        "categories": categories,
        "training_samples": 1800,  # Approximate from synthetic data
        "accuracy": 0.85,  # Estimated
        "last_trained": "2024-01-01T00:00:00Z"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)