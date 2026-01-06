"use client";

import { formatTime } from "@/lib/utils";
import { Alert } from "@/types/alert";

interface AlertListProps {
  alerts: Alert[];
  onAcknowledge?: (alertId: string) => void;
}

export function AlertList({ alerts, onAcknowledge }: AlertListProps) {
  const sortedAlerts = [...alerts].sort(
    (a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)
  );

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
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        Active Alerts
      </h3>

      {sortedAlerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">Tidak ada alert aktif</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sortedAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border-l-4 ${
                alert.severity === "high"
                  ? "bg-red-50 border-status-critical"
                  : "bg-amber-50 border-status-warning"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded ${
                        alert.severity === "high"
                          ? "bg-status-critical text-white"
                          : "bg-status-warning text-white"
                      }`}
                    >
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(typeof alert.timestamp === 'number' ? new Date(alert.timestamp) : alert.timestamp)}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        alert.status === "OPEN"
                          ? "bg-gray-200 text-gray-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {alert.status ?? "-"}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">
                    {alert.message}
                  </p>
                  {alert.parameter && (
                    <p className="text-xs text-gray-600 mt-1">
                      Parameter:{" "}
                      <span className="font-medium">{alert.parameter}</span> ={" "}
                      {alert.value}
                    </p>
                  )}
                </div>

                {alert.status === "OPEN" && onAcknowledge && (
                  <button
                    onClick={() => onAcknowledge(alert.id)}
                    className="ml-2 px-3 py-1 text-xs font-medium bg-primary text-white rounded hover:bg-primary-dark transition-colors"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
