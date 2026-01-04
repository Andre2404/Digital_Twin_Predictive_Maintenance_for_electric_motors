"""
FastAPI ML Service for Bearing Failure Prediction

Endpoints:
- POST /predict/classification - Prediksi apakah bearing akan gagal dalam 300 menit
- POST /predict/regression - Prediksi berapa menit lagi sebelum bearing gagal
- POST /predict/both - Kedua prediksi sekaligus
"""

import os
import sys
from pathlib import Path
from typing import List, Optional
from datetime import datetime

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from joblib import load

# ============================================================
# CONFIGURATION
# ============================================================

# Model paths
BASE_DIR = Path(__file__).parent
MODEL_DIR = BASE_DIR / "models"

# Feature columns expected by the model
FEATURE_COLS = ['mean_bearing_1', 'std_bearing_1', 'max_bearing_1', 'min_bearing_1']

# ============================================================
# CUSTOM TRANSFORMER (Must be defined before loading model)
# This is the same class as in training notebook
# ============================================================

from sklearn.base import BaseEstimator, TransformerMixin

class TimeSeriesFeatureEngineer(BaseEstimator, TransformerMixin):
    """
    Custom transformer untuk feature engineering time series data.
    Must match the class used during training!
    """
    
    def __init__(self, feature_cols=None, rolling_windows=[3, 5, 10], 
                 lag_periods=[1, 2, 3], create_interactions=True):
        self.feature_cols = feature_cols
        self.rolling_windows = rolling_windows
        self.lag_periods = lag_periods
        self.create_interactions = create_interactions
        self.engineered_feature_names_ = []
    
    def fit(self, X, y=None):
        if self.feature_cols is None:
            if isinstance(X, pd.DataFrame):
                self.feature_cols = X.select_dtypes(include=[np.number]).columns.tolist()
            else:
                raise ValueError("feature_cols harus dispesifikasi jika X bukan DataFrame")
        return self
    
    def transform(self, X):
        if not isinstance(X, pd.DataFrame):
            X = pd.DataFrame(X, columns=self.feature_cols)
        
        X_eng = X.copy()
        
        # 1. Rolling Statistics
        for col in self.feature_cols:
            if col not in X_eng.columns:
                continue
            for window in self.rolling_windows:
                X_eng[f'{col}_rolling_mean_{window}'] = X_eng[col].rolling(window=window, min_periods=1).mean()
                X_eng[f'{col}_rolling_std_{window}'] = X_eng[col].rolling(window=window, min_periods=1).std().fillna(0)
                X_eng[f'{col}_rolling_min_{window}'] = X_eng[col].rolling(window=window, min_periods=1).min()
                X_eng[f'{col}_rolling_max_{window}'] = X_eng[col].rolling(window=window, min_periods=1).max()
        
        # 2. Lag Features
        for col in self.feature_cols:
            if col not in X_eng.columns:
                continue
            for lag in self.lag_periods:
                X_eng[f'{col}_lag_{lag}'] = X_eng[col].shift(lag).bfill()
        
        # 3. Rate of Change
        for col in self.feature_cols:
            if col not in X_eng.columns:
                continue
            X_eng[f'{col}_diff'] = X_eng[col].diff().fillna(0)
            X_eng[f'{col}_pct_change'] = X_eng[col].pct_change().fillna(0).replace([np.inf, -np.inf], 0)
        
        # 4. Interaction Features
        if self.create_interactions and len(self.feature_cols) > 1:
            for i, col1 in enumerate(self.feature_cols):
                if col1 not in X_eng.columns:
                    continue
                for col2 in self.feature_cols[i+1:]:
                    if col2 not in X_eng.columns:
                        continue
                    X_eng[f'{col1}_x_{col2}'] = X_eng[col1] * X_eng[col2]
        
        self.engineered_feature_names_ = list(X_eng.columns)
        return X_eng
    
    def get_feature_names_out(self, input_features=None):
        return np.array(self.engineered_feature_names_)

# ============================================================
# PYDANTIC MODELS
# ============================================================

class VibrationReading(BaseModel):
    """Single vibration sensor reading"""
    vibration_rms: float = Field(..., description="Vibration RMS value in mm/s")
    timestamp: Optional[int] = Field(None, description="Unix timestamp in milliseconds")

class PredictionRequest(BaseModel):
    """Request body for prediction endpoints"""
    readings: List[VibrationReading] = Field(
        ..., 
        min_length=1,
        description="List of vibration readings (min 1, recommended 10+)"
    )

class ClassificationResponse(BaseModel):
    """Response from classification prediction"""
    will_fail_soon: bool
    failure_probability: float
    confidence: str  # "High", "Medium", "Low"
    threshold_minutes: int = 300

class RegressionResponse(BaseModel):
    """Response from regression prediction"""
    minutes_to_failure: float
    hours_to_failure: float
    status: str  # "Critical", "Warning", "Normal"

class DualPredictionResponse(BaseModel):
    """Response from both predictions"""
    classification: ClassificationResponse
    regression: RegressionResponse
    timestamp: str
    readings_used: int

# ============================================================
# HELPER FUNCTIONS
# ============================================================

