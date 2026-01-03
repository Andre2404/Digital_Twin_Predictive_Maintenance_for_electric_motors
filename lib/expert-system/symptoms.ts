export interface Symptom {
  id: number;
  question: string;
  cfExpert: number;
}

export const symptoms: Symptom[] = [
  { id: 1, question: "Motor does not rotate", cfExpert: 1.0 },
  { id: 2, question: "Humming sound is heard", cfExpert: 0.6 },
  { id: 3, question: "Motor rotation is slow", cfExpert: 0.8 },
  { id: 4, question: "Motor heats up quickly", cfExpert: 0.7 },
  { id: 5, question: "Burning smell from motor", cfExpert: 1.0 },
  { id: 6, question: "MCB or fuse trips frequently", cfExpert: 0.9 },
  { id: 7, question: "Excessive vibration", cfExpert: 0.8 },
  { id: 8, question: "Rough or abnormal sound is heard", cfExpert: 1.0 },
  { id: 9, question: "Capacitor is swollen", cfExpert: 0.9 },
  { id: 10, question: "Motor is weak despite normal voltage", cfExpert: 1.0 }
];
