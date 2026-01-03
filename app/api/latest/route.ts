/**
 * GET /api/latest?motorId=xxx
 * 
 * Returns the latest sensor reading and active alerts for a motor
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering since we use searchParams
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const motorId = searchParams.get('motorId');
    
    if (!motorId) {
      return NextResponse.json(
        { error: 'motorId query parameter is required' },
        { status: 400 }
      );
    }
    
    // Get motor info
    const motor = await prisma.motor.findUnique({
      where: { id: motorId },
    });
    
    if (!motor) {
      return NextResponse.json(
        { error: 'Motor not found' },
        { status: 404 }
      );
    }
    
    // Get latest sensor reading
    const latestReading = await prisma.sensorReading.findFirst({
      where: { motorId },
      orderBy: { timestamp: 'desc' },
    });
    
    // Get recent readings for sparkline (last 20)
    const recentReadings = await prisma.sensorReading.findMany({
      where: { motorId },
      orderBy: { timestamp: 'desc' },
      take: 20,
    });
    
    // Get active alerts
    const activeAlerts = await prisma.alert.findMany({
      where: {
        motorId,
        status: 'OPEN',
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });
    
    // Get latest health analysis
    const latestHealth = await prisma.healthAnalysis.findFirst({
      where: { motorId },
      orderBy: { timestamp: 'desc' },
    });
    
    return NextResponse.json({
      motor,
      latestReading,
      recentReadings: recentReadings.reverse(), // Oldest to newest for chart
      activeAlerts,
      latestHealth,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error fetching latest data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

