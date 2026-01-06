/**
 * PLCControlPanel Component
 * 
 * Manual control panel for PLC buzzer/lamp with ON and OFF buttons.
 * Also shows MQTT connection status and last alert info.
 */

"use client";

import { useState, useCallback } from "react";

interface PLCControlPanelProps {
    mqttConnected: boolean;
    onSendAlert: (alertType?: string, value?: number) => Promise<boolean>;
    onSendOff: () => Promise<boolean>;
    onReconnect: () => void;
    lastAlertInfo?: {
        time: number;
        parameter?: string;
        value?: number;
    } | null;
}

export function PLCControlPanel({
    mqttConnected,
    onSendAlert,
    onSendOff,
    onReconnect,
    lastAlertInfo,
}: PLCControlPanelProps) {
    const [isLoading, setIsLoading] = useState<"on" | "off" | null>(null);
    const [lastAction, setLastAction] = useState<{
        type: "on" | "off";
        success: boolean;
        time: Date;
    } | null>(null);

    const handleBuzzerOn = useCallback(async () => {
        setIsLoading("on");
        try {
            const success = await onSendAlert("MANUAL_TRIGGER");
            setLastAction({ type: "on", success, time: new Date() });
        } catch (error) {
            console.error("Failed to turn on buzzer:", error);
            setLastAction({ type: "on", success: false, time: new Date() });
        } finally {
            setIsLoading(null);
        }
    }, [onSendAlert]);

    const handleBuzzerOff = useCallback(async () => {
        setIsLoading("off");
        try {
            const success = await onSendOff();
            setLastAction({ type: "off", success, time: new Date() });
        } catch (error) {
            console.error("Failed to turn off buzzer:", error);
            setLastAction({ type: "off", success: false, time: new Date() });
        } finally {
            setIsLoading(null);
        }
    }, [onSendOff]);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    return (
        <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg
                    className="w-5 h-5 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                </svg>
                PLC Control Panel
            </h3>

            {/* MQTT Connection Status */}
            <div className="mb-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div
                            className={`w-3 h-3 rounded-full ${mqttConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                                }`}
                        />
                        <span className="text-sm font-medium text-gray-700">
                            MQTT Status
                        </span>
                    </div>
                    <span
                        className={`text-sm font-semibold ${mqttConnected ? "text-green-600" : "text-red-600"
                            }`}
                    >
                        {mqttConnected ? "Connected" : "Disconnected"}
                    </span>
                </div>
                {!mqttConnected && (
                    <button
                        onClick={onReconnect}
                        className="mt-2 text-xs text-primary hover:underline"
                    >
                        Click to reconnect
                    </button>
                )}
            </div>

            {/* Control Buttons */}
            <div className="mb-4">
                <p className="text-sm font-medium text-gray-600 mb-3">
                    Manual Buzzer/Lamp Control
                </p>
                <div className="flex gap-3">
                    {/* ON Button */}
                    <button
                        onClick={handleBuzzerOn}
                        disabled={isLoading !== null || !mqttConnected}
                        className={`flex-1 py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${isLoading === "on"
                                ? "bg-green-400 cursor-wait"
                                : !mqttConnected
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-green-600 hover:bg-green-700 active:scale-95"
                            }`}
                    >
                        {isLoading === "on" ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                    />
                                </svg>
                                ON (W1)
                            </>
                        )}
                    </button>

                    {/* OFF Button */}
                    <button
                        onClick={handleBuzzerOff}
                        disabled={isLoading !== null || !mqttConnected}
                        className={`flex-1 py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${isLoading === "off"
                                ? "bg-red-400 cursor-wait"
                                : !mqttConnected
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-red-600 hover:bg-red-700 active:scale-95"
                            }`}
                    >
                        {isLoading === "off" ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                                    />
                                </svg>
                                OFF (W2)
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Last Action Status */}
            {lastAction && (
                <div
                    className={`p-3 rounded-lg border ${lastAction.success
                            ? "bg-green-50 border-green-200"
                            : "bg-red-50 border-red-200"
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {lastAction.success ? (
                                <svg
                                    className="w-4 h-4 text-green-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    className="w-4 h-4 text-red-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            )}
                            <span
                                className={`text-sm font-medium ${lastAction.success ? "text-green-700" : "text-red-700"
                                    }`}
                            >
                                {lastAction.type === "on" ? "Buzzer ON" : "Buzzer OFF"}
                                {lastAction.success ? " - Sent!" : " - Failed!"}
                            </span>
                        </div>
                        <span className="text-xs text-gray-500">
                            {formatTime(lastAction.time)}
                        </span>
                    </div>
                </div>
            )}

            {/* Auto Alert Info */}
            {lastAlertInfo && (
                <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-xs font-medium text-amber-800 mb-1">
                        Last Auto Alert
                    </p>
                    <p className="text-sm text-amber-700">
                        Parameter: {lastAlertInfo.parameter || "N/A"} ={" "}
                        {lastAlertInfo.value?.toFixed(2) || "N/A"}
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                        {new Date(lastAlertInfo.time).toLocaleString("id-ID")}
                    </p>
                </div>
            )}

            {/* Info */}
            <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                    <span className="font-medium">Topic:</span> PLC/CP2E/Control
                </p>
                <p className="text-xs text-gray-500 mt-1">
                    <span className="font-medium">Auto:</span> Mengirim W1 saat health
                    &lt; 60% atau parameter critical
                </p>
            </div>
        </div>
    );
}

export default PLCControlPanel;
