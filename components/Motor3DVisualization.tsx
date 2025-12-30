'use client';

import { useEffect, useRef } from 'react';
import { animate as anime, type JSAnimation } from 'animejs';

interface Motor3DVisualizationProps {
  // Sensor data
  gridFrequency?: number; // Hz
  motorCurrent?: number; // A
  motorSurfaceTemp?: number; // °C
  vibrationRms?: number; // mm/s
  power?: number; // W
  healthScore?: number; // 0-100
}

/**
 * Motor AC 1 Fasa Visualization Component
 * Displays real-time animated motor based on sensor data
 */
export function Motor3DVisualization({
  gridFrequency = 50,
  motorCurrent = 0,
  motorSurfaceTemp = 25,
  vibrationRms = 0,
  power = 0,
  healthScore = 100,
}: Motor3DVisualizationProps) {
  const motorContainerRef = useRef<HTMLDivElement>(null);
  const rotorRef = useRef<SVGCircleElement>(null);
  const statorRef = useRef<SVGPathElement>(null);
  const vibrationRef = useRef<SVGGElement>(null);
  const powerGlowRef = useRef<SVGCircleElement>(null);
  const currentArcRef = useRef<SVGPathElement>(null);

  // Calculate RPM from frequency (assuming 4-pole motor for single-phase)
  // RPM = (120 * frequency) / number_of_poles
  // For single-phase AC motor with 4 poles: RPM = (120 * 50) / 4 = 1500 RPM
  const calculateRPM = (frequency: number) => {
    return (120 * frequency) / 4; // 4-pole single-phase motor
  };

  const rpm = calculateRPM(gridFrequency);
  const rotationDuration = rpm > 0 ? 60000 / rpm : 0; // Duration for one full rotation in ms

  // Temperature to color mapping
  const getTemperatureColor = (temp: number) => {
    if (temp < 40) return '#3b82f6'; // Blue - cool
    if (temp < 55) return '#10b981'; // Green - normal
    if (temp < 70) return '#f59e0b'; // Amber - warm
    if (temp < 85) return '#f97316'; // Orange - hot
    return '#ef4444'; // Red - critical
  };

  // Vibration intensity (0-1 scale)
  const vibrationIntensity = Math.min(vibrationRms / 10, 1);

  // Current/Power intensity (0-1 scale)
  const currentIntensity = Math.min(motorCurrent / 10, 1);

  useEffect(() => {
    if (!motorContainerRef.current) return;

    const animations: JSAnimation[] = [];

    // Rotor rotation animation
    if (rotorRef.current && rotationDuration > 0 && rpm > 0) {
      const rotationAnim = anime(rotorRef.current, {
        rotate: 360,
        duration: rotationDuration,
        ease: 'linear',
        loop: true,
      });
      animations.push(rotationAnim);
    }

    // Vibration animation (motor shaking)
    if (vibrationRef.current && vibrationIntensity > 0.1) {
      const vibrationAnim = anime(vibrationRef.current, {
        translateX: [
          -vibrationIntensity * 2,
          vibrationIntensity * 2,
          0,
        ],
        translateY: [
          -vibrationIntensity * 2,
          vibrationIntensity * 2,
          0,
        ],
        duration: 1000 / (1 + vibrationRms * 10), // Faster vibration for higher RMS
        ease: 'inOutSine',
        loop: true,
      });
      animations.push(vibrationAnim);
    }

    // Power/Current glow animation
    if (powerGlowRef.current && currentIntensity > 0.1) {
      const glowAnim = anime(powerGlowRef.current, {
        opacity: [
          currentIntensity * 0.5,
          currentIntensity * 0.8,
          currentIntensity * 0.5,
        ],
        scale: [
          1,
          1 + currentIntensity * 0.1,
          1,
        ],
        duration: 1500,
        ease: 'inOutSine',
        loop: true,
      });
      animations.push(glowAnim);
    }

    // Electric arc animation (if current is high)
    if (currentArcRef.current && currentIntensity > 0.3) {
      const arcAnim = anime(currentArcRef.current, {
        opacity: [
          currentIntensity * 0.6,
          currentIntensity * 0.9,
          currentIntensity * 0.6,
        ],
        duration: 800,
        ease: 'inOutSine',
        loop: true,
      });
      animations.push(arcAnim);
    }

    // Cleanup function
    return () => {
      animations.forEach(anim => {
        if (anim) anim.pause();
      });
    };
  }, [rpm, rotationDuration, vibrationIntensity, vibrationRms, currentIntensity]);

  const tempColor = getTemperatureColor(motorSurfaceTemp);
  const healthColor = healthScore >= 80 ? '#10b981' : healthScore >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Motor AC 1 Fasa - Real-time Visualization</h2>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-gray-600">RPM</div>
            <div className="text-2xl font-bold text-gray-900">{Math.round(rpm)}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Temp</div>
            <div className="text-2xl font-bold" style={{ color: tempColor }}>
              {motorSurfaceTemp.toFixed(1)}°C
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-8 min-h-[400px]">
        <div ref={motorContainerRef} className="relative" style={{ width: '350px', height: '350px' }}>
          <svg
            viewBox="0 0 350 350"
            className="w-full h-full"
            style={{ filter: `drop-shadow(0 4px 8px rgba(0,0,0,0.1))` }}
          >
            <defs>
              {/* Gradient for power glow */}
              <radialGradient id="powerGlow" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </radialGradient>

              {/* Gradient for motor body */}
              <linearGradient id="motorGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={tempColor} stopOpacity="0.3" />
                <stop offset="100%" stopColor={tempColor} stopOpacity="0.1" />
              </linearGradient>

              {/* Filter for glow effect */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Power glow effect */}
            <circle
              ref={powerGlowRef}
              cx="175"
              cy="175"
              r="120"
              fill="url(#powerGlow)"
              opacity={currentIntensity * 0.5}
            />

            {/* Motor Stator (outer casing) */}
            <g ref={vibrationRef} transform-origin="175 175">
              <circle
                cx="175"
                cy="175"
                r="130"
                fill="url(#motorGradient)"
                stroke={tempColor}
                strokeWidth="8"
                opacity="0.8"
              />

              {/* Stator windings (representation) */}
              <g opacity="0.6">
                {[...Array(12)].map((_, i) => {
                  const angle = (i * 30) * (Math.PI / 180);
                  const x1 = 175 + 110 * Math.cos(angle);
                  const y1 = 175 + 110 * Math.sin(angle);
                  const x2 = 175 + 125 * Math.cos(angle);
                  const y2 = 175 + 125 * Math.sin(angle);
                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={tempColor}
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  );
                })}
              </g>

              {/* Motor body details */}
              <circle
                cx="175"
                cy="175"
                r="110"
                fill="none"
                stroke={tempColor}
                strokeWidth="4"
                opacity="0.5"
              />

              {/* Bearing representation */}
              <circle cx="175" cy="100" r="8" fill="#64748b" />
              <circle cx="175" cy="250" r="8" fill="#64748b" />
              <circle cx="100" cy="175" r="8" fill="#64748b" />
              <circle cx="250" cy="175" r="8" fill="#64748b" />
            </g>

            {/* Rotor (inner rotating part) */}
            <g transform-origin="175 175">
              <circle
                ref={rotorRef}
                cx="175"
                cy="175"
                r="90"
                fill="#1e293b"
                stroke="#475569"
                strokeWidth="4"
              />

              {/* Rotor bars (representing squirrel cage) */}
              <g opacity="0.7">
                {[...Array(16)].map((_, i) => {
                  const angle = (i * 22.5) * (Math.PI / 180);
                  const x1 = 175 + 70 * Math.cos(angle);
                  const y1 = 175 + 70 * Math.sin(angle);
                  const x2 = 175 + 85 * Math.cos(angle);
                  const y2 = 175 + 85 * Math.sin(angle);
                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#60a5fa"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  );
                })}
              </g>

              {/* Rotor center */}
              <circle cx="175" cy="175" r="30" fill="#334155" stroke="#475569" strokeWidth="3" />

              {/* Rotor shaft */}
              <circle cx="175" cy="175" r="15" fill="#64748b" />

              {/* Health indicator ring */}
              <circle
                cx="175"
                cy="175"
                r="95"
                fill="none"
                stroke={healthColor}
                strokeWidth="4"
                opacity="0.6"
                strokeDasharray={`${healthScore * 0.01 * 2 * Math.PI * 95} ${2 * Math.PI * 95}`}
                strokeDashoffset={Math.PI * 95}
                transform="rotate(-90 175 175)"
              />
            </g>

            {/* Electric arc effect (when current is high) */}
            {currentIntensity > 0.3 && (
              <path
                ref={currentArcRef}
                d="M 175 85 Q 200 100 175 115 Q 150 100 175 85"
                stroke="#60a5fa"
                strokeWidth="2"
                fill="none"
                filter="url(#glow)"
                opacity={currentIntensity * 0.7}
              />
            )}

            {/* Vibration indicator dots */}
            {vibrationIntensity > 0.1 && (
              <g opacity={vibrationIntensity}>
                <circle cx="160" cy="50" r="3" fill="#ef4444">
                  <animate
                    attributeName="opacity"
                    values="0.3;1;0.3"
                    dur={`${1000 / (1 + vibrationRms)}ms`}
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="190" cy="50" r="3" fill="#ef4444">
                  <animate
                    attributeName="opacity"
                    values="1;0.3;1"
                    dur={`${1000 / (1 + vibrationRms)}ms`}
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            )}

            {/* Status labels */}
            <text x="175" y="320" textAnchor="middle" className="text-sm font-semibold fill-gray-700">
              {motorCurrent.toFixed(1)}A / {power.toFixed(0)}W
            </text>
            <text x="175" y="340" textAnchor="middle" className="text-xs fill-gray-500">
              Vibration: {vibrationRms.toFixed(2)} mm/s
            </text>
          </svg>
        </div>
      </div>

      {/* Legend/Status Bar */}
      <div className="mt-4 grid grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-xs text-gray-600 mb-1">Status</div>
          <div
            className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: healthColor }}
          >
            {healthScore >= 80 ? 'Normal' : healthScore >= 60 ? 'Warning' : 'Critical'}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Frequency</div>
          <div className="text-lg font-bold text-gray-900">{gridFrequency.toFixed(1)} Hz</div>
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Current</div>
          <div className="text-lg font-bold text-gray-900">{motorCurrent.toFixed(2)} A</div>
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Power</div>
          <div className="text-lg font-bold text-gray-900">{power.toFixed(0)} W</div>
        </div>
      </div>
    </div>
  );
}

