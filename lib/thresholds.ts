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
  | 'vibrationRms';

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
} as const;

