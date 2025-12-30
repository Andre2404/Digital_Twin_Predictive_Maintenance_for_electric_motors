/**
 * POST /api/ingest
 * 
 * Endpoint for ESP32 to send sensor data
 * Validates payload, saves to database, and generates alerts if needed
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { shouldAlert, getAlertSeverity, PARAMETER_CONFIG } from '@/lib/thresholds';

// Helper function to safely parse float values
function safeParseFloat(value: any, defaultValue: number = 0): number {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const {
      motorId,
      gridVoltage,
      motorCurrent,
      powerConsumption,
      powerFactor,
      dailyEnergyKwh,
      gridFrequency,
      vibrationRms,
      rotorUnbalanceScore,
      bearingHealthScore,
      motorSurfaceTemp,
      bearingTemp,
      dustDensity,
      soilingLossPercent,
    } = body;
    
    if (!motorId) {
      return NextResponse.json(
        { error: 'motorId is required' },
        { status: 400 }
      );
    }
    
    // Check if motor exists
    const motor = await prisma.motor.findUnique({
      where: { id: motorId },
    });
    
    if (!motor) {
      return NextResponse.json(
        { error: 'Motor not found' },
        { status: 404 }
      );
    }
    
    // Create sensor reading with safe parsing
    const reading = await prisma.sensorReading.create({
      data: {
        motorId,
        gridVoltage: safeParseFloat(gridVoltage),
        motorCurrent: safeParseFloat(motorCurrent),
        powerConsumption: safeParseFloat(powerConsumption),
        powerFactor: safeParseFloat(powerFactor),
        dailyEnergyKwh: safeParseFloat(dailyEnergyKwh),
        gridFrequency: safeParseFloat(gridFrequency),
        vibrationRms: safeParseFloat(vibrationRms),
        faultFrequency: body.faultFrequency ? safeParseFloat(body.faultFrequency) : null,
        rotorUnbalanceScore: safeParseFloat(rotorUnbalanceScore),
        bearingHealthScore: safeParseFloat(bearingHealthScore),
        motorSurfaceTemp: safeParseFloat(motorSurfaceTemp),
        thermalAnomalyIndex: body.thermalAnomalyIndex ? safeParseFloat(body.thermalAnomalyIndex) : null,
        panelTemp: body.panelTemp ? safeParseFloat(body.panelTemp) : null,
        bearingTemp: safeParseFloat(bearingTemp),
        dustDensity: safeParseFloat(dustDensity),
        soilingLossPercent: safeParseFloat(soilingLossPercent),
        rawPayload: JSON.stringify(body),
      },
    });
    
    // Check thresholds and create alerts
    const alerts = [];
    const parameters = [
      { type: 'gridVoltage' as const, value: safeParseFloat(gridVoltage) },
      { type: 'motorCurrent' as const, value: safeParseFloat(motorCurrent) },
      { type: 'powerFactor' as const, value: safeParseFloat(powerFactor) },
      { type: 'gridFrequency' as const, value: safeParseFloat(gridFrequency) },
      { type: 'motorSurfaceTemp' as const, value: safeParseFloat(motorSurfaceTemp) },
      { type: 'bearingTemp' as const, value: safeParseFloat(bearingTemp) },
      { type: 'dustDensity' as const, value: safeParseFloat(dustDensity) },
      { type: 'vibrationRms' as const, value: safeParseFloat(vibrationRms) },
    ];
    
    for (const param of parameters) {
      if (shouldAlert(param.value, param.type)) {
        const severity = getAlertSeverity(param.value, param.type);
        if (severity) {
          const alert = await prisma.alert.create({
            data: {
              motorId,
              severity,
              parameter: param.type,
              value: param.value,
              message: `${PARAMETER_CONFIG[param.type].label} ${severity === 'CRITICAL' ? 'melampaui' : 'mendekati'} batas aman: ${param.value} ${PARAMETER_CONFIG[param.type].unit}`,
              status: 'OPEN',
            },
          });
          alerts.push(alert);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      readingId: reading.id,
      alertsGenerated: alerts.length,
      alerts,
    });
    
  } catch (error) {
    console.error('Error ingesting sensor data:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

