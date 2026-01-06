/**
 * useAlertMqtt Hook
 * 
 * Monitors sensor data and automatically sends MQTT signals to PLC
 * when critical conditions are detected.
 * 
 * STABILITY FIXES:
 * - Uses useMemo for config to prevent useEffect re-runs
 * - Uses stable refs for connection management
 * - Prevents re-initialization in React Strict Mode
 */

"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import {
    connectMqtt,
    sendAlertToPLC,
    sendOffSignalToPLC,
    isMqttConnected,
    disconnectMqtt
} from "@/lib/mqtt";
import { getStatusColor, type ParameterType } from "@/lib/thresholds";

interface SensorReading {
    gridVoltage?: number;
    motorCurrent?: number;
    powerFactor?: number;
    gridFrequency?: number;
    motorSurfaceTemp?: number;
    bearingTemp?: number;
    vibrationRms?: number;
    dustDensity?: number;
    healthIndex?: number;
}

interface AlertMqttConfig {
    /** Enable/disable auto-alert functionality */
    enabled?: boolean;
    /** Minimum time between alerts (ms) to prevent spam */
    alertCooldown?: number;
    /** Health score threshold for critical alert */
    criticalHealthThreshold?: number;
}

const DEFAULT_CONFIG: AlertMqttConfig = {
    enabled: true,
    alertCooldown: 30000,
    criticalHealthThreshold: 60,
};

/**
 * Hook that monitors sensor readings and sends MQTT alerts to PLC
 * when critical conditions are detected.
 */
