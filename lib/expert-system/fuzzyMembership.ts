//fuzzy level
export type FuzzyLevel = "No" | "Sometimes" | "Yes";

export function fuzzyLevelToValue(level: FuzzyLevel): number {
  switch (level) {
    case "No":
      return 0;
    case "Sometimes":
      return 0.5;
    case "Yes":
      return 1;
    default:
      return 0;
  }
}
