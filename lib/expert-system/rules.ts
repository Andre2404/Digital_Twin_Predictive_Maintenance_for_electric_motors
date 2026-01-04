//membuat rule based on expert knowledge
export type DamageLevel = "A" | "B" | "C";

export interface Rule {
  id: string;
  symptoms: number[];
  operator: "OR";
  damageType: string;
  level: DamageLevel;
  damage: string;
  solution: string;
}

export const rules: Rule[] = [
  {
    id: "R1",
    symptoms: [1],
    operator: "OR",
    damageType: "A",
    level: "A",
    damage: "Damage to capacitor/winding/power supply. Motor does not produce initial torque due to capacitor damage, broken start winding, or no power supply to the motor.",
    solution: "Check the start capacitor condition, verify winding continuity, and measure supply voltage. Replace capacitor if burned or damaged. Quick repair and thorough inspection are essential for normal motor operation."
  },
  {
    id: "R2",
    symptoms: [2],
    operator: "OR",
    damageType: "B",
    level: "B",
    damage: "Damage to power supply/capacitor. Motor fails to start despite current flowing, due to decreased capacitor value or capacitor damage.",
    solution: "Replace capacitor according to specified specifications. After replacement, test the motor to ensure the issue is resolved and motor functions normally. This repair should be done immediately."
  },
  {
    id: "R3",
    symptoms: [3],
    operator: "OR",
    damageType: "C",
    level: "A",
    damage: "Damage to winding. Motor torque is not optimal due to voltage drop or weakened capacitor.",
    solution: "Check power source and ensure voltage matches motor specifications. If voltage drop occurs, repair or replace with a stable power source. Also inspect sensors and control circuits for detection errors. Replace capacitor according to specifications. This repair should be done immediately."
  },
  {
    id: "R4",
    symptoms: [4],
    operator: "OR",
    damageType: "D",
    level: "B",
    damage: "Burned winding damage. Excessive current in coil due to overload or short winding.",
    solution: "Turn off motor and perform visual inspection of winding to detect physical damage such as burns or breaks. Reduce motor workload and perform rewinding if necessary. This repair should be done immediately."
  },
  {
    id: "R5",
    symptoms: [5],
    operator: "OR",
    damageType: "E",
    level: "C",
    damage: "Burned winding damage. Winding burned due to damaged wire insulation from excessive heat, caused by short circuit or cooling fan damage.",
    solution: "Check the root cause such as overheating or overvoltage to prevent recurrence. Perform rewinding on damaged winding and inspect cooling fan to ensure proper cooling system function. Quick repair and thorough inspection are essential."
  },
  {
    id: "R6",
    symptoms: [6],
    operator: "OR",
    damageType: "F",
    level: "B",
    damage: "Electrical (supply) damage. Electrical protection activated due to excessive current, caused by short circuit or overload.",
    solution: "Check input voltage and current, ensure they match specifications, repair or fix problematic installation or power source. This repair should be done immediately."
  },
  {
    id: "R7",
    symptoms: [7],
    operator: "OR",
    damageType: "G",
    level: "B",
    damage: "Bearing damage. Motor rotation is unbalanced due to misaligned bearing, wear, or lack of lubrication.",
    solution: "Replace damaged bearing, inspect related components to prevent recurring damage, perform alignment and greasing. This repair should be done immediately."
  },
  {
    id: "R8",
    symptoms: [8],
    operator: "OR",
    damageType: "H",
    level: "C",
    damage: "Mechanical damage. Excessive mechanical friction due to misaligned or worn mechanical components.",
    solution: "Inspect motor components, especially moving parts, and perform adjustment or replacement if necessary. This repair should be done immediately."
  },
  {
    id: "R9",
    symptoms: [9],
    operator: "OR",
    damageType: "I",
    level: "C",
    damage: "Capacitor damage. Physical damage to capacitor due to overvoltage or capacitor aging.",
    solution: "Replace capacitor according to specified specifications. After replacement, test the motor to ensure the issue is resolved and motor functions normally. Quick repair and thorough inspection are essential."
  },
  {
    id: "R10",
    symptoms: [10],
    operator: "OR",
    damageType: "J",
    level: "B",
    damage: "Capacitor/winding damage. Decreased motor efficiency due to reduced capacitor value or weakened winding coil.",
    solution: "Measure capacitor value and winding resistance to ensure both are still within specifications. Replace capacitor or repair winding if measurements are abnormal. This repair should be done immediately."
  }
];
