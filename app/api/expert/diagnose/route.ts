/**
 * POST /api/expert/diagnose
 * 
 * Placeholder endpoint for Expert System diagnosis
 * Uses rule-based logic to diagnose motor issues and provide recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Rule {
  id: string;
  condition: string;
  diagnosis: string;
  recommendation: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { motorId } = body;
    
    if (!motorId) {
      return NextResponse.json(
        { error: 'motorId is required' },
        { status: 400 }
      );
    }
    
    // Get latest sensor reading
    const latestReading = await prisma.sensorReading.findFirst({
      where: { motorId },
      orderBy: { timestamp: 'desc' },
    });
    
    if (!latestReading) {
      return NextResponse.json(
        { error: 'No sensor data available for this motor' },
        { status: 404 }
      );
    }
    
    // EXPERT SYSTEM RULES
    // In production: replace with proper rule engine (e.g., Drools, Nools)
    
    const matchedRules: Rule[] = [];
    
    // Rule 1: High vibration + High bearing temp → Bearing damage
    if (latestReading.vibrationRms > 4.5 && latestReading.bearingTemp > 85) {
      matchedRules.push({
        id: 'R001',
        condition: 'Vibration RMS > 4.5 mm/s AND Bearing Temp > 85°C',
        diagnosis: 'Kemungkinan besar terjadi kerusakan bearing',
        recommendation: 'Segera lakukan inspeksi dan penggantian bearing. Hentikan operasi motor.',
      });
    }
    
    // Rule 2: Low power factor + High current → Overload
    if (latestReading.powerFactor < 0.7 && latestReading.motorCurrent > 5.5) {
      matchedRules.push({
        id: 'R002',
        condition: 'Power Factor < 0.7 AND Motor Current > 5.5 A',
        diagnosis: 'Motor mengalami overload atau beban berlebih',
        recommendation: 'Kurangi beban motor. Periksa sistem transmisi dan coupling. Pertimbangkan power factor correction.',
      });
    }
    
    // Rule 3: High vibration + Normal temp → Misalignment/Unbalance
    if (latestReading.vibrationRms > 2.8 && latestReading.bearingTemp < 70 && latestReading.motorSurfaceTemp < 70) {
      matchedRules.push({
        id: 'R003',
        condition: 'Vibration RMS > 2.8 mm/s AND Temperatures Normal',
        diagnosis: 'Kemungkinan terjadi misalignment atau ketidakseimbangan rotor',
        recommendation: 'Lakukan alignment check. Periksa kondisi coupling. Balancing rotor jika diperlukan.',
      });
    }
    
    // Rule 4: High motor temp + Normal vibration → Ventilation/Cooling issue
    if (latestReading.motorSurfaceTemp > 85 && latestReading.vibrationRms < 2.8) {
      matchedRules.push({
        id: 'R004',
        condition: 'Motor Temp > 85°C AND Vibration Normal',
        diagnosis: 'Masalah pada sistem pendinginan atau ventilasi motor',
        recommendation: 'Bersihkan kipas motor dan saluran udara. Periksa kondisi thermal grease. Pastikan ventilasi ruangan memadai.',
      });
    }
    
    // Rule 5: High dust + High soiling loss → Maintenance needed
    if (latestReading.dustDensity > 100 && latestReading.soilingLossPercent > 5) {
      matchedRules.push({
        id: 'R005',
        condition: 'Dust Density > 100 µg/m³ AND Soiling Loss > 5%',
        diagnosis: 'Akumulasi debu yang tinggi menyebabkan penurunan efisiensi',
        recommendation: 'Lakukan pembersihan menyeluruh pada motor dan area sekitar. Pertimbangkan filter udara tambahan.',
      });
    }
    
    // Rule 6: Abnormal frequency → Grid issue
    if (latestReading.gridFrequency < 49.5 || latestReading.gridFrequency > 50.5) {
      matchedRules.push({
        id: 'R006',
        condition: 'Grid Frequency outside 49.5-50.5 Hz',
        diagnosis: 'Masalah pada grid listrik atau supply power',
        recommendation: 'Hubungi penyedia listrik. Pertimbangkan menggunakan UPS atau voltage stabilizer.',
      });
    }
    
    // Rule 7: Low power factor alone → Reactive power issue
    if (latestReading.powerFactor < 0.85 && latestReading.motorCurrent < 5.5) {
      matchedRules.push({
        id: 'R007',
        condition: 'Power Factor < 0.85 AND Normal Current',
        diagnosis: 'Power factor rendah, motor bekerja tidak efisien',
        recommendation: 'Pasang kapasitor bank untuk power factor correction. Periksa kondisi winding motor.',
      });
    }
    
    // Generate diagnosis summary
    let diagnosis = 'Motor dalam kondisi normal';
    let recommendation = 'Lanjutkan monitoring berkala';
    
    if (matchedRules.length > 0) {
      diagnosis = matchedRules.map(r => `[${r.id}] ${r.diagnosis}`).join('. ');
      recommendation = matchedRules.map((r, i) => `${i + 1}. ${r.recommendation}`).join('\n');
    }
    
    // Update health analysis if exists
    const latestHealth = await prisma.healthAnalysis.findFirst({
      where: { motorId },
      orderBy: { timestamp: 'desc' },
    });
    
    if (latestHealth) {
      await prisma.healthAnalysis.update({
        where: { id: latestHealth.id },
        data: {
          expertDiagnosis: diagnosis,
          expertRecommendation: recommendation,
          rawRulesMatched: JSON.stringify(matchedRules),
        },
      });
    } else {
      // Create new health analysis
      await prisma.healthAnalysis.create({
        data: {
          motorId,
          healthScoreMl: 85, // Dummy default
          healthCategory: 'Healthy',
          expertDiagnosis: diagnosis,
          expertRecommendation: recommendation,
          rawRulesMatched: JSON.stringify(matchedRules),
        },
      });
    }
    
    return NextResponse.json({
      success: true,
      diagnosis,
      recommendation,
      rulesMatched: matchedRules,
      timestamp: new Date().toISOString(),
      note: 'This is a placeholder expert system. In production, integrate with proper rule engine.',
    });
    
  } catch (error) {
    console.error('Error running expert diagnosis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

