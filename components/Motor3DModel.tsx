'use client';

import { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { getStatusColor } from '@/lib/thresholds';

interface Motor3DModelProps {
  // Sensor data
  gridVoltage?: number;
  motorCurrent?: number;
  motorSurfaceTemp?: number;
  bearingTemp?: number;
  vibrationRms?: number;
  power?: number;
  powerFactor?: number;
  gridFrequency?: number;
  dustDensity?: number;
  healthScore?: number;
}

/**
 * 3D Motor Model Component with Sensor-based Visual Diagnostics
 * 
 * Visual feedback berdasarkan sensor:
 * - Temperature tinggi → Warna merah (seperti terbakar)
 * - Voltage tinggi → Warna merah/orange
 * - Vibration tinggi → Motor bergetar
 * - Current tinggi → Glow effect biru
 * - Power factor rendah → Flicker effect
 * - Frequency abnormal → Slow motion
 * - Dust tinggi → Opacity berkurang
 * - Bearing temp tinggi → Bearing merah
 */
function MotorModel({
  gridVoltage = 220,
  motorCurrent = 0,
  motorSurfaceTemp = 25,
  bearingTemp = 25,
  vibrationRms = 0,
  power = 0,
  powerFactor = 1,
  gridFrequency = 50,
  dustDensity = 0,
  healthScore = 100,
}: Motor3DModelProps) {
  const gltf = useGLTF('/models/Motor.glb');
  const scene = gltf.scene;
  const motorRef = useRef<THREE.Group>(null);
  const vibrationGroupRef = useRef<THREE.Group>(null);
  const sceneRef = useRef<THREE.Group | null>(null);

  // Log when scene is loaded
  useEffect(() => {
    if (scene) {
      console.log('✅ GLB model loaded successfully');
      console.log('Scene children:', scene.children.length);
    }
  }, [scene]);

  // Calculate visual parameters based on sensor data
  const tempStatus = getStatusColor(motorSurfaceTemp, 'motorSurfaceTemp');
  const voltageStatus = getStatusColor(gridVoltage, 'gridVoltage');
  const vibrationStatus = getStatusColor(vibrationRms, 'vibrationRms');
  const currentStatus = getStatusColor(motorCurrent, 'motorCurrent');
  const bearingStatus = getStatusColor(bearingTemp, 'bearingTemp');
  const dustStatus = getStatusColor(dustDensity, 'dustDensity');

  // Calculate RPM from frequency
  const rpm = (120 * gridFrequency) / 4; // 4-pole motor
  const rotationSpeed = rpm / 60; // rotations per second

  // Color mapping - Berubah warna berdasarkan suhu: Biru (dingin) → Biru metalik (normal) → Merah (panas)
  const getMotorColor = (): THREE.Color => {
    // Base color: Biru metalik industrial (seperti motor industri pada umumnya)
    // RGB: (0.2, 0.35, 0.5) = Biru metalik gelap yang elegan
    
    // Burning effect untuk suhu tinggi (> 85°C atau critical)
    if (motorSurfaceTemp > 85 || tempStatus.level === 'critical') {
      // Burning effect - Merah terang seperti terbakar
      return new THREE.Color(0.9, 0.2, 0.1); // Bright red - burning effect
    } else if (motorSurfaceTemp > 70 || tempStatus.level === 'warning') {
      // Warning - Orange/merah untuk suhu tinggi
      return new THREE.Color(0.8, 0.4, 0.1); // Orange-red
    } else if (motorSurfaceTemp < 40) {
      // Dingin - Biru terang kebiruan (cool blue)
      const coldIntensity = Math.max(0, (40 - motorSurfaceTemp) / 40); // 0-1 based on how cold
      return new THREE.Color(
        0.1 + (coldIntensity * 0.2),  // R: lebih terang saat lebih dingin
        0.3 + (coldIntensity * 0.3),  // G: lebih terang
        0.6 + (coldIntensity * 0.3)   // B: dominan biru terang
      );
    } else if (voltageStatus.level === 'critical') {
      // Voltage critical - sedikit kemerahan pada biru
      return new THREE.Color(0.4, 0.3, 0.4); // Purple-red tint
    } else if (voltageStatus.level === 'warning') {
      // Voltage warning - sedikit orange pada biru
      return new THREE.Color(0.35, 0.4, 0.45); // Blue with orange tint
    } else {
      // Normal (40-70°C) - Biru navy gelap metalik (elegan & profesional)
      // Warna seperti motor industri premium: Biru navy dengan efek metalik
      return new THREE.Color(0.15, 0.25, 0.4); // Navy blue metallic - elegan
    }
  };

  // Check if motor is burning (high temperature)
  const isBurning = motorSurfaceTemp > 85 || tempStatus.level === 'critical';
  
  // Check if motor is cold (low temperature)
  const isCold = motorSurfaceTemp < 40;

  // Vibration intensity (0-1) - Sesuai dengan threshold RMS
  // Threshold: Normal < 2.8, Warning 2.8-4.5, Critical > 4.5 mm/s
  let vibrationIntensity = 0;
  if (vibrationRms >= 2.8 && vibrationRms <= 4.5) {
    // Warning range: map 2.8-4.5 to 0.3-0.7
    vibrationIntensity = 0.3 + ((vibrationRms - 2.8) / (4.5 - 2.8)) * 0.4;
  } else if (vibrationRms > 4.5) {
    // Critical range: map 4.5+ to 0.7-1.0 (dengan maksimal pada 10 mm/s)
    const criticalRange = Math.min(vibrationRms, 10) - 4.5;
    vibrationIntensity = 0.7 + (criticalRange / (10 - 4.5)) * 0.3;
    vibrationIntensity = Math.min(vibrationIntensity, 1.0);
  }
  // Normal range (< 2.8): vibrationIntensity tetap 0
  
  const shouldVibrate = vibrationStatus.level !== 'normal' && vibrationRms >= 2.8;

  // Current glow intensity
  const currentIntensity = Math.min(motorCurrent / 10, 1);
  const shouldGlow = currentStatus.level !== 'normal' && motorCurrent > 4;

  // Power factor flicker
  const shouldFlicker = powerFactor < 0.85;

  // Frequency-based speed multiplier
  const speedMultiplier = gridFrequency >= 49.5 && gridFrequency <= 50.5 ? 1 : 0.5; // Slow motion if abnormal

  // Dust opacity
  const dustOpacity = Math.max(0.3, 1 - (dustDensity / 200));

  // Apply material changes
  useEffect(() => {
    if (!motorRef.current || !scene) {
      console.warn('Motor ref or scene not ready');
      return;
    }

    // Clone scene once
    if (!sceneRef.current) {
      try {
        sceneRef.current = scene.clone();
        
        // Calculate bounding box to center and scale model
        const box = new THREE.Box3().setFromObject(sceneRef.current);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = (20 / 9) / maxDim; // Scale diperkecil 1.5x lipat (dari 10/3 menjadi 20/9 ≈ 2.22)
        
        sceneRef.current.scale.multiplyScalar(scale);
        sceneRef.current.position.sub(center.multiplyScalar(scale));
        
        motorRef.current.add(sceneRef.current);
        console.log('✅ Motor model added to scene');
        console.log('Model size:', size);
        console.log('Model center:', center);
        console.log('Scale applied:', scale);
      } catch (error) {
        console.error('❌ Error cloning/adding scene:', error);
      }
    }

    if (!sceneRef.current) return;
    
    const motorColor = getMotorColor();
    
    sceneRef.current.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        // Apply color to motor body
        if (child.material instanceof THREE.MeshStandardMaterial) {
          child.material.color.copy(motorColor);
          
          // Burning effect - Emissive glow merah/orange untuk suhu tinggi
          if (isBurning) {
            const burnIntensity = Math.min((motorSurfaceTemp - 70) / 30, 1); // 0-1 based on temp
            child.material.emissive = new THREE.Color(0.8, 0.2, 0.1); // Red glow
            child.material.emissiveIntensity = 0.3 + (burnIntensity * 0.4); // 0.3-0.7 intensity
          } 
          // Cold effect - Emissive glow biru untuk suhu dingin
          else if (isCold) {
            const coldIntensity = Math.max(0, (40 - motorSurfaceTemp) / 40); // 0-1 based on how cold
            child.material.emissive = new THREE.Color(0.1, 0.3, 0.6); // Blue glow
            child.material.emissiveIntensity = 0.1 + (coldIntensity * 0.2); // 0.1-0.3 intensity
          }
          // Add emissive glow for high current (blue)
          else if (shouldGlow) {
            child.material.emissive = new THREE.Color(0.2, 0.4, 0.8);
            child.material.emissiveIntensity = currentIntensity * 0.5;
          } else {
            child.material.emissive = new THREE.Color(0, 0, 0);
            child.material.emissiveIntensity = 0;
          }

          // Apply opacity for dust
          child.material.opacity = dustOpacity;
          child.material.transparent = dustStatus.level !== 'normal';

          // Make material metallic (biru metalik industrial)
          if (isBurning) {
            // Saat burning, material lebih glossy dan panas
            child.material.metalness = 0.95; // Very high metallic saat panas
            child.material.roughness = 0.1; // Very smooth/glossy
          } else if (isCold) {
            // Saat dingin, material lebih glossy dengan efek biru
            child.material.metalness = 0.85; // High metallic
            child.material.roughness = 0.15; // Smooth untuk efek biru metalik
          } else {
            // Normal - Biru metalik industrial
            child.material.metalness = 0.85; // High metallic untuk efek biru metalik
            child.material.roughness = 0.18; // Smooth untuk efek industrial
          }
        }
      }

      // Highlight bearing if bearing temp is high
      if (child.name.toLowerCase().includes('bearing')) {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          if (bearingStatus.level === 'critical') {
            child.material.color = new THREE.Color(0.9, 0.1, 0.1); // Red bearing
            child.material.emissive = new THREE.Color(0.3, 0, 0);
            child.material.emissiveIntensity = 0.3;
          } else if (bearingStatus.level === 'warning') {
            child.material.color = new THREE.Color(0.9, 0.6, 0.1); // Orange bearing
          }
        }
      }
    });

  }, [
    motorSurfaceTemp,
    gridVoltage,
    motorCurrent,
    bearingTemp,
    dustDensity,
    vibrationRms,
    powerFactor,
    gridFrequency,
    tempStatus.level,
    voltageStatus.level,
    currentStatus.level,
    bearingStatus.level,
    dustStatus.level,
    shouldGlow,
    currentIntensity,
    dustOpacity,
    isBurning,
    isCold,
    scene,
  ]);

  // Animation frame - Update realtime berdasarkan sensor data
  useFrame((state, delta) => {
    if (!motorRef.current || !vibrationGroupRef.current) return;

    // Recalculate values setiap frame untuk realtime update
    const currentRpm = (120 * gridFrequency) / 4;
    const currentRotationSpeed = currentRpm / 60;
    const currentSpeedMultiplier = gridFrequency >= 49.5 && gridFrequency <= 50.5 ? 1 : 0.5;
    
    // Recalculate burning status setiap frame
    const currentIsBurning = motorSurfaceTemp > 85 || tempStatus.level === 'critical';
    
    // Rotor rotation based on frequency (realtime)
    const rotationDelta = (currentRotationSpeed * currentSpeedMultiplier * delta * Math.PI * 2) / 60;
    motorRef.current.rotation.y += rotationDelta;

    // Vibration animation - Proporsional dengan nilai RMS
    if (shouldVibrate && vibrationGroupRef.current) {
      const time = state.clock.elapsedTime;
      
      // Amplitudo getaran proporsional dengan intensitas dan nilai RMS
      // Warning (2.8-4.5): amplitudo 0.03-0.06
      // Critical (> 4.5): amplitudo 0.06-0.12
      const baseAmplitude = vibrationStatus.level === 'critical' ? 0.08 : 0.04;
      const vibrateAmount = baseAmplitude * vibrationIntensity;
      
      // Frekuensi getaran lebih realistis (tidak terlalu cepat)
      // Menggunakan frekuensi yang proporsional dengan RMS, tapi tidak terlalu ekstrem
      const vibrationFrequency = 2 + (vibrationRms * 0.5); // Range: 2-7 Hz untuk RMS 0-10
      
      // Getaran multi-axis dengan frekuensi berbeda untuk efek lebih natural
      vibrationGroupRef.current.position.x = Math.sin(time * vibrationFrequency * 2) * vibrateAmount;
      vibrationGroupRef.current.position.y = Math.cos(time * vibrationFrequency * 1.5) * vibrateAmount;
      vibrationGroupRef.current.position.z = Math.sin(time * vibrationFrequency * 1.8) * vibrateAmount * 0.6;
    } else if (vibrationGroupRef.current) {
      // Smooth return to center saat tidak bergetar
      vibrationGroupRef.current.position.lerp(new THREE.Vector3(0, 0, 0), 0.15);
    }

    // Power factor flicker
    if (shouldFlicker && motorRef.current) {
      const flicker = Math.sin(state.clock.elapsedTime * 10) * 0.1 + 0.9;
      motorRef.current.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          child.material.opacity = dustOpacity * flicker;
        }
      });
    }

    // Burning effect animation - Pulsating glow untuk suhu tinggi (realtime)
    if (currentIsBurning && sceneRef.current) {
      const time = state.clock.elapsedTime;
      const pulseIntensity = Math.sin(time * 3) * 0.15 + 0.85; // Pulse antara 0.7-1.0
      const burnIntensity = Math.min((motorSurfaceTemp - 70) / 30, 1);
      
      sceneRef.current.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          // Pulsating emissive intensity untuk burning effect
          child.material.emissiveIntensity = (0.3 + (burnIntensity * 0.4)) * pulseIntensity;
          
          // Slight color variation untuk efek panas (realtime update)
          const heatVariation = Math.sin(time * 2) * 0.1;
          child.material.color.r = Math.min(0.95, 0.9 + heatVariation);
          child.material.color.g = Math.max(0.1, 0.2 - heatVariation * 0.5);
          child.material.color.b = Math.max(0.05, 0.1 - heatVariation * 0.3);
        }
      });
    }

    // Cold effect animation - Subtle blue glow untuk suhu dingin (realtime)
    const currentIsCold = motorSurfaceTemp < 40;
    if (currentIsCold && sceneRef.current) {
      const time = state.clock.elapsedTime;
      const coldIntensity = Math.max(0, (40 - motorSurfaceTemp) / 40);
      const subtlePulse = Math.sin(time * 1.5) * 0.05 + 0.95; // Subtle pulse
      
      sceneRef.current.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          // Subtle pulsating blue glow untuk cold effect
          child.material.emissiveIntensity = (0.1 + (coldIntensity * 0.2)) * subtlePulse;
        }
      });
    }
  });

  return (
    <group ref={vibrationGroupRef}>
      <group ref={motorRef} position={[0, 0, 0]} />
    </group>
  );
}

