'use client';

import { getStatusColor } from '@/lib/thresholds';
import { formatNumber } from '@/lib/utils';

interface TemperaturePanelProps {
  motorSurfaceTemp: number;
  bearingTemp: number;
  ambientTemp?: number;
  deltaTemp?: number;
  tempGradient?: number;
  bearingMotorTempDiff?: number;
  hotspot?: boolean;
}

export function TemperaturePanel({ 
  motorSurfaceTemp, 
  bearingTemp,
  ambientTemp,
  deltaTemp,
  tempGradient,
  bearingMotorTempDiff,
  hotspot,
}: TemperaturePanelProps) {
  // Validasi dan normalisasi nilai
  const safeMotorTemp = typeof motorSurfaceTemp === 'number' && !isNaN(motorSurfaceTemp) ? motorSurfaceTemp : 0;
  const safeBearingTemp = typeof bearingTemp === 'number' && !isNaN(bearingTemp) ? bearingTemp : 0;
  const safeAmbientTemp = typeof ambientTemp === 'number' && !isNaN(ambientTemp) ? ambientTemp : 0;
  const safeDeltaTemp = typeof deltaTemp === 'number' && !isNaN(deltaTemp) ? deltaTemp : 0;
  const safeTempGradient = typeof tempGradient === 'number' && !isNaN(tempGradient) ? tempGradient : 0;
  const safeBearingMotorDiff = typeof bearingMotorTempDiff === 'number' && !isNaN(bearingMotorTempDiff) ? bearingMotorTempDiff : 0;
  
  const motorStatus = getStatusColor(safeMotorTemp, 'motorSurfaceTemp');
  const bearingStatus = getStatusColor(safeBearingTemp, 'bearingTemp');
  const ambientStatus = getStatusColor(safeAmbientTemp, 'ambientTemp');
  const deltaStatus = getStatusColor(safeDeltaTemp, 'deltaTemp');
  
  // Perhitungan width progress bar: suhu/100 * 100% (range 0-100°C)
  const motorProgressWidth = Math.min(Math.max(safeMotorTemp, 0), 100);
  const bearingProgressWidth = Math.min(Math.max(safeBearingTemp, 0), 100);
  
  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Temperature Monitoring
        {/* Hotspot Indicator */}
        {hotspot && (
          <span className="ml-auto px-2 py-1 text-xs font-bold bg-red-500 text-white rounded-full animate-pulse flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
            </svg>
            HOTSPOT
          </span>
        )}
      </h3>
      
      {/* Motor Surface Temperature */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Motor Surface (IR)</span>
          <span className={`text-lg font-bold ${motorStatus.color}`}>
            {formatNumber(safeMotorTemp, 1)}°C
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden relative border border-gray-300">
          <div 
            className={`h-full ${motorStatus.bgColor} transition-all duration-500 rounded-full relative z-10`}
            style={{ 
              width: `${motorProgressWidth}%`,
            }}
          ></div>
          {/* Threshold markers at 70% and 85% positions */}
          <div className="absolute top-0 bottom-0 left-[70%] w-0.5 bg-yellow-500 opacity-50 pointer-events-none z-20"></div>
          <div className="absolute top-0 bottom-0 left-[85%] w-0.5 bg-red-500 opacity-50 pointer-events-none z-20"></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0°C</span>
          <span className="text-status-warning font-medium">70°C</span>
          <span className="text-status-critical font-medium">85°C</span>
          <span>100°C</span>
        </div>
      </div>
      
      {/* Bearing Temperature */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Bearing (DS18B20)</span>
          <span className={`text-lg font-bold ${bearingStatus.color}`}>
            {formatNumber(safeBearingTemp, 1)}°C
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden relative border border-gray-300">
          <div 
            className={`h-full ${bearingStatus.bgColor} transition-all duration-500 rounded-full relative z-10`}
            style={{ 
              width: `${bearingProgressWidth}%`,
            }}
          ></div>
          {/* Threshold markers at 70% and 85% positions */}
          <div className="absolute top-0 bottom-0 left-[70%] w-0.5 bg-yellow-500 opacity-50 pointer-events-none z-20"></div>
          <div className="absolute top-0 bottom-0 left-[85%] w-0.5 bg-red-500 opacity-50 pointer-events-none z-20"></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0°C</span>
          <span className="text-status-warning font-medium">70°C</span>
          <span className="text-status-critical font-medium">85°C</span>
          <span>100°C</span>
        </div>
      </div>

      {/* Additional Temperature Metrics */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
        {/* Ambient Temperature */}
        <div className="p-2 bg-gray-50 rounded-lg">
          <span className="text-xs font-medium text-gray-500 block">Ambient</span>
          <span className={`text-lg font-bold ${ambientStatus.color}`}>
            {formatNumber(safeAmbientTemp, 1)}°C
          </span>
        </div>

        {/* Delta Temperature */}
        <div className="p-2 bg-gray-50 rounded-lg">
          <span className="text-xs font-medium text-gray-500 block">ΔT (Motor-Ambient)</span>
          <span className={`text-lg font-bold ${deltaStatus.color}`}>
            {formatNumber(safeDeltaTemp, 1)}°C
          </span>
        </div>

        {/* Temperature Gradient */}
        <div className="p-2 bg-gray-50 rounded-lg">
          <span className="text-xs font-medium text-gray-500 block">Temp Gradient</span>
          <span className="text-lg font-bold text-gray-800">
            {formatNumber(safeTempGradient, 2)}°C
          </span>
        </div>

        {/* Bearing-Motor Difference */}
        <div className="p-2 bg-gray-50 rounded-lg">
          <span className="text-xs font-medium text-gray-500 block">Bearing-Motor Diff</span>
          <span className={`text-lg font-bold ${safeBearingMotorDiff > 10 ? 'text-status-warning' : 'text-gray-800'}`}>
            {formatNumber(safeBearingMotorDiff, 1)}°C
          </span>
        </div>
      </div>
    </div>
  );
}
