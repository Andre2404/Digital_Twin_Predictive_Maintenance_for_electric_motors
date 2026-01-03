// lib/expert-system/fuzzyEngine.ts

import { FuzzyLevel, fuzzyLevelToValue } from './fuzzyMembership';
import { rules } from './rules';

export interface FuzzyCriteria {
  symptomId: number;
  confidenceLevel: FuzzyLevel;
}

export interface FuzzyDiagnosisResult {
  level: "A" | "B" | "C";
  damage: string;
  solution: string;
  fuzzyConfidence: number; // 0.0 - 1.0
  matchedCriteria: number[];
}

/**
 * Fuzzy Inference Engine
 * Menggunakan metode Mamdani dengan MIN operator untuk AND dan MAX untuk OR
 */
export function fuzzyDiagnose(criteria: FuzzyCriteria[]): FuzzyDiagnosisResult[] {
  const results: FuzzyDiagnosisResult[] = [];

  // Konversi fuzzy level ke nilai numerik
  const criteriaValues = new Map<number, number>();
  criteria.forEach(c => {
    criteriaValues.set(c.symptomId, fuzzyLevelToValue(c.confidenceLevel));
  });

  // Evaluasi setiap rule
  for (const rule of rules) {
    let ruleActivation = 0; // Tingkat aktivasi rule (fuzzy confidence)

    if (rule.operator === "OR") {
      // Untuk AND: semua gejala harus ada, gunakan MIN (ambil nilai terkecil)
      const symptomIdsInCriteria = criteria.map(c => c.symptomId);
      const allSymptomsPresent = rule.symptoms.every(id => symptomIdsInCriteria.includes(id));
      
      if (allSymptomsPresent) {
        const activations = rule.symptoms
          .map(symptomId => criteriaValues.get(symptomId) || 0)
          .filter(val => val > 0);

        if (activations.length === rule.symptoms.length) {
          ruleActivation = Math.min(...activations);
        }
      }
    } else {
      // Untuk single symptom: gunakan nilai langsung jika ada di criteria
      const symptomIdsInCriteria = criteria.map(c => c.symptomId);
      if (symptomIdsInCriteria.includes(rule.symptoms[0])) {
        ruleActivation = criteriaValues.get(rule.symptoms[0]) || 0;
      }
    }

    // Jika rule teraktivasi (confidence > 0)
    if (ruleActivation > 0) {
      results.push({
        level: rule.level,
        damage: rule.damage,
        solution: rule.solution,
        fuzzyConfidence: Number(ruleActivation.toFixed(3)),
        matchedCriteria: rule.symptoms,
      });
    }
  }

  // Urutkan berdasarkan confidence tertinggi
  results.sort((a, b) => b.fuzzyConfidence - a.fuzzyConfidence);

  return results;
}

/**
 * Defuzzifikasi menggunakan metode centroid (weighted average)
 */
export function defuzzify(results: FuzzyDiagnosisResult[]): number {
  if (results.length === 0) return 0;

  // Hitung weighted average dari confidence values
  const totalWeight = results.reduce((sum, r) => sum + r.fuzzyConfidence, 0);
  if (totalWeight === 0) return 0;

  // Beri bobot berbeda berdasarkan level kerusakan
  const levelWeights: Record<"A" | "B" | "C", number> = {
    A: 0.3, // Ringan
    B: 0.5, // Sedang
    C: 0.8, // Berat
  };

  const weightedSum = results.reduce((sum, r) => {
    const levelWeight = levelWeights[r.level];
    return sum + (r.fuzzyConfidence * levelWeight);
  }, 0);

  return Number((weightedSum / totalWeight).toFixed(3));
}

