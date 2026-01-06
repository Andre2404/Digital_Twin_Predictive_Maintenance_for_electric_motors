'use client';

import { useState, useEffect } from 'react';
import { timeAgo } from '@/lib/utils';

interface RealtimeStatusBarProps {
  isConnected: boolean;
  lastUpdate: Date | string | number | null;
  motorName: string;
}

export function RealtimeStatusBar({ isConnected, lastUpdate, motorName }: RealtimeStatusBarProps) {
  const [timeAgoText, setTimeAgoText] = useState<string>('');

  // Auto-update time ago setiap detik untuk real-time display
  useEffect(() => {
    if (!lastUpdate) {
      setTimeAgoText('');
      return;
    }

    // Parse timestamp dari Firebase (bisa number, string, atau Date)
    // Firebase timestamp bisa dalam format:
    // - Number (milliseconds): 1234567890123
    // - Number (seconds): 1234567890 (jika < 10000000000)
    // - String ISO: "2024-01-01T00:00:00.000Z"
    // - Date object
    const parseTimestamp = (ts: Date | string | number): Date => {
      if (ts instanceof Date) {
        // Validasi Date object
        return isNaN(ts.getTime()) ? new Date() : ts;
      }
      if (typeof ts === 'number') {
        // Jika timestamp dalam detik (Unix timestamp), convert ke milliseconds
        // Timestamp dalam detik biasanya < 10000000000 (tahun 2286)
        // Timestamp dalam milliseconds biasanya > 1000000000000 (tahun 2001)
        if (ts < 10000000000) {
          // Unix timestamp dalam detik
          return new Date(ts * 1000);
        } else {
          // Timestamp dalam milliseconds
          return new Date(ts);
        }
      }
      if (typeof ts === 'string') {
        const parsed = new Date(ts);
        // Validasi hasil parsing
        return isNaN(parsed.getTime()) ? new Date() : parsed;
      }
      // Fallback ke waktu sekarang
      return new Date();
    };

    const updateTimeAgo = () => {
      try {
        const date = parseTimestamp(lastUpdate);
        // Validasi: pastikan date tidak di masa depan dan tidak terlalu lama (lebih dari 1 tahun)
        const now = new Date();
        const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        
        if (date > now) {
          // Timestamp di masa depan - gunakan waktu sekarang
          console.warn('⚠️ Timestamp di masa depan, menggunakan waktu sekarang');
          setTimeAgoText(timeAgo(now));
        } else if (date < oneYearAgo) {
          // Timestamp terlalu lama - mungkin invalid
          console.warn('⚠️ Timestamp terlalu lama, mungkin invalid');
          setTimeAgoText('');
        } else {
          setTimeAgoText(timeAgo(date));
        }
      } catch (error) {
        console.error('Error parsing timestamp:', error, 'Raw timestamp:', lastUpdate);
        setTimeAgoText('');
      }
    };

    // Update immediately
    updateTimeAgo();

    // Update setiap detik untuk real-time
    const interval = setInterval(updateTimeAgo, 1000);

    return () => clearInterval(interval);
  }, [lastUpdate]);

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* ESP Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`status-dot ${isConnected ? 'bg-status-normal animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-sm font-medium text-gray-700">
                ESP: {isConnected ? 'Online' : 'Offline'}
              </span>
            </div>
            
            {/* Last Update - Real-time dari Firebase timestamp */}
            {lastUpdate && timeAgoText && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-gray-600">
                  Terakhir update: <span className="font-medium">{timeAgoText}</span>
                </span>
              </div>
            )}
            
            {/* Motor Being Monitored */}
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-sm text-gray-600">
                Motor: <span className="font-medium text-gray-800">{motorName}</span>
              </span>
            </div>
          </div>
          
          {/* Data Refresh Indicator */}
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
            <span className="text-xs text-gray-500">Auto-refresh setiap 2 detik</span>
          </div>
        </div>
      </div>
    </div>
  );
}

