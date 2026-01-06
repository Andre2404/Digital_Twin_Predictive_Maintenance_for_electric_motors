'use client';

import { getStatusColor } from '@/lib/thresholds';
import { formatNumber } from '@/lib/utils';

interface ElectricalPanelProps {
  power: number;
  apparentPower: number;
  loadIndex: number;
  currentFreqRatio: number;
  energy: number;
}

export function ElectricalPanel({
  power,
  apparentPower,
  loadIndex,
  currentFreqRatio,
  energy,
}: ElectricalPanelProps) {
  const powerStatus = getStatusColor(power, 'power');
  const apparentStatus = getStatusColor(apparentPower, 'apparentPower');
  const loadStatus = getStatusColor(loadIndex, 'loadIndex');

  // Calculate load percentage for progress bar (loadIndex is 0-1)
  const loadPercentage = Math.min(Math.max(loadIndex * 100, 0), 100);

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Power Analysis
      </h3>

      {/* Power Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Active Power */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Power</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${powerStatus.bgColor} text-white`}>
              {powerStatus.label}
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold ${powerStatus.color}`}>
              {formatNumber(power, 1)}
            </span>
            <span className="text-sm text-gray-500">W</span>
          </div>
        </div>

        {/* Apparent Power */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Apparent Power</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${apparentStatus.bgColor} text-white`}>
              {apparentStatus.label}
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold ${apparentStatus.color}`}>
              {formatNumber(apparentPower, 1)}
            </span>
            <span className="text-sm text-gray-500">VA</span>
          </div>
        </div>
      </div>

      {/* Load Index with Progress Bar */}
      <div className="mb-4 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Motor Load Index</span>
          <div className="flex items-center gap-2">
            <span className={`text-xl font-bold ${loadStatus.color}`}>
              {formatNumber(loadIndex * 100, 1)}%
            </span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden relative">
          <div 
            className={`h-full ${loadStatus.bgColor} transition-all duration-500 rounded-full`}
            style={{ width: `${loadPercentage}%` }}
          ></div>
          {/* Threshold markers */}
          <div className="absolute top-0 bottom-0 left-[80%] w-0.5 bg-status-warning opacity-50"></div>
          <div className="absolute top-0 bottom-0 left-[95%] w-0.5 bg-status-critical opacity-50"></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span className="text-status-warning font-medium">80%</span>
          <span className="text-status-critical font-medium">95%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 gap-4">
        {/* Current/Freq Ratio */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
            I/f Ratio
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-gray-800">
              {formatNumber(currentFreqRatio, 4)}
            </span>
            <span className="text-sm text-gray-500">A/Hz</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Current per Frequency</p>
        </div>

        {/* Daily Energy */}
        <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
            Energy Today
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-green-600">
              {formatNumber(energy, 3)}
            </span>
            <span className="text-sm text-gray-500">kWh</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Accumulated</p>
        </div>
      </div>
    </div>
  );
}
