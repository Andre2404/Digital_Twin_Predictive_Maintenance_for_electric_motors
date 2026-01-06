/**
 * Mechasense - Threshold Configuration & Status Color Logic
 * 
 * This module defines safe operating ranges for all monitored parameters
 * and provides helpers to determine status colors based on current values.
 */

export type StatusLevel = 'normal' | 'warning' | 'critical';

export interface StatusResult {
  level: StatusLevel;
  label: string;
  color: string; // Tailwind color class
  bgColor: string; // Tailwind background color class
}

export type ParameterType = 
  | 'gridVoltage'
  | 'motorCurrent'
  | 'powerFactor'
  | 'gridFrequency'
  | 'motorSurfaceTemp'
  | 'bearingTemp'
  | 'dustDensity'
  | 'vibrationRms'
  | 'power'
  | 'apparentPower'
  | 'loadIndex'
  | 'ambientTemp'
  | 'deltaTemp'
  | 'vibrationPeakG'
  | 'crestFactor';

/**
 * Get status color and label based on parameter value and type
 */
export function getStatusColor(value: number, parameterType: ParameterType): StatusResult {
  switch (parameterType) {
    case 'gridVoltage':
      // Normal range: 200-240V (typical Indonesian grid voltage)
      if (value >= 200 && value <= 240) {
        return {
          level: 'normal',
          label: 'Normal',
          color: 'text-status-normal',
          bgColor: 'bg-status-normal'
        };
      } else if ((value >= 190 && value < 200) || (value > 240 && value <= 250)) {
        return {
          level: 'warning',
          label: 'Warning',
          color: 'text-status-warning',
          bgColor: 'bg-status-warning'
        };
      } else {
        return {
          level: 'critical',
          label: 'Critical',
          color: 'text-status-critical',
          bgColor: 'bg-status-critical'
        };
      }
    
    case 'motorCurrent':
      if (value < 4) {
        return {
          level: 'normal',
          label: 'Normal',
          color: 'text-status-normal',
          bgColor: 'bg-status-normal'
        };
      } else if (value >= 4 && value <= 5.5) {
        return {
          level: 'warning',
          label: 'Warning',
          color: 'text-status-warning',
          bgColor: 'bg-status-warning'
        };
      } else {
        return {
          level: 'critical',
          label: 'Critical',
          color: 'text-status-critical',
          bgColor: 'bg-status-critical'
        };
      }
    
    case 'powerFactor':
      if (value > 0.85) {
        return {
          level: 'normal',
          label: 'Normal',
          color: 'text-status-normal',
          bgColor: 'bg-status-normal'
        };
      } else if (value >= 0.7 && value <= 0.85) {
        return {
          level: 'warning',
          label: 'Warning',
          color: 'text-status-warning',
          bgColor: 'bg-status-warning'
        };
      } else {
        return {
          level: 'critical',
          label: 'Critical',
          color: 'text-status-critical',
          bgColor: 'bg-status-critical'
        };
      }
    
    case 'gridFrequency':
      if (value >= 49.5 && value <= 50.5) {
        return {
          level: 'normal',
          label: 'Normal',
          color: 'text-status-normal',
          bgColor: 'bg-status-normal'
        };
      } else {
        return {
          level: 'critical',
          label: 'Critical',
          color: 'text-status-critical',
          bgColor: 'bg-status-critical'
        };
      }
    
    case 'motorSurfaceTemp':
      if (value < 70) {
        return {
          level: 'normal',
          label: 'Normal',
          color: 'text-status-normal',
          bgColor: 'bg-status-normal'
        };
      } else if (value >= 70 && value <= 85) {
        return {
          level: 'warning',
          label: 'Warning',
          color: 'text-status-warning',
          bgColor: 'bg-status-warning'
        };
      } else {
        return {
          level: 'critical',
          label: 'Critical',
          color: 'text-status-critical',
          bgColor: 'bg-status-critical'
        };
      }
    
    case 'bearingTemp':
      // Same thresholds as motor surface temp
      if (value < 70) {
        return {
          level: 'normal',
          label: 'Normal',
          color: 'text-status-normal',
          bgColor: 'bg-status-normal'
        };
      } else if (value >= 70 && value <= 85) {
        return {
          level: 'warning',
          label: 'Warning',
          color: 'text-status-warning',
          bgColor: 'bg-status-warning'
        };
      } else {
        return {
          level: 'critical',
          label: 'Critical',
          color: 'text-status-critical',
          bgColor: 'bg-status-critical'
        };
      }
    
    case 'dustDensity':
      if (value < 50) {
        return {
          level: 'normal',
          label: 'Normal',
          color: 'text-status-normal',
          bgColor: 'bg-status-normal'
        };
      } else if (value >= 50 && value <= 100) {
        return {
          level: 'warning',
          label: 'Warning',
          color: 'text-status-warning',
          bgColor: 'bg-status-warning'
        };
      } else {
        return {
          level: 'critical',
          label: 'Critical',
          color: 'text-status-critical',
          bgColor: 'bg-status-critical'
        };
      }
    
    case 'vibrationRms':
      if (value < 2.8) {
        return {
          level: 'normal',
          label: 'Normal',
          color: 'text-status-normal',
          bgColor: 'bg-status-normal'
        };
      } else if (value >= 2.8 && value <= 4.5) {
        return {
          level: 'warning',
          label: 'Warning',
          color: 'text-status-warning',
          bgColor: 'bg-status-warning'
        };
      } else {
        return {
          level: 'critical',
          label: 'Critical',
          color: 'text-status-critical',
          bgColor: 'bg-status-critical'
        };
      }
    
    case 'power':
      // Normal range for small motor: < 500W, Warning: 500-750W, Critical: > 750W
      if (value < 500) {
        return {
          level: 'normal',
          label: 'Normal',
          color: 'text-status-normal',
          bgColor: 'bg-status-normal'
        };
      } else if (value >= 500 && value <= 750) {
        return {
          level: 'warning',
          label: 'Warning',
          color: 'text-status-warning',
          bgColor: 'bg-status-warning'
        };
      } else {
        return {
          level: 'critical',
          label: 'Critical',
          color: 'text-status-critical',
          bgColor: 'bg-status-critical'
        };
      }
    
    case 'apparentPower':
      // Normal: < 600VA, Warning: 600-900VA, Critical: > 900VA
      if (value < 600) {
        return {
          level: 'normal',
          label: 'Normal',
          color: 'text-status-normal',
          bgColor: 'bg-status-normal'
        };
      } else if (value >= 600 && value <= 900) {
        return {
          level: 'warning',
          label: 'Warning',
          color: 'text-status-warning',
          bgColor: 'bg-status-warning'
        };
      } else {
        return {
          level: 'critical',
          label: 'Critical',
          color: 'text-status-critical',
          bgColor: 'bg-status-critical'
        };
      }
    
    case 'loadIndex':
      // Load Index 0-1: Normal < 0.8, Warning 0.8-0.95, Critical > 0.95
      if (value < 0.8) {
        return {
          level: 'normal',
          label: 'Normal',
          color: 'text-status-normal',
          bgColor: 'bg-status-normal'
        };
      } else if (value >= 0.8 && value <= 0.95) {
        return {
          level: 'warning',
          label: 'Warning',
          color: 'text-status-warning',
          bgColor: 'bg-status-warning'
        };
      } else {
        return {
          level: 'critical',
          label: 'Overload',
          color: 'text-status-critical',
          bgColor: 'bg-status-critical'
        };
      }
    
    case 'ambientTemp':
      // Ambient temp: Normal < 35°C, Warning 35-45°C, Critical > 45°C
      if (value < 35) {
        return {
          level: 'normal',
          label: 'Normal',
          color: 'text-status-normal',
          bgColor: 'bg-status-normal'
        };
      } else if (value >= 35 && value <= 45) {
        return {
          level: 'warning',
          label: 'Warm',
          color: 'text-status-warning',
          bgColor: 'bg-status-warning'
        };
      } else {
        return {
          level: 'critical',
          label: 'Hot',
          color: 'text-status-critical',
          bgColor: 'bg-status-critical'
        };
      }
    
    case 'deltaTemp':
      // Delta Temp (Motor - Ambient): Normal < 30°C, Warning 30-50°C, Critical > 50°C
      if (value < 30) {
        return {
          level: 'normal',
          label: 'Normal',
          color: 'text-status-normal',
          bgColor: 'bg-status-normal'
        };
      } else if (value >= 30 && value <= 50) {
        return {
          level: 'warning',
          label: 'Elevated',
          color: 'text-status-warning',
          bgColor: 'bg-status-warning'
        };
      } else {
        return {
          level: 'critical',
          label: 'High Rise',
          color: 'text-status-critical',
          bgColor: 'bg-status-critical'
        };
      }
    
    case 'vibrationPeakG':
      // Vibration Peak (g): Normal < 0.5g, Warning 0.5-1.0g, Critical > 1.0g
      if (value < 0.5) {
        return {
          level: 'normal',
          label: 'Normal',
          color: 'text-status-normal',
          bgColor: 'bg-status-normal'
        };
      } else if (value >= 0.5 && value <= 1.0) {
        return {
          level: 'warning',
          label: 'Warning',
          color: 'text-status-warning',
          bgColor: 'bg-status-warning'
        };
      } else {
        return {
          level: 'critical',
          label: 'Critical',
          color: 'text-status-critical',
          bgColor: 'bg-status-critical'
        };
      }
    
    case 'crestFactor':
      // Crest Factor: Normal 3-5, Warning 5-7, Critical > 7 (indicates bearing damage)
      if (value >= 3 && value < 5) {
        return {
          level: 'normal',
          label: 'Normal',
          color: 'text-status-normal',
          bgColor: 'bg-status-normal'
        };
      } else if (value < 3 || (value >= 5 && value <= 7)) {
        return {
          level: 'warning',
          label: 'Warning',
          color: 'text-status-warning',
          bgColor: 'bg-status-warning'
        };
      } else {
        return {
          level: 'critical',
          label: 'Bearing Issue',
          color: 'text-status-critical',
          bgColor: 'bg-status-critical'
        };
      }
    
    default:
      return {
        level: 'normal',
        label: 'Unknown',
        color: 'text-gray-500',
        bgColor: 'bg-gray-500'
      };
  }
}

