/**
 * MQTT Client for PLC Control via HiveMQ Cloud
 * 
 * This module connects to HiveMQ Cloud broker and sends control signals
 * to Node-RED which then controls the PLC (Omron CP2E).
 * 
 * When an alert is triggered, it sends W1 signal to turn ON the PLC output.
 */

import mqtt from "mqtt";

// ============================================================
// CONFIGURATION - HiveMQ Cloud
// ============================================================
const MQTT_BROKER_URL = "wss://f7111dfa65944d1fb86c7678a2d7673b.s1.eu.hivemq.cloud:8884/mqtt";

// Generate a STABLE client ID (based on browser fingerprint or stored in sessionStorage)
const getStableClientId = (): string => {
    if (typeof window !== 'undefined') {
        let clientId = sessionStorage.getItem('mqtt_client_id');
        if (!clientId) {
            clientId = `mechasense-web-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
            sessionStorage.setItem('mqtt_client_id', clientId);
        }
        return clientId;
    }
    return `mechasense-server-${Date.now().toString(36)}`;
};

const MQTT_OPTIONS: mqtt.IClientOptions = {
    username: "3matkul",
    password: "#Andre2404",
    clientId: getStableClientId(),
    protocol: "wss",
    clean: true,                // Clean session
    reconnectPeriod: 5000,      // Reconnect every 5 seconds if disconnected
    connectTimeout: 30000,      // 30 second connection timeout
    keepalive: 60,              // Keep alive every 60 seconds
};

// MQTT Topics
const TOPICS = {
    PLC_CONTROL: "PLC/CP2E/Control",      // Topic to send control commands to Node-RED/PLC
    PLC_STATUS: "plc/cp2e/status",         // Topic to receive PLC status (optional)
};

// ============================================================
// GLOBAL STATE (Singleton Pattern)
// ============================================================
let client: mqtt.MqttClient | null = null;
let isConnecting = false;
let isCleaningUp = false;
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

// Callback for connection status changes
type ConnectionCallback = (connected: boolean) => void;
let onConnectionChange: ConnectionCallback | null = null;

// Callback for incoming messages
type MessageCallback = (topic: string, payload: Record<string, unknown>) => void;
let onMessageReceived: MessageCallback | null = null;

// ============================================================
// CONNECTION FUNCTIONS
// ============================================================

/**
 * Initialize and connect to MQTT broker.
 * Safe to call multiple times - will reuse existing connection.
 * Uses singleton pattern to prevent multiple connections.
 */
export const connectMqtt = (
    onConnect?: ConnectionCallback,
    onMessage?: MessageCallback
): mqtt.MqttClient | null => {
    // Store callbacks
    if (onConnect) onConnectionChange = onConnect;
    if (onMessage) onMessageReceived = onMessage;

    // Don't connect if we're cleaning up
    if (isCleaningUp) {
        console.log("[MQTT] Cleanup in progress, skipping connection...");
        return null;
    }

    // Return existing client if already connected
    if (client && client.connected) {
        console.log("[MQTT] ✓ Already connected to HiveMQ Cloud");
        onConnectionChange?.(true);
        return client;
    }

    // If client exists but not connected, check if it's reconnecting
    if (client && !client.connected) {
        console.log("[MQTT] Client exists but not connected, waiting for reconnection...");
        return client;
    }

    // Prevent multiple simultaneous connection attempts
    if (isConnecting) {
        console.log("[MQTT] Connection already in progress...");
        return null;
    }

    // Check max reconnect attempts
    if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error("[MQTT] Max reconnection attempts reached. Please refresh the page.");
        return null;
    }

    isConnecting = true;
    connectionAttempts++;

    const clientId = getStableClientId();
    console.log(`[MQTT] 🔌 Connecting to HiveMQ Cloud (attempt ${connectionAttempts})...`);
    console.log(`[MQTT] Client ID: ${clientId}`);

    try {
        // Create new options with stable client ID
        const options = {
            ...MQTT_OPTIONS,
            clientId: clientId,
        };

        client = mqtt.connect(MQTT_BROKER_URL, options);

        client.on("connect", () => {
            console.log("[MQTT] ✅ Connected to HiveMQ Cloud");
            isConnecting = false;
            connectionAttempts = 0; // Reset on successful connection
            onConnectionChange?.(true);

            // Subscribe to PLC status topic
            client?.subscribe(TOPICS.PLC_STATUS, { qos: 1 }, (err) => {
                if (err) {
                    console.error("[MQTT] Failed to subscribe to PLC status:", err);
                } else {
                    console.log(`[MQTT] Subscribed to: ${TOPICS.PLC_STATUS}`);
                }
            });
        });

        client.on("message", (topic, message) => {
            try {
                const payload = JSON.parse(message.toString());
                console.log(`[MQTT] 📩 Message on ${topic}:`, payload);
                onMessageReceived?.(topic, payload);
            } catch (error) {
                console.error("[MQTT] Error parsing message:", error);
            }
        });

        client.on("error", (err) => {
            console.error("[MQTT] ❌ Connection error:", err.message);
            isConnecting = false;
            // Don't immediately set disconnected - let reconnection handle it
        });

        client.on("close", () => {
            console.log("[MQTT] Connection closed");
            isConnecting = false;
            if (!isCleaningUp) {
                // Only notify disconnection if we're not intentionally cleaning up
                onConnectionChange?.(false);
            }
        });

        client.on("reconnect", () => {
            console.log("[MQTT] 🔄 Attempting to reconnect...");
            connectionAttempts++;
        });

        client.on("offline", () => {
            console.log("[MQTT] Client is offline");
            if (!isCleaningUp) {
                onConnectionChange?.(false);
            }
        });

        return client;
    } catch (error) {
        console.error("[MQTT] Failed to create client:", error);
        isConnecting = false;
        return null;
    }
};

/**
 * Disconnect from MQTT broker.
 * Uses force: true to ensure immediate disconnection.
 */
export const disconnectMqtt = (): void => {
    if (client) {
        console.log("[MQTT] 🔌 Disconnecting...");
        isCleaningUp = true;

        // Remove all listeners first to prevent callbacks during cleanup
        client.removeAllListeners();

        // Force end the connection
        client.end(true, {}, () => {
            console.log("[MQTT] Disconnected successfully");
            client = null;
            isConnecting = false;
            isCleaningUp = false;
            onConnectionChange?.(false);
        });
    }
};

/**
 * Check if MQTT client is connected.
 */
export const isMqttConnected = (): boolean => {
    return client?.connected ?? false;
};

/**
 * Get current client (for debugging)
 */
export const getMqttClient = (): mqtt.MqttClient | null => {
    return client;
};

// ============================================================
// PLC CONTROL FUNCTIONS
// ============================================================

/**
 * Send alert signal to PLC via Node-RED.
 * This activates W1 (Word 1) on the PLC to trigger an actuator.
 * 
 * @param alertType - Type of alert (for logging purposes)
 * @param alertValue - The sensor value that triggered the alert
 */
export const sendAlertToPLC = (
    alertType?: string,
    alertValue?: number
): Promise<boolean> => {
    return new Promise((resolve) => {
        if (!client || !client.connected) {
            console.warn("[MQTT] Not connected. Attempting to connect first...");
            connectMqtt();

            // Wait a bit for connection
            setTimeout(() => {
                if (!client?.connected) {
                    console.error("[MQTT] Failed to connect. Cannot send alert.");
                    resolve(false);
                    return;
                }
                sendAlertPayload(alertType, alertValue, resolve);
            }, 3000);
            return;
        }

        sendAlertPayload(alertType, alertValue, resolve);
    });
};

/**
 * Internal function to send the alert payload.
 */
const sendAlertPayload = (
    alertType?: string,
    alertValue?: number,
    callback?: (success: boolean) => void
): void => {
    const payload = {
        W1: 1,                                    // Turn ON signal
        timestamp: Math.floor(Date.now() / 1000), // Unix timestamp
        source: "mechasense-web",
        alertType: alertType || "CRITICAL",
        alertValue: alertValue ?? null,
    };

    const payloadStr = JSON.stringify(payload);

    client?.publish(TOPICS.PLC_CONTROL, payloadStr, { qos: 1 }, (err) => {
        if (err) {
            console.error("[MQTT] Failed to publish alert:", err);
            callback?.(false);
        } else {
            console.log(`[MQTT] ✅ Alert sent to ${TOPICS.PLC_CONTROL}:`, payload);
            callback?.(true);
        }
    });
};

/**
 * Send OFF signal to PLC (W2 = 1).
 * Use this to turn off the actuator when condition returns to normal.
 */
export const sendOffSignalToPLC = (): Promise<boolean> => {
    return new Promise((resolve) => {
        if (!client || !client.connected) {
            console.error("[MQTT] Not connected. Cannot send OFF signal.");
            resolve(false);
            return;
        }

        const payload = {
            W2: 1,                                    // Turn OFF signal
            timestamp: Math.floor(Date.now() / 1000),
            source: "mechasense-web",
        };

        const payloadStr = JSON.stringify(payload);

        client.publish(TOPICS.PLC_CONTROL, payloadStr, { qos: 1 }, (err) => {
            if (err) {
                console.error("[MQTT] Failed to publish OFF signal:", err);
                resolve(false);
            } else {
                console.log(`[MQTT] ✅ OFF signal sent to ${TOPICS.PLC_CONTROL}:`, payload);
                resolve(true);
            }
        });
    });
};

/**
 * Send custom command to PLC.
 * 
 * @param command - Custom command object to send
 */
export const sendCustomCommand = (
    command: Record<string, unknown>
): Promise<boolean> => {
    return new Promise((resolve) => {
        if (!client || !client.connected) {
            console.error("[MQTT] Not connected. Cannot send command.");
            resolve(false);
            return;
        }

        const payload = {
            ...command,
            timestamp: Math.floor(Date.now() / 1000),
            source: "mechasense-web",
        };

        const payloadStr = JSON.stringify(payload);

        client.publish(TOPICS.PLC_CONTROL, payloadStr, { qos: 1 }, (err) => {
            if (err) {
                console.error("[MQTT] Failed to publish command:", err);
                resolve(false);
            } else {
                console.log(`[MQTT] ✅ Command sent:`, payload);
                resolve(true);
            }
        });
    });
};

// ============================================================
// EXPORTS
// ============================================================
export { TOPICS };
