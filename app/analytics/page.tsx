'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatDate } from '@/lib/utils';

const DEFAULT_MOTOR_ID = 'default-motor-1';

interface SensorReading {
  timestamp: string;
  gridVoltage: number;
  motorCurrent: number;
  powerConsumption: number;
  motorSurfaceTemp: number;
  bearingTemp: number;
  vibrationRms: number;
  dailyEnergyKwh: number;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<SensorReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'1h' | '6h' | '24h' | '7d'>('6h');
  
  useEffect(() => {
    fetchHistoricalData();
  }, [dateRange]);
  
  const fetchHistoricalData = async () => {
    try {
      setIsLoading(true);
      // In production: implement proper date range filtering in API
      const response = await fetch(`/api/latest?motorId=${DEFAULT_MOTOR_ID}`);
      const result = await response.json();
      
      // For now, use recentReadings as historical data
      // In production: create separate /api/history endpoint with date filtering
      if (result.recentReadings) {
        const formattedData = result.recentReadings.map((reading: any) => ({
          timestamp: new Date(reading.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          gridVoltage: reading.gridVoltage,
          motorCurrent: reading.motorCurrent,
          powerConsumption: reading.powerConsumption,
          motorSurfaceTemp: reading.motorSurfaceTemp,
          bearingTemp: reading.bearingTemp,
          vibrationRms: reading.vibrationRms,
          dailyEnergyKwh: reading.dailyEnergyKwh,
        }));
        setData(formattedData);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching historical data:', error);
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-lightgray">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Analytics & Historical Data</h1>
            <p className="text-gray-600 mt-1">Analisis tren dan riwayat sensor motor</p>
          </div>
          
          {/* Date Range Filter */}
          <div className="flex gap-2">
            {(['1h', '6h', '24h', '7d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        
        {/* Electrical Parameters Chart */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Voltage, Current & Power</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="gridVoltage" stroke="#1B3C53" name="Voltage (V)" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="motorCurrent" stroke="#ef4444" name="Current (A)" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="powerConsumption" stroke="#f59e0b" name="Power (W)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Temperature Trends */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Temperature Trends</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="motorSurfaceTemp" stroke="#ef4444" name="Motor Temp (°C)" strokeWidth={2} />
                <Line type="monotone" dataKey="bearingTemp" stroke="#f59e0b" name="Bearing Temp (°C)" strokeWidth={2} />
                {/* Temperature limits */}
                <Line type="monotone" dataKey={() => 70} stroke="#10b981" strokeDasharray="5 5" name="Warning Limit (70°C)" />
                <Line type="monotone" dataKey={() => 85} stroke="#ef4444" strokeDasharray="5 5" name="Critical Limit (85°C)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Vibration Analysis */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Vibration RMS Over Time</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="vibrationRms" stroke="#8b5cf6" name="Vibration RMS (mm/s)" strokeWidth={2} />
                <Line type="monotone" dataKey={() => 2.8} stroke="#f59e0b" strokeDasharray="5 5" name="Warning (2.8)" />
                <Line type="monotone" dataKey={() => 4.5} stroke="#ef4444" strokeDasharray="5 5" name="Critical (4.5)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Energy Consumption */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Energy Consumption</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="dailyEnergyKwh" fill="#10b981" name="Energy (kWh)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Statistics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card text-center">
            <p className="text-sm text-gray-600 mb-1">Avg Voltage</p>
            <p className="text-2xl font-bold text-primary">
              {data.length > 0 
                ? (data.reduce((sum, d) => sum + d.gridVoltage, 0) / data.length).toFixed(1)
                : '0.0'} V
            </p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-600 mb-1">Avg Current</p>
            <p className="text-2xl font-bold text-primary">
              {data.length > 0
                ? (data.reduce((sum, d) => sum + d.motorCurrent, 0) / data.length).toFixed(2)
                : '0.00'} A
            </p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-600 mb-1">Max Temp</p>
            <p className="text-2xl font-bold text-status-warning">
              {data.length > 0
                ? Math.max(...data.map(d => d.motorSurfaceTemp)).toFixed(1)
                : '0.0'} °C
            </p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-600 mb-1">Total Energy</p>
            <p className="text-2xl font-bold text-status-normal">
              {(data[data.length - 1]?.dailyEnergyKwh || 0).toFixed(2)} kWh
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}