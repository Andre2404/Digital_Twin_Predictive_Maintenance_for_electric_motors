'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [motorName, setMotorName] = useState('Motor Utama Lantai 2');
  const [location, setLocation] = useState('Workshop Area A');
  const [ratedPower, setRatedPower] = useState('7.5');
  const [ratedCurrent, setRatedCurrent] = useState('15');
  const [ratedVoltage, setRatedVoltage] = useState('380');
  const [pollingInterval, setPollingInterval] = useState('2');
  const [alertEmail, setAlertEmail] = useState('admin@example.com');
  
  const handleSave = () => {
    // TODO: Implement save to database
    alert('Settings saved! (Note: This is a dummy action for now)');
  };
  
  return (
    <div className="min-h-screen bg-lightgray">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
          <p className="text-gray-600 mt-1">Konfigurasi sistem monitoring dan motor</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Motor Configuration */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Motor Configuration
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motor Name
                  </label>
                  <input
                    type="text"
                    value={motorName}
                    onChange={(e) => setMotorName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rated Power (kW)
                    </label>
                    <input
                      type="number"
                      value={ratedPower}
                      onChange={(e) => setRatedPower(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rated Current (A)
                    </label>
                    <input
                      type="number"
                      value={ratedCurrent}
                      onChange={(e) => setRatedCurrent(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rated Voltage (V)
                    </label>
                    <input
                      type="number"
                      value={ratedVoltage}
                      onChange={(e) => setRatedVoltage(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* System Settings */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                System Settings
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Polling Interval (seconds)
                  </label>
                  <input
                    type="number"
                    value={pollingInterval}
                    onChange={(e) => setPollingInterval(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Frekuensi refresh data dari server (default: 2 detik)
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alert Email
                  </label>
                  <input
                    type="email"
                    value={alertEmail}
                    onChange={(e) => setAlertEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email untuk notifikasi alert kritis
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enableNotifications"
                    defaultChecked
                    className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="enableNotifications" className="text-sm font-medium text-gray-700">
                    Enable push notifications
                  </label>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enableAutoReports"
                    defaultChecked
                    className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="enableAutoReports" className="text-sm font-medium text-gray-700">
                    Generate daily reports automatically
                  </label>
                </div>
              </div>
            </div>
            
            {/* Threshold Configuration */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Threshold Configuration
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Custom threshold values untuk parameter monitoring (Coming Soon)
              </p>
              
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  Fitur ini akan memungkinkan Anda untuk mengatur custom threshold untuk setiap parameter sensor.
                  Saat ini menggunakan nilai default yang sudah dikonfigurasi di sistem.
                </p>
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* ESP Connection Info */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                ESP Connection
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="status-dot bg-status-normal animate-pulse"></div>
                  <span className="text-gray-700">Status: Online</span>
                </div>
                <div className="text-gray-600">
                  <p>Endpoint:</p>
                  <code className="block mt-1 p-2 bg-gray-100 rounded text-xs">
                    POST /api/ingest
                  </code>
                </div>
                <div className="text-gray-600">
                  <p>Motor ID:</p>
                  <code className="block mt-1 p-2 bg-gray-100 rounded text-xs">
                    default-motor-1
                  </code>
                </div>
              </div>
            </div>
            
            {/* Database Info */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                Database
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Type: SQLite (demo)</p>
                <p>Ready for: PostgreSQL</p>
                <p className="text-xs pt-2 border-t border-gray-200 mt-3">
                  Untuk production, update DATABASE_URL di .env ke PostgreSQL connection string.
                </p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={handleSave}
                  className="w-full btn-primary"
                >
                  Save Settings
                </button>
                <button
                  onClick={() => alert('Export feature coming soon!')}
                  className="w-full btn-secondary"
                >
                  Export Data
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all alerts?')) {
                      alert('Alerts cleared! (Dummy action)');
                    }
                  }}
                  className="w-full px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors font-semibold"
                >
                  Clear All Alerts
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

