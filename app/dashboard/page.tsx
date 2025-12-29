'use client';

import dynamic from 'next/dynamic';
import { useRealtimeSensorData } from '@/hooks/useRealtimeSensorData';
import { RealtimeStatusBar } from '@/components/RealtimeStatusBar';
import { MotorOverviewCard } from '@/components/MotorOverviewCard';
// import { Motor3DVisualization } from '@/components/Motor3DVisualization';
import { SensorStatusCard } from '@/components/SensorStatusCard';
import { TemperaturePanel } from '@/components/TemperaturePanel';
import { VibrationPanel } from '@/components/VibrationPanel';
import { DustPanel } from '@/components/DustPanel';
import { AlertList } from '@/components/AlertList';
import { type ParameterType } from '@/lib/thresholds';

// Dynamic import untuk komponen 3D (hanya di client, no SSR)
const Motor3DModel = dynamic(() => import('@/components/Motor3DModel').then(mod => ({ default: mod.Motor3DModel })), {
  ssr: false,
  loading: () => (
    <div className="card p-6">
      <div className="w-full h-[500px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading 3D Model...</p>
        </div>
      </div>
    </div>
  ),
});


// TODO: In production, allow user to select motor
const DEFAULT_MOTOR_ID = 'motor_1';

export default function DashboardPage() {
  const { data, isLoading, error, isConnected } = useRealtimeSensorData(DEFAULT_MOTOR_ID);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sensor data...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-2">Error loading data</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }
  
  if (!data || !data.latestReading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No sensor data available. Please ingest data first.</p>
        </div>
      </div>
    );
  }
  
  const { motor, latestReading, recentReadings, activeAlerts, latestHealth } = data;
  
  // Extract history for sparklines (ambil dari recentReadings, urutkan berdasarkan timestamp)
  const getHistory = (param: keyof typeof latestReading) => {
    const sortedReadings = [...recentReadings].sort((a, b) => {
      const tsA = typeof a.timestamp === 'number' ? a.timestamp : new Date(a.timestamp).getTime();
      const tsB = typeof b.timestamp === 'number' ? b.timestamp : new Date(b.timestamp).getTime();
      return tsA - tsB; // Oldest to newest
    });
    return sortedReadings.map(r => r[param] as number).filter(v => typeof v === 'number' && !isNaN(v));
  };
  
  // Determine motor status based on health score
  const getMotorStatus = (healthScore: number | undefined): 'Normal' | 'Perlu Inspeksi' | 'Kritikal' => {
    if (!healthScore) return 'Normal';
    if (healthScore >= 80) return 'Normal';
    if (healthScore >= 60) return 'Perlu Inspeksi';
    return 'Kritikal';
  };
  
  return (
    <div className="min-h-screen">
      {/* Status Bar */}
      <RealtimeStatusBar
        lastUpdate={
          data?.latestReading?.timestamp
            ? data.latestReading.timestamp // Pass timestamp langsung (bisa number atau Date)
            : null
        }
        isConnected={isConnected}
        motorName={data?.motor?.name ?? "Unknown Motor"}
      />

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Motor Overview */}
        <div className="mb-6">
          <MotorOverviewCard
            motorName={data?.motor?.name ?? "Unknown Motor"}
            healthScore={data?.latestHealth?.healthScoreMl ?? 0}
            status={getMotorStatus(data?.latestHealth?.healthScoreMl)}
            operatingHoursToday={data?.operatingHoursToday ?? 0} // Real-time dari Firebase
            dailyEnergy={data?.dailyEnergyKwh ?? 0} // Real-time dihitung dari V × I × PF
          />
        </div>

        {/* Motor 3D Model Visualization with Sensor Diagnostics */}
        <div className="mb-6">
          <Motor3DModel
            gridVoltage={data?.latestReading?.gridVoltage ?? 220}
            motorCurrent={data?.latestReading?.motorCurrent ?? 0}
            motorSurfaceTemp={data?.latestReading?.motorSurfaceTemp ?? 25}
            bearingTemp={data?.latestReading?.bearingTemp ?? 25}
            vibrationRms={data?.latestReading?.vibrationRms ?? 0}
            power={data?.latestReading?.power ?? 0}
            powerFactor={data?.latestReading?.powerFactor ?? 1}
            gridFrequency={data?.latestReading?.gridFrequency ?? 50}
            dustDensity={data?.latestReading?.dustDensity ?? 0}
            healthScore={data?.latestHealth?.healthScoreMl ?? 100}
          />
        </div>

        {/* Motor 2D SVG Visualization (Fallback) */}
        {/* <div className="mb-6">
          <Motor3DVisualization
            gridFrequency={data?.latestReading?.gridFrequency ?? 50}
            motorCurrent={data?.latestReading?.motorCurrent ?? 0}
            motorSurfaceTemp={data?.latestReading?.motorSurfaceTemp ?? 25}
            vibrationRms={data?.latestReading?.vibrationRms ?? 0}
            power={data?.latestReading?.power ?? 0}
            healthScore={data?.latestHealth?.healthScoreMl ?? 100}
          />
        </div> */}

        {/* Sensor Status Cards */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Electrical Parameters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SensorStatusCard
              parameter={"gridVoltage" as ParameterType}
              value={data?.latestReading?.gridVoltage ?? 0}
              history={getHistory("gridVoltage")}
            />

            <SensorStatusCard
              parameter={"motorCurrent" as ParameterType}
              value={data?.latestReading?.motorCurrent ?? 0}
              history={getHistory("motorCurrent")}
            />

            <SensorStatusCard
              parameter={"vibrationRms" as ParameterType}
              value={data?.latestReading?.vibrationRms ?? 0}
              history={getHistory("vibrationRms")}
            />

            <SensorStatusCard
              parameter={"motorSurfaceTemp" as ParameterType}
              value={data?.latestReading?.motorSurfaceTemp ?? 0}
              history={getHistory("motorSurfaceTemp")}
            />
          </div>
          
          {/* Additional Sensor Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {data?.latestReading?.powerFactor !== undefined && (
              <SensorStatusCard
                parameter={"powerFactor" as ParameterType}
                value={data.latestReading.powerFactor}
                history={getHistory("powerFactor")}
              />
            )}
            
            {data?.latestReading?.gridFrequency !== undefined && (
              <SensorStatusCard
                parameter={"gridFrequency" as ParameterType}
                value={data.latestReading.gridFrequency}
                history={getHistory("gridFrequency")}
              />
            )}
            
            {data?.latestReading?.bearingTemp !== undefined && (
              <SensorStatusCard
                parameter={"bearingTemp" as ParameterType}
                value={data.latestReading.bearingTemp}
                history={getHistory("bearingTemp")}
              />
            )}
            
            {data?.latestReading?.dustDensity !== undefined && (
              <SensorStatusCard
                parameter={"dustDensity" as ParameterType}
                value={data.latestReading.dustDensity}
                history={getHistory("dustDensity")}
              />
            )}
          </div>
        </div>

        {/* Temperature & Vibration & Dust */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Physical Sensors
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <TemperaturePanel
              motorSurfaceTemp={data?.latestReading?.motorSurfaceTemp ?? 0}
              bearingTemp={data?.latestReading?.bearingTemp ?? 0}
            />

            <VibrationPanel
              vibrationRms={data?.latestReading?.vibrationRms ?? 0}
              faultFrequency={data?.latestReading?.faultFrequency}
              rotorUnbalanceScore={
                data?.latestReading?.rotorUnbalanceScore ?? 0
              }
              bearingHealthScore={data?.latestReading?.bearingHealthScore ?? 0}
            />

            <DustPanel
              dustDensity={data?.latestReading?.dustDensity ?? 0}
              soilingLossPercent={data?.latestReading?.soilingLossPercent ?? 0}
            />
          </div>
        </div>

        {/* Alerts */}
        <div className="mb-6">
          <AlertList alerts={activeAlerts.map(alert => ({
            id: alert.id || `alert-${Date.now()}`,
            severity: (alert.severity === 'low' || alert.severity === 'medium' || alert.severity === 'high') 
              ? alert.severity 
              : 'medium' as "low" | "medium" | "high",
            message: alert.message,
            status: (alert.status === 'OPEN' || alert.status === 'CLOSED' || alert.status === 'ACKNOWLEDGED')
              ? alert.status
              : 'OPEN' as "OPEN" | "CLOSED" | "ACKNOWLEDGED",
            timestamp: alert.timestamp,
            parameter: alert.parameter,
            value: alert.value,
          }))} />
        </div>
      </div>
    </div>
  );
}