/**
 * Check if value exceeds thresholds and should generate alert
 */
export function shouldAlert(value: number, parameterType: ParameterType): boolean {
  const status = getStatusColor(value, parameterType);
  return status.level === 'warning' || status.level === 'critical';
}

/**
 * Get severity level for alert generation
 */
export function getAlertSeverity(value: number, parameterType: ParameterType): 'WARNING' | 'CRITICAL' | null {
  const status = getStatusColor(value, parameterType);
  if (status.level === 'critical') return 'CRITICAL';
  if (status.level === 'warning') return 'WARNING';
  return null;
}

/**
 * Parameter display configurations
 */
export const PARAMETER_CONFIG = {
  gridVoltage: {
    label: 'Grid Voltage',
    unit: 'V',
    icon: 'V',
  },
  motorCurrent: {
    label: 'Motor Current',
    unit: 'A',
    icon: 'I',
  },
  powerFactor: {
    label: 'Power Factor',
    unit: '',
    icon: 'PF',
  },
  gridFrequency: {
    label: 'Grid Frequency',
    unit: 'Hz',
    icon: 'f',
  },
  motorSurfaceTemp: {
    label: 'Motor Surface Temp',
    unit: '°C',
    icon: 'T',
  },
  bearingTemp: {
    label: 'Bearing Temp',
    unit: '°C',
    icon: 'T',
  },
  dustDensity: {
    label: 'Dust Density',
    unit: 'µg/m³',
    icon: 'D',
  },
  vibrationRms: {
    label: 'Vibration RMS',
    unit: 'mm/s',
    icon: 'V',
  },
  power: {
    label: 'Active Power',
    unit: 'W',
    icon: 'P',
  },
  apparentPower: {
    label: 'Apparent Power',
    unit: 'VA',
    icon: 'S',
  },
  loadIndex: {
    label: 'Load Index',
    unit: '',
    icon: 'L',
  },
  ambientTemp: {
    label: 'Ambient Temp',
    unit: '°C',
    icon: 'T',
  },
  deltaTemp: {
    label: 'Delta Temp',
    unit: '°C',
    icon: 'ΔT',
  },
  vibrationPeakG: {
    label: 'Vibration Peak',
    unit: 'g',
    icon: 'G',
  },
  crestFactor: {
    label: 'Crest Factor',
    unit: '',
    icon: 'CF',
  },
} as const;

