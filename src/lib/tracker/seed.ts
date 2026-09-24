import type { DayLog, Habit } from "./types";

/** A blank tracker: two count habits, no invented history. */
export function createBlankData(now = new Date()): {
  habits: Habit[];
  logs: Record<string, DayLog>;
} {
  const created = now.toISOString();
  const habits: Habit[] = [
    {
      id: "h_read",
      name: "Read",
      icon: "book",
      color: "slate",
      frequency: { kind: "daily" },
      archived: false,
      createdAt: created,
      order: 0,
      partOfDay: "evening",
      kind: "count",
      target: 20,
      unit: "pages",
      polarity: "keep",
      paused: false,
    },
    {
      id: "h_water",
      name: "Water",
      icon: "droplets",
      color: "mist",
      frequency: { kind: "daily" },
      archived: false,
      createdAt: created,
      order: 1,
      partOfDay: "any",
      kind: "count",
      target: 8,
      unit: "glasses",
      polarity: "keep",
      paused: false,
    },
  ];
  return { habits, logs: {} };
}
