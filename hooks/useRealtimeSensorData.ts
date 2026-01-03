"use client";

import { getDatabase, ref, onValue, off } from "firebase/database";
import { app } from "@/lib/firebaseClient";
import { calculateHealthScore } from "@/lib/calculateHealthScore";
import { useState, useEffect, useRef } from "react";

/* =======================
   INTERFACE
   ======================= */
interface Motor {
  name: string;
  location: string;
  ratedPower: number;
}

interface SensorReading {
  timestamp: number;

  // Electrical
  gridVoltage?: number;
  motorCurrent?: number;
  power?: number;
  powerFactor?: number;
  gridFrequency?: number;
  dailyEnergyKwh?: number;
  apparentPower?: number; // VA
  loadIndex?: number;
  currentFreqRatio?: number;

  // Mechanical
  vibrationRms?: number;
  vibrationPeakG?: number; // Peak acceleration in g
  crestFactor?: number;
  faultFrequency?: number; // Dominant fault frequency (Hz)
  rotorUnbalanceScore?: number;
  bearingHealthScore?: number;

  // Thermal
  motorSurfaceTemp?: number;
  ambientTemp?: number;
  bearingTemp?: number;
  deltaTemp?: number;
  tempGradient?: number;
  bearingMotorTempDiff?: number;
  hotspot?: boolean;

  // Environmental
  dustDensity?: number;
  soilingLossPercent?: number;

  // Health
  healthIndex?: number;
}

interface Alert {
  id?: string;
  severity: string | "low" | "medium" | "high";
  message: string;
  status?: string | "OPEN" | "CLOSED" | "ACKNOWLEDGED";
  timestamp?: number;
  parameter?: string;
  value?: number;
}

interface Health {
  healthScoreMl: number;
  healthCategory: string;
}

interface RealtimeData {
  motor: Motor | null;
  latestReading: SensorReading | null;
  recentReadings: SensorReading[];
  activeAlerts: Alert[];
  latestHealth: Health | null;
  timestamp: string;
  operatingHoursToday: number; // Jam operasi hari ini (real-time)
  dailyEnergyKwh: number; // Energi harian (kWh) - dihitung real-time dari V × I × PF
}

/* =======================
   CUSTOM HOOK
   ======================= */
