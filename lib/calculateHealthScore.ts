/**
 * Motor Health Score Calculation (Formula-Based)
 * 
 * Calculates health score 0-100 based on sensor readings without ML.
 * Higher score = healthier motor.
 */

import { type ParameterStatus, getParameterStatus } from './thresholds';

export interface SensorReading {
  // Electrical
  gridVoltage?: number;
  motorCurrent?: number;
  power?: number;
  powerFactor?: number;
  gridFrequency?: number;
  
  // Mechanical
  vibrationRms?: number;
  vibrationPeakG?: number;
  
  // Thermal
  motorSurfaceTemp?: number;
  bearingTemp?: number;
  ambientTemp?: number;
  
  // Environmental
  dustDensity?: number;
}

export interface HealthScoreResult {
  score: number;           // 0-100
  category: 'Healthy' | 'At Risk' | 'Critical';
  factors: HealthFactor[]; // Contributing factors
}

export interface HealthFactor {
  parameter: string;
  value: number;
  status: ParameterStatus;
  penalty: number;
}

/**
 * Calculate health score from sensor readings.
 * 
 * Formula:
 * - Start at 100 points
 * - Deduct points based on parameter severity
 * - Return final score 0-100
 */
export function calculateHealthScore(reading: SensorReading): HealthScoreResult {
  let score = 100;
  const factors: HealthFactor[] = [];
  
  // Helper to add a factor
  const addFactor = (
    parameter: string, 
    value: number | undefined, 
    thresholds: { warning: number; critical: number; isLower?: boolean },
    maxPenalty: number
  ) => {
    if (value === undefined || value === null) return;
    
    let status: ParameterStatus = 'normal';
    let penalty = 0;
    
    if (thresholds.isLower) {
      // Lower is worse (e.g., power factor)
      if (value < thresholds.critical) {
        status = 'critical';
        penalty = maxPenalty;
      } else if (value < thresholds.warning) {
        status = 'warning';
        penalty = maxPenalty * 0.5;
      }
    } else {
      // Higher is worse (e.g., temperature)
      if (value > thresholds.critical) {
        status = 'critical';
        penalty = maxPenalty;
      } else if (value > thresholds.warning) {
        status = 'warning';
        penalty = maxPenalty * 0.5;
      }
    }
    
    if (penalty > 0) {
      score -= penalty;
      factors.push({ parameter, value, status, penalty });
    }
  };
  
  // ============================================================
  // VIBRATION (max penalty: 25 points)
  // ISO 10816 standards for small machines
  // ============================================================
  addFactor('vibrationRms', reading.vibrationRms, {
    warning: 2.8,   // mm/s - "Satisfactory" limit
    critical: 4.5,  // mm/s - "Unsatisfactory" limit
  }, 25);
  
  // ============================================================
  // MOTOR SURFACE TEMPERATURE (max penalty: 20 points)
  // Class B insulation: max 130°C rise, typically 80°C ambient+rise
  // ============================================================
  addFactor('motorSurfaceTemp', reading.motorSurfaceTemp, {
    warning: 70,    // °C - Getting warm
    critical: 85,   // °C - Too hot, risk of damage
  }, 20);
  
  // ============================================================
  // BEARING TEMPERATURE (max penalty: 20 points)
  // Bearings should not exceed 80°C for standard grease
  // ============================================================
  addFactor('bearingTemp', reading.bearingTemp, {
    warning: 65,    // °C - Warm
    critical: 80,   // °C - Risk of grease degradation
  }, 20);
  
  // ============================================================
  // MOTOR CURRENT (max penalty: 15 points)
  // Based on typical 1HP motor rated ~4A, overload at 115%
  // ============================================================
  addFactor('motorCurrent', reading.motorCurrent, {
    warning: 4.6,   // A - Above rated
    critical: 5.5,  // A - Overload
  }, 15);
  
  // ============================================================
  // POWER FACTOR (max penalty: 15 points)
  // Good PF is > 0.85, poor < 0.7
  // ============================================================
  addFactor('powerFactor', reading.powerFactor, {
    warning: 0.85,
    critical: 0.70,
    isLower: true,
  }, 15);
  
  // ============================================================
  // VOLTAGE DEVIATION (max penalty: 10 points)
  // +/- 10% of 220V is acceptable
  // ============================================================
  if (reading.gridVoltage !== undefined) {
    const nominalVoltage = 220;
    const deviation = Math.abs(reading.gridVoltage - nominalVoltage) / nominalVoltage;
    
    if (deviation > 0.15) {
      score -= 10;
      factors.push({
        parameter: 'gridVoltage',
        value: reading.gridVoltage,
        status: 'critical',
        penalty: 10,
      });
    } else if (deviation > 0.10) {
      score -= 5;
      factors.push({
        parameter: 'gridVoltage',
        value: reading.gridVoltage,
        status: 'warning',
        penalty: 5,
      });
    }
  }
  
  // ============================================================
  // DUST DENSITY (max penalty: 10 points)
  // High dust affects cooling and insulation
  // ============================================================
  addFactor('dustDensity', reading.dustDensity, {
    warning: 50,    // µg/m³
    critical: 100,  // µg/m³
  }, 10);
  
  // ============================================================
  // FREQUENCY DEVIATION (max penalty: 5 points)
  // Should be very close to 50Hz (±1%)
  // ============================================================
  if (reading.gridFrequency !== undefined) {
    const deviation = Math.abs(reading.gridFrequency - 50) / 50;
    
    if (deviation > 0.02) {
      score -= 5;
      factors.push({
        parameter: 'gridFrequency',
        value: reading.gridFrequency,
        status: 'critical',
        penalty: 5,
      });
    } else if (deviation > 0.01) {
      score -= 2;
      factors.push({
        parameter: 'gridFrequency',
        value: reading.gridFrequency,
        status: 'warning',
        penalty: 2,
      });
    }
  }
  
  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));
  
  // Determine category
  let category: 'Healthy' | 'At Risk' | 'Critical';
  if (score >= 80) {
    category = 'Healthy';
  } else if (score >= 60) {
    category = 'At Risk';
  } else {
    category = 'Critical';
  }
  
  // Sort factors by penalty (highest first)
  factors.sort((a, b) => b.penalty - a.penalty);
  
  return {
    score: Math.round(score),
    category,
    factors,
  };
}

/**
 * Get health score category color
 */
export function getHealthCategoryColor(category: string): string {
  switch (category) {
    case 'Healthy':
      return 'text-status-normal';
    case 'At Risk':
      return 'text-status-warning';
    case 'Critical':
      return 'text-status-critical';
    default:
      return 'text-gray-500';
  }
}

/**
 * Get health score background color
 */
export function getHealthCategoryBgColor(category: string): string {
  switch (category) {
    case 'Healthy':
      return 'bg-status-normal';
    case 'At Risk':
      return 'bg-status-warning';
    case 'Critical':
      return 'bg-status-critical';
    default:
      return 'bg-gray-500';
  }
}
