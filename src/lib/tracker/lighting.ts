export type LightPhase = "still" | "morning" | "day" | "vesper" | "night";

export function lightPhase(now = new Date()): LightPhase {
  const hour = now.getHours();
  if (hour < 5) return "still";
  if (hour < 11) return "morning";
  if (hour < 16) return "day";
  if (hour < 21) return "vesper";
  return "night";
}