export function useRealtimeSensorData(motorId: string) {
  const [data, setData] = useState<RealtimeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastDataTimestamp, setLastDataTimestamp] = useState<number>(0);
  const firstTimestampTodayRef = useRef<number | null>(null); // Ref untuk menyimpan timestamp pertama hari ini
  const lastPowerDataRef = useRef<{ power: number; timestamp: number } | null>(null); // Ref untuk menyimpan data daya terakhir
  const dailyEnergyAccumulatorRef = useRef<number>(0); // Ref untuk akumulasi energi harian (kWh)
  const lastResetDateRef = useRef<string>(''); // Ref untuk menyimpan tanggal terakhir reset (untuk deteksi hari baru)
  const latestReadingRef = useRef<SensorReading | null>(null); // Ref untuk menyimpan latest reading (untuk interval)
  const recentReadingsBufferRef = useRef<SensorReading[]>([]); // Ref untuk menyimpan history readings (untuk sparkline, max 30)

  useEffect(() => {
    if (!motorId) {
      setError('Motor ID is required');
      setIsLoading(false);
      return;
    }

    let motorRef: ReturnType<typeof ref> | null = null;
    let realtimeRef: ReturnType<typeof ref> | null = null;
    let alertRef: ReturnType<typeof ref> | null = null;
    let healthRef: ReturnType<typeof ref> | null = null;
    let unsubMotor: (() => void) | null = null;
    let unsubRealtime: (() => void) | null = null;
    let unsubAlert: (() => void) | null = null;
    let unsubHealth: (() => void) | null = null;

    try {
      const db = getDatabase(app);

      motorRef = ref(db, `motors/${motorId}`);
      realtimeRef = ref(db, `sensor_data/latest`);
      alertRef = ref(db, `alerts/${motorId}`);
      healthRef = ref(db, `health/${motorId}`);

      let motorData: Motor | null = null;
      let latestReading: SensorReading | null = null;
      let alerts: Alert[] = [];
      let healthData: Health | null = null;

      /* ===== FUNGSI HITUNG JAM OPERASI HARI INI ===== */
      const calculateOperatingHoursToday = (): number => {
        if (!latestReading || !latestReading.timestamp) {
          return 0;
        }

        const now = Date.now();
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayStartTimestamp = todayStart.getTime();

        // Parse timestamp (bisa number atau perlu convert)
        const latestTimestamp = typeof latestReading.timestamp === 'number' 
          ? latestReading.timestamp 
          : new Date(latestReading.timestamp).getTime();

        // Jika timestamp pertama belum diset atau bukan hari ini, set ulang
        if (!firstTimestampTodayRef.current || firstTimestampTodayRef.current < todayStartTimestamp) {
          firstTimestampTodayRef.current = latestTimestamp >= todayStartTimestamp 
            ? latestTimestamp 
            : null;
        }

        // Jika belum ada data hari ini
        if (!firstTimestampTodayRef.current || firstTimestampTodayRef.current < todayStartTimestamp) {
          return 0;
        }

        // Tentukan end time: jika motor masih online (data baru dalam 20 detik), gunakan waktu sekarang
        // Jika offline, gunakan timestamp terakhir
        const timeSinceLastData = now - latestTimestamp;
        const isMotorRunning = timeSinceLastData < 20000; // 20 detik (sesuai dengan timeout ESP)
        
        const endTime = isMotorRunning ? now : latestTimestamp;
        
        // Hitung selisih waktu dalam jam
        const operatingTimeMs = endTime - firstTimestampTodayRef.current;
        const operatingHours = operatingTimeMs / (1000 * 60 * 60); // Convert ms to hours

        return Math.max(0, operatingHours);
      };

      /* ===== FUNGSI HITUNG ENERGI HARIAN (kWh) ===== */
      // Menghitung energi dari: Daya (Watt) = Voltage × Current × Power Factor
      // Energi (kWh) = Daya (Watt) × Waktu (jam) / 1000
      const calculateDailyEnergyKwh = (reading: SensorReading | null): number => {
        if (!reading || !reading.timestamp) {
          return dailyEnergyAccumulatorRef.current;
        }

        const now = Date.now();
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayStartTimestamp = todayStart.getTime();

        // Parse timestamp
        const currentTimestamp = typeof reading.timestamp === 'number' 
          ? reading.timestamp 
          : new Date(reading.timestamp).getTime();

        // Reset akumulator jika hari baru (check tanggal, bukan hanya timestamp)
        const todayDateStr = todayStart.toDateString();
        if (lastResetDateRef.current !== todayDateStr) {
          // Hari baru - reset semua
          dailyEnergyAccumulatorRef.current = 0;
          lastPowerDataRef.current = null;
          firstTimestampTodayRef.current = null;
          lastResetDateRef.current = todayDateStr;
          console.log('🔄 Reset energi harian di calculateDailyEnergyKwh - Hari baru:', todayDateStr);
        } else if (lastPowerDataRef.current && lastPowerDataRef.current.timestamp < todayStartTimestamp) {
          // Fallback: reset jika timestamp lama
          dailyEnergyAccumulatorRef.current = 0;
          lastPowerDataRef.current = null;
        }

        // Hitung daya dari Voltage × Current × Power Factor
        const voltage = reading.gridVoltage || 0;
        const current = reading.motorCurrent || 0;
        const powerFactor = reading.powerFactor || 1;
        const powerWatt = voltage * current * powerFactor; // Daya dalam Watt

        // Jika ada data daya sebelumnya, hitung energi untuk interval tersebut
        if (lastPowerDataRef.current) {
          const timeDiffMs = currentTimestamp - lastPowerDataRef.current.timestamp;
          const timeDiffHours = timeDiffMs / (1000 * 60 * 60); // Convert ms to hours
          
          // Gunakan rata-rata daya untuk interval (trapezoidal rule)
          const avgPower = (lastPowerDataRef.current.power + powerWatt) / 2;
          
          // Energi = Daya rata-rata × Waktu (jam) / 1000 (untuk kWh)
          const energyIncrement = (avgPower * timeDiffHours) / 1000;
          
          // Hanya tambahkan jika waktu positif (data valid)
          if (timeDiffHours > 0 && timeDiffHours < 24) { // Validasi: tidak lebih dari 24 jam
            dailyEnergyAccumulatorRef.current += energyIncrement;
          }
        }

        // Update data daya terakhir
        lastPowerDataRef.current = {
          power: powerWatt,
          timestamp: currentTimestamp,
        };

        // Jika motor masih running (data baru dalam 20 detik), tambahkan energi sampai sekarang
        const timeSinceLastData = now - currentTimestamp;
        const isMotorRunning = timeSinceLastData < 20000; // 20 detik
        
        if (isMotorRunning) {
          const timeDiffMs = now - currentTimestamp;
          const timeDiffHours = timeDiffMs / (1000 * 60 * 60);
          const energyIncrement = (powerWatt * timeDiffHours) / 1000;
          
          // Tambahkan energi untuk periode sejak data terakhir sampai sekarang
          return dailyEnergyAccumulatorRef.current + energyIncrement;
        }

        return dailyEnergyAccumulatorRef.current;
      };

      /* ===== GABUNG SEMUA DATA ===== */
      const updateState = () => {
        const operatingHours = calculateOperatingHoursToday();
        const dailyEnergy = calculateDailyEnergyKwh(latestReading);
        
        setData({
          motor: motorData,
          latestReading,
          recentReadings: recentReadingsBufferRef.current, // Gunakan buffer untuk history sparkline
          activeAlerts: alerts,
          latestHealth: healthData,
          timestamp: new Date().toISOString(),
          operatingHoursToday: operatingHours,
          dailyEnergyKwh: dailyEnergy,
        });

        setIsConnected(true);
        setIsLoading(false);
        setError(null);
      };

      /* ===== MOTOR INFO ===== */
      unsubMotor = onValue(motorRef, (snap) => {
        motorData = snap.val();
        updateState();
      }, (error) => {
        console.error('Error reading motor data:', error);
        setError('Failed to read motor data');
      });

      /* ===== REALTIME SENSOR (MAPPING SESUAI RTDB) ===== */
      unsubRealtime = onValue(realtimeRef, (snap) => {
        const raw = snap.val();

        if (!raw) {
          latestReading = null;
          setIsConnected(false); // ESP offline jika tidak ada data
          setLastDataTimestamp(0);
          // Reset first timestamp jika tidak ada data
          firstTimestampTodayRef.current = null;
          // Jangan reset energi, biarkan tetap (motor mungkin hanya offline sementara)
          updateState();
          return;
        }

        // ESP Online jika ada data baru (dalam 20 detik terakhir - lebih stabil)
        const dataTimestamp = raw.timestamp || Date.now();
        const currentTime = Date.now();
        const timeDiff = currentTime - dataTimestamp;
        const isRecentData = timeDiff < 20000; // 20 detik (lebih stabil, mengurangi on/off flickering)
        
        setIsConnected(isRecentData);
        setLastDataTimestamp(dataTimestamp);
        
        // Log untuk debugging
        if (!isRecentData) {
          console.log('⚠️ ESP Offline - Data terlalu lama:', Math.round(timeDiff / 1000), 'detik');
        }

        // Pastikan timestamp valid (dari Firebase atau fallback ke waktu sekarang)
        const firebaseTimestamp = raw.timestamp || Date.now();
        
        // Log timestamp untuk debugging (hanya sekali setiap 10 detik untuk menghindari spam)
        if (Math.random() < 0.1) { // 10% chance untuk log
          console.log('📅 Firebase timestamp:', firebaseTimestamp, 'Type:', typeof firebaseTimestamp);
        }

        latestReading = {
          timestamp: firebaseTimestamp,

          // Electrical
          gridVoltage: raw.voltage,
          motorCurrent: raw.current,
          power: raw.power,
          powerFactor: raw.pf,
          gridFrequency: raw.frequency,
          dailyEnergyKwh: raw.energy,
          apparentPower: raw.apparent_power,
          loadIndex: raw.load_index,
          currentFreqRatio: raw.current_freq_ratio,

          // Mechanical
          vibrationRms: raw.vibration_rms_mm_s,
          vibrationPeakG: raw.vibration_peak_g,
          crestFactor: raw.crest_factor,
          faultFrequency: raw.fault_frequency || raw.faultFrequency, // Support both naming
          rotorUnbalanceScore: raw.unbalance,
          bearingHealthScore: raw.bearing_health,

          // Thermal
          motorSurfaceTemp: raw.motor_temp,
          ambientTemp: raw.ambient_temp,
          bearingTemp: raw.bearing_temp,
          deltaTemp: raw.delta_temp,
          tempGradient: raw.temp_gradient,
          bearingMotorTempDiff: raw.bearing_motor_diff,
          hotspot: raw.hotspot === true || raw.hotspot === 'true',

          // Environmental
          dustDensity: raw.dust,
          soilingLossPercent: raw.soiling_loss,

          // Health (calculated from sensor data using formula)
          healthIndex: undefined, // Will be calculated below
        };

        // Calculate health score from sensor readings (formula-based)
        if (latestReading) {
          const healthResult = calculateHealthScore({
            gridVoltage: latestReading.gridVoltage,
            motorCurrent: latestReading.motorCurrent,
            power: latestReading.power,
            powerFactor: latestReading.powerFactor,
            gridFrequency: latestReading.gridFrequency,
            vibrationRms: latestReading.vibrationRms,
            motorSurfaceTemp: latestReading.motorSurfaceTemp,
            bearingTemp: latestReading.bearingTemp,
            dustDensity: latestReading.dustDensity,
          });
          latestReading.healthIndex = healthResult.score;
        }

        // Update ref untuk digunakan di interval
        latestReadingRef.current = latestReading;

        // Update recent readings buffer untuk sparkline (max 30 readings)
        if (latestReading) {
          recentReadingsBufferRef.current.push(latestReading);
          // Keep only last 30 readings
          if (recentReadingsBufferRef.current.length > 30) {
            recentReadingsBufferRef.current.shift();
          }
        }

        updateState();
      }, (error) => {
        console.error('Error reading sensor data:', error);
        setError('Failed to read sensor data');
        setIsConnected(false); // ESP offline jika error
      });

      /* ===== ALERT ===== */
      unsubAlert = onValue(alertRef, (snap) => {
        const alertVal = snap.val();
        if (alertVal) {
          // Convert to array format dengan id (required)
          if (Array.isArray(alertVal)) {
            alerts = alertVal.map((alert, idx) => ({
              id: alert.id || `alert-${Date.now()}-${idx}`, // Ensure id is always string
              severity: (alert.severity || 'medium') as "low" | "medium" | "high",
              message: alert.message || '',
              status: (alert.status || 'OPEN') as "OPEN" | "CLOSED" | "ACKNOWLEDGED",
              timestamp: alert.timestamp || Date.now(),
              parameter: alert.parameter,
              value: alert.value,
            }));
          } else if (typeof alertVal === 'object') {
            // Single alert object
            alerts = [{
              id: alertVal.id || `alert-${Date.now()}-0`, // Ensure id is always string
              severity: (alertVal.severity || 'medium') as "low" | "medium" | "high",
              message: alertVal.message || '',
              status: (alertVal.status || 'OPEN') as "OPEN" | "CLOSED" | "ACKNOWLEDGED",
              timestamp: alertVal.timestamp || Date.now(),
              parameter: alertVal.parameter,
              value: alertVal.value,
            }];
          }
        } else {
          alerts = [];
        }
        updateState();
      }, (error) => {
        console.error('Error reading alerts:', error);
      });

      /* ===== HEALTH ===== */
      unsubHealth = onValue(healthRef, (snap) => {
        const h = snap.val();
        healthData = h
          ? {
              healthScoreMl: h.healthScore,
              healthCategory: h.category,
            }
          : null;
        updateState();
      }, (error) => {
        console.error('Error reading health data:', error);
      });
    } catch (err) {
      console.error('Error initializing Firebase:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to Firebase');
      setIsLoading(false);
      setIsConnected(false);
    }

    /* ===== CLEANUP (ANTI MEMORY LEAK) ===== */
    return () => {
      if (motorRef) off(motorRef);
      if (realtimeRef) off(realtimeRef);
      if (alertRef) off(alertRef);
      if (healthRef) off(healthRef);

      if (unsubMotor) unsubMotor();
      if (unsubRealtime) unsubRealtime();
      if (unsubAlert) unsubAlert();
      if (unsubHealth) unsubHealth();
    };
  }, [motorId]);

  // Check ESP status dan update operating hours + energi harian secara berkala
  useEffect(() => {
    if (lastDataTimestamp === 0) {
      setIsConnected(false);
      return;
    }

    // Initialize last reset date
    if (!lastResetDateRef.current) {
      lastResetDateRef.current = new Date().toDateString();
    }

    const checkInterval = setInterval(() => {
      const now = Date.now();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayStartTimestamp = todayStart.getTime();
      const todayDateStr = todayStart.toDateString();

      // Check dan reset jika hari baru
      if (lastResetDateRef.current !== todayDateStr) {
        console.log('🔄 Hari baru terdeteksi - Reset energi harian dan jam operasi');
        dailyEnergyAccumulatorRef.current = 0;
        lastPowerDataRef.current = null;
        firstTimestampTodayRef.current = null;
        lastResetDateRef.current = todayDateStr;
      }

      // Check ESP status
      const timeDiff = now - lastDataTimestamp;
      const isRecent = timeDiff < 20000; // 20 detik
      
      if (!isRecent && isConnected) {
        console.log('⚠️ ESP status changed to Offline - No recent data');
        setIsConnected(false);
      } else if (isRecent && !isConnected) {
        console.log('✅ ESP status changed to Online - Data received');
        setIsConnected(true);
      }
      
      // Update operating hours dan energi harian setiap detik untuk real-time display
      // Gunakan ref untuk mendapatkan data terbaru tanpa dependency
      const currentReading = latestReadingRef.current;
      
      if (currentReading && currentReading.timestamp) {
        const latestTimestamp = typeof currentReading.timestamp === 'number' 
          ? currentReading.timestamp 
          : new Date(currentReading.timestamp).getTime();
        
        // Update first timestamp jika perlu
        if (!firstTimestampTodayRef.current || firstTimestampTodayRef.current < todayStartTimestamp) {
          firstTimestampTodayRef.current = latestTimestamp >= todayStartTimestamp 
            ? latestTimestamp 
            : null;
        }
        
        // Hitung operating hours
        let operatingHours = 0;
        if (firstTimestampTodayRef.current && firstTimestampTodayRef.current >= todayStartTimestamp) {
          const timeSinceLastData = now - latestTimestamp;
          const isMotorRunning = timeSinceLastData < 20000;
          const endTime = isMotorRunning ? now : latestTimestamp;
          const operatingTimeMs = endTime - firstTimestampTodayRef.current;
          operatingHours = operatingTimeMs / (1000 * 60 * 60);
        }
        
        // Hitung energi harian
        const voltage = currentReading.gridVoltage || 0;
        const current = currentReading.motorCurrent || 0;
        const powerFactor = currentReading.powerFactor || 1;
        const powerWatt = voltage * current * powerFactor;
        
        const timeSinceLastData = now - latestTimestamp;
        const isMotorRunning = timeSinceLastData < 20000;
        
        // Hitung energi untuk periode sejak data terakhir sampai sekarang (jika motor running)
        let currentEnergy = dailyEnergyAccumulatorRef.current;
        if (isMotorRunning && lastPowerDataRef.current) {
          const timeDiffMs = now - latestTimestamp;
          const timeDiffHours = timeDiffMs / (1000 * 60 * 60);
          const energyIncrement = (powerWatt * timeDiffHours) / 1000;
          currentEnergy = dailyEnergyAccumulatorRef.current + energyIncrement;
        }
        
        // Update state dengan nilai terbaru
        setData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            operatingHoursToday: Math.max(0, operatingHours),
            dailyEnergyKwh: Math.max(0, currentEnergy),
          };
        });
      }
    }, 1000); // Update setiap 1 detik untuk real-time

    return () => clearInterval(checkInterval);
  }, [lastDataTimestamp, isConnected]); // Hapus 'data' dari dependency untuk menghindari restart interval

  return {
    data,
    isLoading,
    error,
    isConnected,
    refresh: async () => {},
  };
}