import { subDays } from "date-fns";
import { todayKey, toKey } from "./dates";
import { isOpenOn, feelingsFor } from "./logic";
import type { DayLog, Factor, Habit, Mood } from "./types";
import { FACTORS } from "./types";

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function unit(seed: string): number {
  return (hash(seed) % 1000) / 1000;
}

export function createDemoData(now = new Date()): {
  habits: Habit[];
  logs: Record<string, DayLog>;
} {
  const created = subDays(now, 400).toISOString();
  const habits: Habit[] = [
    {
      id: "h_walk",
      name: "Morning walk",
      icon: "footprints",
      color: "sage",
      frequency: { kind: "daily" },
      archived: false,
      createdAt: created,
      order: 0,
      partOfDay: "morning",
      kind: "check",
      target: 1,
      unit: "",
      polarity: "keep",
      paused: false,
    },
    {
      id: "h_read",
      name: "Read",
      icon: "book",
      color: "slate",
      frequency: { kind: "daily" },
      archived: false,
      createdAt: created,
      order: 1,
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
      order: 2,
      partOfDay: "any",
      kind: "count",
      target: 8,
      unit: "glasses",
      polarity: "keep",
      paused: false,
    },
    {
      id: "h_move",
      name: "Move the body",
      icon: "dumbbell",
      color: "clay",
      frequency: { kind: "times", count: 3 },
      archived: false,
      createdAt: created,
      order: 3,
      partOfDay: "afternoon",
      kind: "check",
      target: 1,
      unit: "",
      polarity: "keep",
      paused: false,
    },
    {
      id: "h_wind",
      name: "Wind down",
      icon: "moon",
      color: "stone",
      frequency: { kind: "daily" },
      archived: false,
      createdAt: created,
      order: 4,
      partOfDay: "evening",
      kind: "check",
      target: 1,
      unit: "",
      polarity: "keep",
      paused: false,
    },
    {
      id: "h_screens",
      name: "No late screens",
      icon: "moon",
      color: "ink",
      frequency: { kind: "daily" },
      archived: false,
      createdAt: created,
      order: 5,
      partOfDay: "evening",
      kind: "check",
      target: 1,
      unit: "",
      polarity: "avoid",
      paused: false,
    },
  ];

  const logs: Record<string, DayLog> = {};
  const today = todayKey(now);

  for (let i = 365; i >= 1; i--) {
    const date = subDays(now, i);
    const key = toKey(date);
    if (unit(`blank:${key}`) < 0.06) continue;

    const completed: Record<string, true> = {};
    const values: Record<string, number> = {};
    const skipped: Record<string, true> = {};
    let doneCount = 0;
    let dueCount = 0;

    for (const habit of habits) {
      if (!isOpenOn(habit, date, logs)) continue;
      dueCount += 1;
      if (unit(`skipday:${habit.id}:${key}`) < 0.06) {
        skipped[habit.id] = true;
        continue;
      }
      const chance =
        habit.id === "h_water" ? 0.88 : habit.id === "h_screens" ? 0.7 : 0.72;
      if (unit(`${habit.id}:${key}`) < chance) {
        completed[habit.id] = true;
        doneCount += 1;
        if (habit.kind === "count") {
          const extra = Math.floor(unit(`val:${habit.id}:${key}`) * 4);
          values[habit.id] = habit.target + extra;
        }
      } else if (habit.kind === "count") {
        values[habit.id] = Math.max(
          0,
          Math.floor(unit(`partial:${habit.id}:${key}`) * habit.target),
        );
      }
    }

    const ratio = dueCount === 0 ? 0.5 : doneCount / dueCount;
    let mood: Mood = 3;
    if (ratio >= 0.8) mood = unit(`mood:${key}`) < 0.35 ? 5 : 4;
    else if (ratio >= 0.5) mood = unit(`mood:${key}`) < 0.4 ? 4 : 3;
    else mood = unit(`mood:${key}`) < 0.5 ? 2 : 1;

    let energy: Mood = mood;
    const drift = unit(`energy:${key}`);
    if (drift < 0.22) energy = (Math.max(1, mood - 1) as Mood);
    else if (drift > 0.78) energy = (Math.min(5, mood + 1) as Mood);

    const words = feelingsFor(mood, energy);
    const feeling = words[hash(`feel:${key}`) % words.length];

    const factors: Factor[] = FACTORS.filter(
      (f) => unit(`factor:${f}:${key}`) < 0.28,
    );

    const note =
      unit(`note:${key}`) < 0.08
        ? sampleNotes[hash(`note:${key}`) % sampleNotes.length]
        : "";

    logs[key] = { date: key, mood, energy, feeling, factors, note, completed, values, skipped };
  }

  const todayCompleted: Record<string, true> = {};
  const todayValues: Record<string, number> = {};
  if (unit(`today:walk:${today}`) < 0.9) todayCompleted.h_walk = true;
  if (unit(`today:water:${today}`) < 0.85) {
    todayCompleted.h_water = true;
    todayValues.h_water = 8;
  } else {
    todayValues.h_water = 5;
  }
  todayValues.h_read = 8;
  if (unit(`today:screens:${today}`) < 0.55) todayCompleted.h_screens = true;

  logs[today] = {
    date: today,
    mood: undefined,
    energy: undefined,
    feeling: undefined,
    factors: [],
    note: "",
    completed: todayCompleted,
    values: todayValues,
    skipped: {},
  };

  return { habits, logs };
}

const sampleNotes = [
  "Quiet morning. Walked further than planned.",
  "Work ran long. Still made time to read.",
  "Slept poorly, but the walk helped.",
  "A clean, ordinary day. That is enough.",
  "Rain. Stayed inside and read instead of walking.",
  "Felt scattered until the evening wind-down.",
];