def calculate_bearing_features(readings: List[VibrationReading]) -> pd.DataFrame:
    """
    Calculate bearing features from vibration readings.
    
    Converts vibration_rms readings to:
    - mean_bearing_1: Mean of all readings
    - std_bearing_1: Standard deviation
    - max_bearing_1: Maximum value
    - min_bearing_1: Minimum value
    
    Returns a DataFrame with one row per reading (for time-series feature engineering)
    """
    vibration_values = [r.vibration_rms for r in readings]
    
    # Create rolling window statistics for each reading
    # This allows the model's feature engineering to work properly
    features_list = []
    
    for i in range(len(vibration_values)):
        # Get window of readings up to current point
        window = vibration_values[max(0, i-9):i+1]  # Last 10 readings
        
        features_list.append({
            'mean_bearing_1': np.mean(window),
            'std_bearing_1': np.std(window) if len(window) > 1 else 0,
            'max_bearing_1': np.max(window),
            'min_bearing_1': np.min(window),
        })
    
    return pd.DataFrame(features_list)


def get_confidence_level(probability: float) -> str:
    """Get confidence level from probability"""
    if probability > 0.8 or probability < 0.2:
        return "High"
    elif probability > 0.6 or probability < 0.4:
        return "Medium"
    else:
        return "Low"


def get_failure_status(minutes: float) -> str:
    """Get failure status from minutes to failure"""
    if minutes < 60:
        return "Critical"
    elif minutes < 300:
        return "Warning"
    else:
        return "Normal"

# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="Bearing Failure Prediction API",
    description="ML Service untuk prediksi kegagalan bearing motor listrik",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model variables
clf_model = None
reg_model = None


@app.on_event("startup")
async def load_models():
    """Load ML models on startup"""
    global clf_model, reg_model
    
    clf_path = MODEL_DIR / "klasifikasi.pkl"
    reg_path = MODEL_DIR / "prediksi.pkl"
    
    try:
        if clf_path.exists():
            clf_model = load(clf_path)
            print(f"✓ Classification model loaded: {clf_path}")
        else:
            print(f"⚠ Classification model not found: {clf_path}")
        
        if reg_path.exists():
            reg_model = load(reg_path)
            print(f"✓ Regression model loaded: {reg_path}")
        else:
            print(f"⚠ Regression model not found: {reg_path}")
            
    except Exception as e:
        print(f"❌ Error loading models: {e}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "models": {
            "classification": clf_model is not None,
            "regression": reg_model is not None,
        },
        "timestamp": datetime.now().isoformat()
    }


@app.post("/predict/classification", response_model=ClassificationResponse)
async def predict_classification(request: PredictionRequest):
    """Predict if bearing will fail within 300 minutes"""
    if clf_model is None:
        raise HTTPException(status_code=503, detail="Classification model not loaded")
    
    try:
        # Calculate features
        features_df = calculate_bearing_features(request.readings)
        
        # Get last row for prediction (most recent state)
        X = features_df.tail(1)
        
        # Predict
        prediction = clf_model.predict(X)[0]
        probability = clf_model.predict_proba(X)[0][1]
        
        return ClassificationResponse(
            will_fail_soon=bool(prediction == 1),
            failure_probability=round(float(probability), 4),
            confidence=get_confidence_level(probability),
            threshold_minutes=300
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.post("/predict/regression", response_model=RegressionResponse)
async def predict_regression(request: PredictionRequest):
    """Predict minutes to failure"""
    if reg_model is None:
        raise HTTPException(status_code=503, detail="Regression model not loaded")
    
    try:
        # Calculate features
        features_df = calculate_bearing_features(request.readings)
        
        # Get last row for prediction
        X = features_df.tail(1)
        
        # Predict
        minutes = reg_model.predict(X)[0]
        minutes = max(0, float(minutes))  # Ensure non-negative
        
        return RegressionResponse(
            minutes_to_failure=round(minutes, 2),
            hours_to_failure=round(minutes / 60, 2),
            status=get_failure_status(minutes)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.post("/predict/both", response_model=DualPredictionResponse)
async def predict_both(request: PredictionRequest):
    """Get both classification and regression predictions"""
    if clf_model is None or reg_model is None:
        raise HTTPException(status_code=503, detail="Models not fully loaded")
    
    try:
        # Calculate features once
        features_df = calculate_bearing_features(request.readings)
        X = features_df.tail(1)
        
        # Classification prediction
        clf_pred = clf_model.predict(X)[0]
        clf_proba = clf_model.predict_proba(X)[0][1]
        
        # Regression prediction
        reg_pred = max(0, float(reg_model.predict(X)[0]))
        
        return DualPredictionResponse(
            classification=ClassificationResponse(
                will_fail_soon=bool(clf_pred == 1),
                failure_probability=round(float(clf_proba), 4),
                confidence=get_confidence_level(clf_proba),
                threshold_minutes=300
            ),
            regression=RegressionResponse(
                minutes_to_failure=round(reg_pred, 2),
                hours_to_failure=round(reg_pred / 60, 2),
                status=get_failure_status(reg_pred)
            ),
            timestamp=datetime.now().isoformat(),
            readings_used=len(request.readings)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
