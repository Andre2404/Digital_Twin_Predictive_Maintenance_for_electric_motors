/**
 * POST /api/ml/predict
 * 
 * Endpoint for ML predictions - calls Python ML service
 * Also includes formula-based health score calculation
 * 
 * Data is received from client (Firebase) not from Prisma
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateHealthScore } from '@/lib/calculateHealthScore';

// ML Service URL
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8001';

interface VibrationReading {
  vibration_rms: number;
  timestamp?: number;
}

interface SensorData {
  gridVoltage?: number;
  motorCurrent?: number;
  power?: number;
  powerFactor?: number;
  gridFrequency?: number;
  vibrationRms?: number;
  motorSurfaceTemp?: number;
  bearingTemp?: number;
  dustDensity?: number;
}

interface MLPredictionResponse {
  classification: {
    will_fail_soon: boolean;
    failure_probability: number;
    confidence: string;
    threshold_minutes: number;
  };
  regression: {
    minutes_to_failure: number;
    hours_to_failure: number;
    status: string;
  };
  timestamp: string;
  readings_used: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vibrationReadings, sensorData } = body as {
      vibrationReadings?: VibrationReading[];
      sensorData?: SensorData;
    };
    
    // Calculate formula-based health score from sensor data
    const healthResult = calculateHealthScore({
      gridVoltage: sensorData?.gridVoltage,
      motorCurrent: sensorData?.motorCurrent,
      power: sensorData?.power,
      powerFactor: sensorData?.powerFactor,
      gridFrequency: sensorData?.gridFrequency,
      vibrationRms: sensorData?.vibrationRms,
      motorSurfaceTemp: sensorData?.motorSurfaceTemp,
      bearingTemp: sensorData?.bearingTemp,
      dustDensity: sensorData?.dustDensity,
    });
    
    // Prepare vibration readings for ML service
    const readings: VibrationReading[] = vibrationReadings || [];
    
    // Default ML response (if service unavailable or no readings)
    let mlPrediction: MLPredictionResponse | null = null;
    let mlServiceError: string | null = null;
    
    // Call Python ML service if we have readings
    if (readings.length >= 1) {
      try {
        console.log(`Calling ML service at ${ML_SERVICE_URL}/predict/both with ${readings.length} readings`);
        
        const mlResponse = await fetch(`${ML_SERVICE_URL}/predict/both`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ readings }),
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });
        
        if (mlResponse.ok) {
          mlPrediction = await mlResponse.json();
          console.log('ML prediction successful:', mlPrediction);
        } else {
          const errorData = await mlResponse.json().catch(() => ({}));
          mlServiceError = errorData.detail || `ML service error: ${mlResponse.status}`;
          console.error('ML service returned error:', mlServiceError);
        }
      } catch (error) {
        console.error('Error calling ML service:', error);
        mlServiceError = error instanceof Error ? error.message : 'ML service unavailable';
      }
    } else {
      mlServiceError = 'Not enough vibration readings for ML prediction (need at least 1)';
    }
    
    return NextResponse.json({
      success: true,
      
      // Formula-based health score
      healthScore: {
        score: healthResult.score,
        category: healthResult.category,
        factors: healthResult.factors,
      },
      
      // ML predictions (if available)
      mlPrediction: mlPrediction ? {
        classification: {
          willFailSoon: mlPrediction.classification.will_fail_soon,
          failureProbability: mlPrediction.classification.failure_probability,
          confidence: mlPrediction.classification.confidence,
          thresholdMinutes: mlPrediction.classification.threshold_minutes,
        },
        regression: {
          minutesToFailure: mlPrediction.regression.minutes_to_failure,
          hoursToFailure: mlPrediction.regression.hours_to_failure,
          status: mlPrediction.regression.status,
        },
        readingsUsed: mlPrediction.readings_used,
      } : null,
      
      // ML service status
      mlServiceStatus: mlPrediction ? 'available' : 'unavailable',
      mlServiceError,
      
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error running prediction:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      },
      { status: 500 }
    );
  }
}
