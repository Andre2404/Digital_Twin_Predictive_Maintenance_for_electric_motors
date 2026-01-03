// ==============================
// TYPE
// ==============================
export type Level = "A" | "B" | "C";

export interface DiagnosisItem {
  damageType: string;
  confidence: number; // CF 0–1
  level: Level;
}

export interface DiagnosisSummary {
  damageType: string;
  cfTotal: number;
  percent: number;
  level: Level;
  label: string;
}

// ==============================
// MAIN FUNCTION
// ==============================
export function calculateDiagnosisSummary(
  grouped: Map<string, DiagnosisItem[]>
): DiagnosisSummary | null {

  // ==============================
  // COMBINE CERTAINTY FACTOR
  // ==============================
  const combineCF = (values: number[]): number => {
    let cf = 0;
    for (const v of values) {
      cf = cf + v * (1 - cf);
    }
    return cf;
  };

  let best: DiagnosisSummary | null = null;

  // ==============================
  // PRIORITY LEVEL
  // ==============================
  const priority: Record<Level, number> = {
    A: 1, // ringan
    B: 2, // sedang
    C: 3, // berat
  };

  // ==============================
  // LOOP GROUPED DATA
  // ==============================
  grouped.forEach((list, damageType) => {
    if (list.length === 0) return; // ✅ FIX (bukan continue)

    const cfTotal = combineCF(list.map(i => i.confidence));

    // ==============================
    // DOMINANT LEVEL
    // ==============================
    const dominantItem = list.reduce(
      (prev, curr) =>
        priority[prev.level] >= priority[curr.level] ? prev : curr,
      list[0]
    );

    const dominantLevel = dominantItem.level;

    // ==============================
    // LABEL BERDASARKAN RANGE
    // ==============================
    const percent = cfTotal * 100;

    let label: string;
    if (percent <= 40) {
      label = "Ringan";
    } else if (percent <= 70) {
      label = "Sedang";
    } else {
      label = "Berat";
    }

    // ==============================
    // PICK BEST DIAGNOSIS
    // ==============================
    if (!best || cfTotal > best.cfTotal) {
      best = {
        damageType,
        cfTotal: Number(cfTotal.toFixed(3)),
        percent: Number(percent.toFixed(1)),
        level: dominantLevel,
        label,
      };
    }
  });

  return best;
}