/**
 * Main 3D Motor Visualization Component
 */
export function Motor3DModel(props: Motor3DModelProps) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">3D Motor Visualization</h2>
        <div className="text-sm text-gray-600">
          Health Score: <span className="font-bold">{props.healthScore ? props.healthScore.toFixed(0) : '100'}</span>
        </div>
      </div>

      <div className="w-full h-[500px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden">
        <Canvas
          camera={{ position: [1.5, 1.5, 1.5], fov: 50 }}
          shadows
          gl={{ antialias: true }}
          onCreated={(state) => {
            console.log('Canvas created:', state);
          }}
        >
          <Suspense fallback={null}>
            {/* Lighting */}
            <ambientLight intensity={0.5} />
            <directionalLight
              position={[10, 10, 5]}
              intensity={1}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
            <pointLight position={[-10, -10, -5]} intensity={0.5} />

            {/* Motor Model */}
            <MotorModel {...props} />

            {/* Environment */}
            <Environment preset="warehouse" />

            {/* Contact Shadows */}
            <ContactShadows
              position={[0, -2, 0]}
              opacity={0.4}
              scale={10}
              blur={2.5}
              far={4}
            />

            {/* Controls */}
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={3}
              maxDistance={15}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Sensor Status Legend */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor:
                getStatusColor(props.motorSurfaceTemp || 25, 'motorSurfaceTemp').level === 'critical'
                  ? '#ef4444'
                  : getStatusColor(props.motorSurfaceTemp || 25, 'motorSurfaceTemp').level === 'warning'
                  ? '#f59e0b'
                  : '#10b981',
            }}
          />
          <span>Temp: {props.motorSurfaceTemp?.toFixed(1)}°C</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor:
                getStatusColor(props.vibrationRms || 0, 'vibrationRms').level === 'critical'
                  ? '#ef4444'
                  : getStatusColor(props.vibrationRms || 0, 'vibrationRms').level === 'warning'
                  ? '#f59e0b'
                  : '#10b981',
            }}
          />
          <span>Vibration: {props.vibrationRms?.toFixed(2)} mm/s</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor:
                getStatusColor(props.gridVoltage || 220, 'gridVoltage').level === 'critical'
                  ? '#ef4444'
                  : getStatusColor(props.gridVoltage || 220, 'gridVoltage').level === 'warning'
                  ? '#f59e0b'
                  : '#10b981',
            }}
          />
          <span>Voltage: {props.gridVoltage?.toFixed(1)}V</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor:
                getStatusColor(props.motorCurrent || 0, 'motorCurrent').level === 'critical'
                  ? '#ef4444'
                  : getStatusColor(props.motorCurrent || 0, 'motorCurrent').level === 'warning'
                  ? '#f59e0b'
                  : '#10b981',
            }}
          />
          <span>Current: {props.motorCurrent?.toFixed(2)}A</span>
        </div>
      </div>

      {/* Visual Feedback Info */}
      <div className="mt-3 p-3 bg-blue-50 rounded-lg text-xs text-gray-700">
        <p className="font-semibold mb-1">Visual Diagnostics:</p>
        <ul className="list-disc list-inside space-y-1">
          {props.motorSurfaceTemp != null && props.motorSurfaceTemp > 85 && (
            <li className="text-red-600 font-semibold">BURNING EFFECT ACTIVE - Motor temperature critical ({props.motorSurfaceTemp.toFixed(1)}°C) - Red color</li>
          )}
          {props.motorSurfaceTemp != null && getStatusColor(props.motorSurfaceTemp, 'motorSurfaceTemp').level === 'warning' && props.motorSurfaceTemp <= 85 && (
            <li>High temperature - Orange/red color</li>
          )}
          {props.motorSurfaceTemp != null && props.motorSurfaceTemp < 40 && (
            <li className="text-blue-600 font-semibold">COLD EFFECT ACTIVE - Motor temperature low ({props.motorSurfaceTemp.toFixed(1)}°C) - Blue color</li>
          )}
          {props.motorSurfaceTemp != null && props.motorSurfaceTemp >= 40 && props.motorSurfaceTemp <= 70 && (
            <li>Normal temperature - Industrial blue metallic color</li>
          )}
          {props.vibrationRms != null && getStatusColor(props.vibrationRms, 'vibrationRms').level !== 'normal' && (
            <li>High vibration - Motor shaking</li>
          )}
          {props.gridVoltage != null && getStatusColor(props.gridVoltage, 'gridVoltage').level !== 'normal' && (
            <li>Voltage abnormal - Color change</li>
          )}
          {props.motorCurrent != null && getStatusColor(props.motorCurrent, 'motorCurrent').level !== 'normal' && (
            <li>High current - Blue glow effect</li>
          )}
          {props.powerFactor != null && props.powerFactor < 0.85 && (
            <li>Low power factor - Flicker effect</li>
          )}
          {props.gridFrequency != null && (props.gridFrequency < 49.5 || props.gridFrequency > 50.5) && (
            <li>Abnormal frequency - Slow motion</li>
          )}
          {props.dustDensity != null && getStatusColor(props.dustDensity, 'dustDensity').level !== 'normal' && (
            <li>High dust - Reduced opacity</li>
          )}
          {props.bearingTemp != null && getStatusColor(props.bearingTemp, 'bearingTemp').level !== 'normal' && (
            <li>High bearing temp - Bearing highlighted</li>
          )}
        </ul>
      </div>
    </div>
  );
}

