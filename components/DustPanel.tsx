'use client';

import { getStatusColor } from '@/lib/thresholds';
import { formatNumber } from '@/lib/utils';

interface DustPanelProps {
  dustDensity: number;
  soilingLossPercent: number;
}

export function DustPanel({ dustDensity, soilingLossPercent }: DustPanelProps) {
  const dustStatus = getStatusColor(dustDensity, 'dustDensity');
  
  // Determine dust category
  const getDustCategory = (density: number) => {
    if (density < 50) return { label: 'Baik', color: 'text-status-normal' };
    if (density < 100) return { label: 'Sedang', color: 'text-status-warning' };
    return { label: 'Buruk', color: 'text-status-critical' };
  };
  
  const category = getDustCategory(dustDensity);
  
  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
        Dust & Air Quality
      </h3>
      
      {/* Dust Density Gauge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">Dust Density</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${dustStatus.color}`}>
              {formatNumber(dustDensity, 1)}
            </span>
            <span className="text-sm text-gray-500">µg/m³</span>
          </div>
          <p className={`text-sm font-medium mt-1 ${category.color}`}>
            Kualitas Udara: {category.label}
          </p>
        </div>
        
        {/* Visual gauge - Threshold: Normal < 50, Warning 50-100, Critical > 100, Max 200 */}
        {/* Circumference = 2 * π * 36 ≈ 226.2, untuk 200 max: 1 unit = 1.131 */}
        <div className="relative w-24 h-24">
          <svg className="transform -rotate-90 w-24 h-24">
            {/* Background circle */}
            <circle
              cx="48"
              cy="48"
              r="36"
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="none"
            />
            {/* Main gauge indicator - sesuai dengan nilai aktual */}
            <circle
              cx="48"
              cy="48"
              r="36"
              stroke={dustStatus.level === 'normal' ? '#10b981' : dustStatus.level === 'warning' ? '#f59e0b' : '#ef4444'}
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${Math.min((dustDensity / 200) * 226.2, 226.2)} 226.2`}
              strokeLinecap="round"
              className="relative z-10"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span className="text-xs text-gray-600 block">0-200</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">
                <span className="text-status-warning font-medium">50</span> | <span className="text-status-critical font-medium">100</span>
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Soiling Loss */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-amber-800">Perkiraan Penurunan Efisiensi</p>
            <p className="text-xs text-amber-600 mt-1">Akibat penumpukan debu</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-amber-700">
              {formatNumber(soilingLossPercent, 2)}%
            </p>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-2 w-full bg-amber-100 rounded-full h-2">
          <div 
            className="h-full bg-amber-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(soilingLossPercent, 100)}%` }}
          ></div>
        </div>
      </div>
      
      {/* Recommendations */}
      <div className="mt-3 text-xs text-gray-600 space-y-1">
        {dustDensity > 100 && (
          <p className="flex items-center gap-1">
            <svg className="w-4 h-4 text-status-critical" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Disarankan untuk membersihkan area motor
          </p>
        )}
        {soilingLossPercent > 5 && (
          <p className="flex items-center gap-1">
            <svg className="w-4 h-4 text-status-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Efisiensi menurun, pertimbangkan maintenance
          </p>
        )}
      </div>
    </div>
  );
}

