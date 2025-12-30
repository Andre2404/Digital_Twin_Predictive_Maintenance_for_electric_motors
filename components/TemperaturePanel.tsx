'use client';

import { getStatusColor } from '@/lib/thresholds';
import { formatNumber } from '@/lib/utils';

interface TemperaturePanelProps {
  motorSurfaceTemp: number;
  bearingTemp: number;
}

export function TemperaturePanel({ motorSurfaceTemp, bearingTemp }: TemperaturePanelProps) {
  // Validasi dan normalisasi nilai
  const safeMotorTemp = typeof motorSurfaceTemp === 'number' && !isNaN(motorSurfaceTemp) ? motorSurfaceTemp : 0;
  const safeBearingTemp = typeof bearingTemp === 'number' && !isNaN(bearingTemp) ? bearingTemp : 0;
  
  const motorStatus = getStatusColor(safeMotorTemp, 'motorSurfaceTemp');
  const bearingStatus = getStatusColor(safeBearingTemp, 'bearingTemp');
  
  // Perhitungan width progress bar: (suhu / max) * 100%
  // Max = 100°C, jadi 34.9°C = (34.9 / 100) * 100 = 34.9%
  const motorProgressWidth = Math.min(Math.max((safeMotorTemp / 100) * 100, 0), 100);
  const bearingProgressWidth = Math.min(Math.max((safeBearingTemp / 100) * 100, 0), 100);
  
  // Debug logging (hanya di development)
  if (process.env.NODE_ENV === 'development') {
    console.log('🌡️ TemperaturePanel Debug:', {
      motorSurfaceTemp,
      safeMotorTemp,
      motorProgressWidth: `${motorProgressWidth}%`,
      bearingTemp,
      safeBearingTemp,
      bearingProgressWidth: `${bearingProgressWidth}%`,
    });
  }
  
  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Temperature Monitoring
      </h3>
      
      {/* Motor Surface Temperature */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Motor Surface (IR)</span>
          <span className={`text-lg font-bold ${motorStatus.color}`}>
            {formatNumber(safeMotorTemp, 1)}°C
          </span>
        </div>
        {/* Progress bar dengan max 100°C - perhitungan: (suhu / 100) * 100% */}
        {/* Contoh: 34.9°C = (34.9 / 100) * 100 = 34.9% width */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden relative border border-gray-300">
          {/* Progress indicator - sesuai dengan nilai aktual (PENTING: ini adalah indikator sebenarnya) */}
          <div 
            className={`h-full ${motorStatus.bgColor} transition-all duration-500 rounded-full relative z-10`}
            style={{ 
              width: `${motorProgressWidth}%`,
              minWidth: motorProgressWidth > 0 ? '2px' : '0px',
              boxShadow: motorProgressWidth > 0 ? '0 0 2px rgba(0,0,0,0.2)' : 'none',
              borderRight: motorProgressWidth > 0 && motorProgressWidth < 100 ? '2px solid rgba(255,255,255,0.8)' : 'none'
            }}
            title={`${safeMotorTemp.toFixed(1)}°C (${motorProgressWidth.toFixed(1)}%)`}
          ></div>
          {/* Threshold markers sebagai garis vertikal tipis (hanya referensi, bukan progress) */}
          <div className="absolute top-0 bottom-0 left-[70%] w-0.5 bg-status-warning opacity-30 pointer-events-none z-0"></div>
          <div className="absolute top-0 bottom-0 left-[85%] w-0.5 bg-status-critical opacity-30 pointer-events-none z-0"></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0°C</span>
          <span className="text-status-warning font-medium">70°C</span>
          <span className="text-status-critical font-medium">85°C</span>
          <span>100°C</span>
        </div>
      </div>
      
      {/* Bearing Temperature */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Bearing (DS18B20)</span>
          <span className={`text-lg font-bold ${bearingStatus.color}`}>
            {formatNumber(safeBearingTemp, 1)}°C
          </span>
        </div>
        {/* Progress bar dengan max 100°C - perhitungan: (suhu / 100) * 100% */}
        {/* Contoh: 29.6°C = (29.6 / 100) * 100 = 29.6% width */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden relative border border-gray-300">
          {/* Progress indicator - sesuai dengan nilai aktual (PENTING: ini adalah indikator sebenarnya) */}
          <div 
            className={`h-full ${bearingStatus.bgColor} transition-all duration-500 rounded-full relative z-10`}
            style={{ 
              width: `${bearingProgressWidth}%`,
              minWidth: bearingProgressWidth > 0 ? '2px' : '0px',
              boxShadow: bearingProgressWidth > 0 ? '0 0 2px rgba(0,0,0,0.2)' : 'none',
              borderRight: bearingProgressWidth > 0 && bearingProgressWidth < 100 ? '2px solid rgba(255,255,255,0.8)' : 'none'
            }}
            title={`${safeBearingTemp.toFixed(1)}°C (${bearingProgressWidth.toFixed(1)}%)`}
          ></div>
          {/* Threshold markers sebagai garis vertikal tipis (hanya referensi, bukan progress) */}
          <div className="absolute top-0 bottom-0 left-[70%] w-0.5 bg-status-warning opacity-30 pointer-events-none z-0"></div>
          <div className="absolute top-0 bottom-0 left-[85%] w-0.5 bg-status-critical opacity-30 pointer-events-none z-0"></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0°C</span>
          <span className="text-status-warning font-medium">70°C</span>
          <span className="text-status-critical font-medium">85°C</span>
          <span>100°C</span>
        </div>
      </div>
    </div>
  );
}

