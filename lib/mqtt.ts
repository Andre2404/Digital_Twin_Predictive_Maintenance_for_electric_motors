import mqtt from "mqtt";

// Configuration
const MQTT_BROKER_URL = "ws://192.168.1.10:8083/mqtt";
const MQTT_OPTIONS = {
    username: "POCO X6 5G",
    password: "miotmiot",
    clientId: "web-control-panel-" + Math.random().toString(16).substring(2, 8),
};

// Global client variable to maintain connection across re-renders/calls
let client: mqtt.MqttClient | null = null;

export const connectMqtt = () => {
    if (client && client.connected) {
        console.log("MQTT Client already connected");
        return client;
    }

    console.log("Connecting to MQTT...");
    client = mqtt.connect(MQTT_BROKER_URL, MQTT_OPTIONS);

    client.on("connect", () => {
        console.log("MQTT connected");

        // Subscribe to status topic
        client?.subscribe("plc/cp2e/status", (err) => {
            if (err) {
                console.error("Failed to subscribe to plc/cp2e/status:", err);
            } else {
                console.log("Subscribed to plc/cp2e/status");
            }
        });
    });

    client.on("message", (topic, message) => {
        try {
            // Basic logging as requested
            const data = JSON.parse(message.toString());
            console.log(`[MQTT] Message on ${topic}:`, data);
        } catch (error) {
            console.error("[MQTT] Error parsing message:", error);
        }
    });

    client.on("error", (err) => {
        console.error("MQTT connection error:", err);
    });

    client.on("close", () => {
        console.log("MQTT connection closed");
    });

    return client;
};

/**
 * Sends an alert signal to Node-RED to trigger the actuator.
 * Topic: "alert/trigger" (Default, change if needed)
 */
export const sendAlert = () => {
    if (!client || !client.connected) {
        console.warn("MQTT client not connected. Attempting to connect...");
        connectMqtt();
    }

    const payload = JSON.stringify({
        "Q0.00": 1,
        "timestamp": Math.floor(Date.now() / 1000),
    });

    // Note: Using 'alert/trigger' as default topic since none was specified.
    client?.publish("alert/trigger", payload, (err) => {
        if (err) {
            console.error("Failed to publish alert:", err);
        } else {
            console.log("Alert signal sent:", payload);
        }
    });
};
