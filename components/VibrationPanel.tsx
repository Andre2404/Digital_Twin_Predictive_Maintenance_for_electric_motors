'use client';

import { getStatusColor } from '@/lib/thresholds';
import { formatNumber } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface VibrationPanelProps {
  vibrationRms: number;
  faultFrequency?: number;
  rotorUnbalanceScore: number;
  bearingHealthScore: number;
  faultSpectrum?: { frequency: number; amplitude: number }[];
  vibrationPeakG?: number;
  crestFactor?: number;
}

export function VibrationPanel({
  vibrationRms,
  faultFrequency,
  rotorUnbalanceScore,
  bearingHealthScore,
  faultSpectrum = [],
  vibrationPeakG,
  crestFactor,
}: VibrationPanelProps) {
  const vibrationStatus = getStatusColor(vibrationRms, 'vibrationRms');
  
  // Data for rotor/bearing health pie charts
  const rotorData = [
    { name: 'Healthy', value: rotorUnbalanceScore },
    { name: 'Risk', value: 100 - rotorUnbalanceScore },
  ];
  
  const bearingData = [
    { name: 'Healthy', value: bearingHealthScore },
    { name: 'Risk', value: 100 - bearingHealthScore },
  ];
  
  const COLORS = {
    healthy: '#10b981',
    risk: '#e5e7eb',
  };
  
  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
        Vibration Analysis
      </h3>
      
      {/* Vibration RMS */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Vibration RMS</span>
          <div className="flex items-center gap-2">
            <span className={`text-xl font-bold ${vibrationStatus.color}`}>
              {formatNumber(vibrationRms, 2)}
            </span>
            <span className="text-sm text-gray-500">mm/s</span>
          </div>
        </div>
        {/* Progress bar dengan max 10 mm/s - perhitungan: (vibrationRms / 10) * 100% */}
        {/* Threshold: Normal < 2.8 (28%), Warning 2.8-4.5 (17%), Critical > 4.5 (55%) */}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden relative">
          {/* Progress indicator - sesuai dengan nilai aktual */}
          <div 
            className={`h-full ${vibrationStatus.bgColor} transition-all duration-500`}
            style={{ width: `${Math.min((vibrationRms / 10) * 100, 100)}%` }}
          ></div>
          {/* Threshold markers sebagai garis vertikal */}
          <div className="absolute top-0 bottom-0 left-[28%] w-0.5 bg-status-warning opacity-50"></div>
          <div className="absolute top-0 bottom-0 left-[45%] w-0.5 bg-status-critical opacity-50"></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0</span>
          <span className="text-status-warning font-medium">2.8</span>
          <span className="text-status-critical font-medium">4.5</span>
          <span>10 mm/s</span>
        </div>
        {faultFrequency && (
          <p className="text-xs text-gray-500 mt-1">
            Dominant Fault Frequency: {formatNumber(faultFrequency, 1)} Hz
          </p>
        )}
      </div>

      {/* Vibration Peak & Crest Factor */}
      {(vibrationPeakG !== undefined || crestFactor !== undefined) && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {vibrationPeakG !== undefined && (
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Peak Vibration</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(vibrationPeakG, 'vibrationPeakG').bgColor} text-white`}>
                  {getStatusColor(vibrationPeakG, 'vibrationPeakG').label}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-bold ${getStatusColor(vibrationPeakG, 'vibrationPeakG').color}`}>
                  {formatNumber(vibrationPeakG, 4)}
                </span>
                <span className="text-sm text-gray-500">g</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Peak acceleration</p>
            </div>
          )}

          {crestFactor !== undefined && (
            <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Crest Factor</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(crestFactor, 'crestFactor').bgColor} text-white`}>
                  {getStatusColor(crestFactor, 'crestFactor').label}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-bold ${getStatusColor(crestFactor, 'crestFactor').color}`}>
                  {formatNumber(crestFactor, 2)}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Peak/RMS ratio (3-5 normal)</p>
            </div>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rotor Unbalance */}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-600 mb-2">Rotor Balance</p>
          <div className="h-32 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rotorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                >
                  <Cell fill={COLORS.healthy} />
                  <Cell fill={COLORS.risk} />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute">
              <p className="text-2xl font-bold text-gray-800">{formatNumber(rotorUnbalanceScore, 0)}%</p>
            </div>
          </div>
        </div>
        
        {/* Bearing Health */}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-600 mb-2">Bearing Health</p>
          <div className="h-32 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bearingData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                >
                  <Cell fill={COLORS.healthy} />
                  <Cell fill={COLORS.risk} />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute">
              <p className="text-2xl font-bold text-gray-800">{formatNumber(bearingHealthScore, 0)}%</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Fault Frequency Spectrum */}
      {faultSpectrum.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-600 mb-2">Frequency Spectrum</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={faultSpectrum}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="frequency" label={{ value: 'Hz', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Amplitude', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Line type="monotone" dataKey="amplitude" stroke="#1B3C53" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

