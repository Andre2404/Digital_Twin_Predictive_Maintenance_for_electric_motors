'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getDatabase, ref, onValue } from 'firebase/database';
import { app } from '@/lib/firebaseClient';

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
  const [dateRange, setDateRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');
  
  const getMaxReadings = () => {
    switch (dateRange) {
      case '1h': return 60;
      case '6h': return 180;
      case '24h': return 288;
      case '7d': return 500;
      default: return 100;
    }
  };
  
  useEffect(() => {
    const db = getDatabase(app);
    const sensorRef = ref(db, 'sensor_data/latest');
    
    const unsubscribe = onValue(sensorRef, (snapshot) => {
      const rawData = snapshot.val();
      if (rawData) {
        setIsLoading(false);
        
        const newReading: SensorReading = {
          timestamp: new Date(rawData.timestamp || Date.now()).toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          gridVoltage: rawData.voltage || 0,
          motorCurrent: rawData.current || 0,
          powerConsumption: rawData.power || 0,
          motorSurfaceTemp: rawData.motor_temp || 0,
          bearingTemp: rawData.bearing_temp || 0,
          vibrationRms: rawData.vibration_rms_mm_s || 0,
          dailyEnergyKwh: rawData.energy_kwh || 0,
        };
        
        setData(prev => {
          const maxReadings = getMaxReadings();
          const updated = [...prev, newReading];
          return updated.slice(-maxReadings);
        });
      }
    });
    
    return () => unsubscribe();
  }, [dateRange]);
  
  useEffect(() => {
    setData([]);
  }, [dateRange]);
  
  const formatTimeLabel = () => {
    switch (dateRange) {
      case '1h': return 'Last 1 Hour';
      case '6h': return 'Last 6 Hours';
      case '24h': return 'Last 24 Hours';
      case '7d': return 'Last 7 Days';
      default: return '';
    }
  };
  
  if (isLoading && data.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to sensor data...</p>
          <p className="text-sm text-gray-400 mt-2">Waiting for data from Firebase</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-lightgray">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Analytics & Historical Data</h1>
            <p className="text-gray-600 mt-1">
              {formatTimeLabel()} - {data.length} readings (Real-time)
            </p>
          </div>
          
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
        
        {data.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-600 text-lg">Waiting for sensor data...</p>
            <p className="text-gray-400 text-sm mt-2">Data will appear here once the sensor starts sending readings</p>
          </div>
        ) : (
          <>
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
                    <Line yAxisId="left" type="monotone" dataKey="gridVoltage" stroke="#1B3C53" name="Voltage (V)" strokeWidth={2} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="motorCurrent" stroke="#ef4444" name="Current (A)" strokeWidth={2} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="powerConsumption" stroke="#f59e0b" name="Power (W)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="card mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Temperature Trends</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="motorSurfaceTemp" stroke="#ef4444" name="Motor Temp (°C)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="bearingTemp" stroke="#f59e0b" name="Bearing Temp (°C)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="card mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Vibration RMS Over Time</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="vibrationRms" stroke="#8b5cf6" name="Vibration RMS (mm/s)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="card mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Energy Consumption</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="dailyEnergyKwh" stroke="#10b981" name="Energy (kWh)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
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
                <p className="text-sm text-gray-600 mb-1">Current Energy</p>
                <p className="text-2xl font-bold text-status-normal">
                  {(data[data.length - 1]?.dailyEnergyKwh || 0).toFixed(2)} kWh
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
