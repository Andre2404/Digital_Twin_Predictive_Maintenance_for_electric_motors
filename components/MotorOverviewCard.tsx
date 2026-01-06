'use client';

import { formatNumber } from '@/lib/utils';

interface MotorOverviewCardProps {
  motorName: string;
  healthScore: number; // 0-100
  status: 'Normal' | 'Perlu Inspeksi' | 'Kritikal';
  operatingHoursToday: number;
  dailyEnergy: number;
}

export function MotorOverviewCard({
  motorName,
  healthScore,
  status,
  operatingHoursToday,
  dailyEnergy,
}: MotorOverviewCardProps) {
  // Determine status color
  const statusColor = 
    status === 'Normal' 
      ? 'bg-status-normal' 
      : status === 'Perlu Inspeksi' 
      ? 'bg-status-warning' 
      : 'bg-status-critical';
  
  // Health score color gradient
  const healthColor = 
    healthScore >= 80 
      ? 'text-status-normal' 
      : healthScore >= 60 
      ? 'text-status-warning' 
      : 'text-status-critical';
  
  return (
    <div className="card-dark hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">{motorName}</h2>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${statusColor}`}>
            <div className="status-dot bg-white"></div>
            <span className="text-sm font-medium text-white">{status}</span>
          </div>
        </div>
        
        {/* Health Score Gauge */}
        <div className="text-center">
          <div className="relative w-24 h-24">
            <svg className="transform -rotate-90 w-24 h-24">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="white"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${healthScore * 2.51} 251`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold ${healthColor}`}>{healthScore}</span>
              <span className="text-xs text-white opacity-80">Health</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white border-opacity-20">
        <div>
          <p className="text-xs text-white opacity-70">Jam Operasi Hari Ini</p>
          <p className="text-xl font-bold text-white">{formatNumber(operatingHoursToday, 1)} hrs</p>
        </div>
        <div>
          <p className="text-xs text-white opacity-70">Energi Harian</p>
          <p className="text-xl font-bold text-white">{formatNumber(dailyEnergy, 2)} kWh</p>
        </div>
      </div>
    </div>
  );
}

