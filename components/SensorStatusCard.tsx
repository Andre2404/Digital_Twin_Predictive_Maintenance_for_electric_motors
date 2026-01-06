'use client';

import { getStatusColor, PARAMETER_CONFIG, type ParameterType } from '@/lib/thresholds';
import { formatNumber } from '@/lib/utils';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface SensorStatusCardProps {
  parameter: ParameterType;
  value: number;
  history?: number[]; // Last N values for sparkline
}

export function SensorStatusCard({ parameter, value, history = [] }: SensorStatusCardProps) {
  const config = PARAMETER_CONFIG[parameter];
  const status = getStatusColor(value, parameter);
  
  // Prepare sparkline data
  const sparklineData = history.map((val, idx) => ({ value: val, index: idx }));
  
  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h3 className="text-sm font-medium text-gray-600">{config.label}</h3>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-gray-900">
                {formatNumber(value, parameter === 'powerFactor' ? 3 : 1)}
              </span>
              <span className="text-sm text-gray-500">{config.unit}</span>
            </div>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className={`px-2 py-1 rounded-full text-xs font-semibold ${status.bgColor} text-white`}>
          {status.label}
        </div>
      </div>
      
      {/* Sparkline Chart */}
      {sparklineData.length > 0 && (
        <div className="h-12 -mx-2 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={status.level === 'normal' ? '#10b981' : status.level === 'warning' ? '#f59e0b' : '#ef4444'} 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

