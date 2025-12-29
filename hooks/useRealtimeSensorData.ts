"use client";

import { getDatabase, ref, onValue, off } from "firebase/database";
import { app } from "@/lib/firebaseClient";
import { useState, useEffect } from "react";

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

  // Mechanical
  vibrationRms?: number;
  faultFrequency?: number;
  rotorUnbalanceScore?: number;
  bearingHealthScore?: number;

  // Thermal
  motorSurfaceTemp?: number;
  bearingTemp?: number;

  // Environmental
  dustDensity?: number;
  soilingLossPercent?: number;
}

interface Alert {
  severity: string;
  message: string;
  status: string;
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
}

/* =======================
   CUSTOM HOOK
   ======================= */
export function useRealtimeSensorData(motorId: string) {
  const [data, setData] = useState<RealtimeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!motorId) return;

    const db = getDatabase(app);

    const motorRef = ref(db, `motors/${motorId}`);
    const realtimeRef = ref(db, `realtime/${motorId}`);
    const alertRef = ref(db, `alerts/${motorId}`);
    const healthRef = ref(db, `health/${motorId}`);

    let motorData: Motor | null = null;
    let latestReading: SensorReading | null = null;
    let alerts: Alert[] = [];
    let healthData: Health | null = null;

    /* ===== MOTOR INFO ===== */
    const unsubMotor = onValue(motorRef, (snap) => {
      motorData = snap.val();
      updateState();
    });

    /* ===== REALTIME SENSOR ===== */
    const unsubRealtime = onValue(realtimeRef, (snap) => {
      latestReading = snap.val();
      updateState();
    });

    /* ===== ALERT ===== */
    const unsubAlert = onValue(alertRef, (snap) => {
      const alertVal = snap.val();
      alerts = alertVal ? [alertVal] : [];
      updateState();
    });

    /* ===== HEALTH ===== */
    const unsubHealth = onValue(healthRef, (snap) => {
      const h = snap.val();
      healthData = h
        ? {
            healthScoreMl: h.healthScore,
            healthCategory: h.category,
          }
        : null;
      updateState();
    });

    /* ===== GABUNG DATA ===== */
    function updateState() {
      setData({
        motor: motorData,
        latestReading,
        recentReadings: latestReading ? [latestReading] : [],
        activeAlerts: alerts,
        latestHealth: healthData,
        timestamp: new Date().toISOString(),
      });

      setIsConnected(true);
      setIsLoading(false);
    }

    /* ===== CLEANUP (INI PENTING) ===== */
    return () => {
      off(motorRef);
      off(realtimeRef);
      off(alertRef);
      off(healthRef);

      unsubMotor();
      unsubRealtime();
      unsubAlert();
      unsubHealth();
    };
  }, [motorId]);

  return {
    data,
    isLoading,
    error,
    isConnected,
    refresh: async () => {},
  };
}