export function useAlertMqtt(
    sensorData: SensorReading | null,
    config: AlertMqttConfig = {}
) {
    // Memoize config to prevent unnecessary re-renders
    const enabled = config.enabled ?? DEFAULT_CONFIG.enabled;
    const alertCooldown = config.alertCooldown ?? DEFAULT_CONFIG.alertCooldown;
    const criticalHealthThreshold = config.criticalHealthThreshold ?? DEFAULT_CONFIG.criticalHealthThreshold;

    const [mqttConnected, setMqttConnected] = useState(false);
    const [lastAlertInfo, setLastAlertInfo] = useState<{
        time: number;
        parameter?: string;
        value?: number;
    } | null>(null);

    // Stable refs
    const lastAlertTimeRef = useRef<number>(0);
    const wasInCriticalRef = useRef<boolean>(false);
    const isInitializedRef = useRef<boolean>(false);
    const isMountedRef = useRef<boolean>(false);

    // Initialize MQTT connection on mount - ONLY ONCE
    useEffect(() => {
        // Track mount state
        isMountedRef.current = true;

        if (!enabled) {
            console.log("[AlertMqtt] Hook disabled by config");
            return;
        }

        // Prevent double initialization in React Strict Mode
        if (isInitializedRef.current) {
            console.log("[AlertMqtt] Already initialized, reusing connection...");
            // Just update the callback if needed
            if (isMqttConnected()) {
                setMqttConnected(true);
            }
            return;
        }

        isInitializedRef.current = true;
        console.log("[AlertMqtt] 🔌 Initializing MQTT connection to HiveMQ Cloud...");

        const client = connectMqtt(
            (connected) => {
                // Only update state if component is still mounted
                if (isMountedRef.current) {
                    setMqttConnected(connected);
                    console.log(`[AlertMqtt] MQTT ${connected ? "✅ CONNECTED" : "❌ DISCONNECTED"}`);
                }
            },
            (topic, payload) => {
                console.log(`[AlertMqtt] 📩 Received message on ${topic}:`, payload);
            }
        );

        if (client) {
            console.log("[AlertMqtt] MQTT client created successfully");
        }

        // Cleanup function - DON'T disconnect on every re-render
        return () => {
            console.log("[AlertMqtt] Component unmounting...");
            isMountedRef.current = false;
            // Only disconnect if this is a true unmount (not a re-render)
            // The singleton pattern in mqtt.ts will handle this
        };
    }, [enabled]); // Only depend on enabled

    // Cleanup on page unload
    useEffect(() => {
        const handleBeforeUnload = () => {
            console.log("[AlertMqtt] Page unloading, disconnecting MQTT...");
            disconnectMqtt();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    // Check for critical conditions and send alerts
    useEffect(() => {
        if (!enabled || !sensorData) {
            return;
        }

        const checkAndSendAlert = async () => {
            // Check for critical conditions
            const criticalConditions = detectCriticalConditions(sensorData, criticalHealthThreshold);

            // Only log when there's something interesting
            if (criticalConditions.hasCritical) {
                console.log("[AlertMqtt] 🔍 Critical check:", {
                    hasCritical: criticalConditions.hasCritical,
                    reasons: criticalConditions.reasons,
                });
            }

            if (criticalConditions.hasCritical) {
                // Check cooldown
                const now = Date.now();
                const timeSinceLastAlert = now - lastAlertTimeRef.current;

                if (timeSinceLastAlert < alertCooldown) {
                    // Silently skip - don't spam console
                    return;
                }

                console.log("[AlertMqtt] 🚨 CRITICAL CONDITION DETECTED:", criticalConditions.reasons);

                // Send alert to PLC
                const success = await sendAlertToPLC(
                    criticalConditions.mostSevereParameter,
                    criticalConditions.mostSevereValue
                );

                if (success) {
                    lastAlertTimeRef.current = now;
                    wasInCriticalRef.current = true;
                    if (isMountedRef.current) {
                        setLastAlertInfo({
                            time: now,
                            parameter: criticalConditions.mostSevereParameter,
                            value: criticalConditions.mostSevereValue,
                        });
                    }
                    console.log("[AlertMqtt] ✅ Alert sent successfully to PLC!");
                }
            } else if (wasInCriticalRef.current) {
                // Condition returned to normal
                console.log("[AlertMqtt] ✅ Conditions returned to normal. Sending OFF signal...");
                const success = await sendOffSignalToPLC();
                if (success) {
                    wasInCriticalRef.current = false;
                }
            }
        };

        checkAndSendAlert();
    }, [
        // Use primitive values instead of object references
        sensorData?.healthIndex,
        sensorData?.vibrationRms,
        sensorData?.motorSurfaceTemp,
        sensorData?.bearingTemp,
        sensorData?.motorCurrent,
        sensorData?.gridVoltage,
        sensorData?.powerFactor,
        sensorData?.dustDensity,
        enabled,
        alertCooldown,
        criticalHealthThreshold
    ]);

    // Manual functions - stable with useCallback
    const manualSendAlert = useCallback(async (alertType?: string, value?: number) => {
        console.log("[AlertMqtt] 📤 Manual alert triggered:", { alertType, value });
        return await sendAlertToPLC(alertType, value);
    }, []);

    const manualSendOff = useCallback(async () => {
        console.log("[AlertMqtt] 📤 Manual OFF signal triggered");
        return await sendOffSignalToPLC();
    }, []);

    const reconnect = useCallback(() => {
        console.log("[AlertMqtt] 🔄 Manual reconnect requested...");
        // Clear session storage to get new client ID
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('mqtt_client_id');
        }
        disconnectMqtt();

        // Wait for disconnect to complete
        setTimeout(() => {
            isInitializedRef.current = false;
            connectMqtt((connected) => {
                if (isMountedRef.current) {
                    setMqttConnected(connected);
                }
            });
            isInitializedRef.current = true;
        }, 1000);
    }, []);

    return {
        mqttConnected,
        isMqttConnected: () => isMqttConnected(),
        sendAlert: manualSendAlert,
        sendOff: manualSendOff,
        reconnect,
        lastAlertInfo,
    };
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

interface CriticalConditionResult {
    hasCritical: boolean;
    reasons: string[];
    mostSevereParameter?: string;
    mostSevereValue?: number;
}

function detectCriticalConditions(
    data: SensorReading,
    healthThreshold: number
): CriticalConditionResult {
    const reasons: string[] = [];
    let mostSevereParameter: string | undefined;
    let mostSevereValue: number | undefined;

    // Check health index first
    if (data.healthIndex !== undefined && data.healthIndex < healthThreshold) {
        reasons.push(`Health Index: ${data.healthIndex.toFixed(1)}%`);
        mostSevereParameter = "healthIndex";
        mostSevereValue = data.healthIndex;
    }

    // Check individual parameters
    const parametersToCheck: { key: keyof SensorReading; type: ParameterType }[] = [
        { key: "vibrationRms", type: "vibrationRms" },
        { key: "motorSurfaceTemp", type: "motorSurfaceTemp" },
        { key: "bearingTemp", type: "bearingTemp" },
        { key: "motorCurrent", type: "motorCurrent" },
        { key: "gridVoltage", type: "gridVoltage" },
        { key: "powerFactor", type: "powerFactor" },
        { key: "dustDensity", type: "dustDensity" },
    ];

    for (const param of parametersToCheck) {
        const value = data[param.key];
        if (value === undefined) continue;

        const status = getStatusColor(value, param.type);

        if (status.level === "critical") {
            reasons.push(`${param.type}: ${value}`);

            if (!mostSevereParameter || mostSevereParameter === "healthIndex") {
                mostSevereParameter = param.type;
                mostSevereValue = value;
            }
        }
    }

    return {
        hasCritical: reasons.length > 0,
        reasons,
        mostSevereParameter,
        mostSevereValue,
    };
}

export default useAlertMqtt;
