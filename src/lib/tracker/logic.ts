import { addDays, format, startOfDay, startOfWeek, subDays } from "date-fns";
import { fromKey, isHabitDue, toKey, weekOf } from "./dates";
import { emptyLog, normalizeHabit, normalizeLog } from "./normalize";
import type { DayLog, Factor, Feeling, Habit, Mood, PartOfDay } from "./types";

export { emptyLog } from "./normalize";

export function logFor(logs: Record<string, DayLog>, date: string): DayLog {
  const raw = logs[date];
  return raw ? normalizeLog(raw, date) : emptyLog(date);
}

export function timesDoneBefore(
  habit: Habit,
  logs: Record<string, DayLog>,
  date: Date,
): number {
  const h = normalizeHabit(habit);
  const key = toKey(date);
  let n = 0;
  for (const day of weekOf(date)) {
    const k = toKey(day);
    if (k >= key) break;
    if (isDone(h, logFor(logs, k))) n += 1;
  }
  return n;
}

export function weekProgress(
  habit: Habit,
  logs: Record<string, DayLog>,
  date: Date,
): { done: number; target: number } | null {
  const h = normalizeHabit(habit);
  if (h.frequency.kind !== "times") return null;
  const key = toKey(date);
  let done = 0;
  for (const day of weekOf(date)) {
    const k = toKey(day);
    if (k > key) break;
    if (isDone(h, logFor(logs, k))) done += 1;
  }
  return { done, target: h.frequency.count };
}

export function isOpenOn(
  habit: Habit,
  date: Date,
  logs: Record<string, DayLog>,
): boolean {
  const h = normalizeHabit(habit);
  if (!isHabitDue(h, date)) return false;
  if (h.frequency.kind !== "times") return true;
  return timesDoneBefore(h, logs, date) < h.frequency.count;
}

export function dueHabits(
  habits: Habit[],
  date: Date,
  logs: Record<string, DayLog>,
): Habit[] {
  return habits
    .map(normalizeHabit)
    .filter((h) => isOpenOn(h, date, logs))
    .sort((a, b) => a.order - b.order);
}

export function weekMetHabits(
  habits: Habit[],
  date: Date,
  logs: Record<string, DayLog>,
): Habit[] {
  return habits
    .map(normalizeHabit)
    .filter((h) => {
      if (h.archived || h.paused) return false;
      if (h.frequency.kind !== "times") return false;
      if (!isHabitDue(h, date)) return false;
      return timesDoneBefore(h, logs, date) >= h.frequency.count;
    })
    .sort((a, b) => a.order - b.order);
}

export function isDone(habit: Habit, log: DayLog): boolean {
  const h = normalizeHabit(habit);
  if (log.skipped[h.id]) return false;
  if (h.kind === "count" && h.polarity === "avoid") {
    if (log.values[h.id] === undefined && !log.completed[h.id]) return false;
    return (log.values[h.id] ?? 0) <= h.target;
  }
  if (log.completed[h.id]) return true;
  if (h.kind === "count") return (log.values[h.id] ?? 0) >= h.target;
  return false;
}

export function isSkipped(habit: Habit, log: DayLog): boolean {
  return Boolean(log.skipped[habit.id]);
}

export function completionOf(
  habits: Habit[],
  logs: Record<string, DayLog>,
  date: Date,
) {
  const log = logFor(logs, toKey(date));
  const due = dueHabits(habits, date, logs).filter((h) => !isSkipped(h, log));
  const done = due.filter((h) => isDone(h, log)).length;
  return { due: due.length, done, ratio: due.length === 0 ? 0 : done / due.length };
}

function restOrSkip(
  habit: Habit,
  logs: Record<string, DayLog>,
  date: Date,
): boolean {
  if (!isOpenOn(habit, date, logs)) return true;
  return isSkipped(habit, logFor(logs, toKey(date)));
}

export function streakFor(
  habit: Habit,
  logs: Record<string, DayLog>,
  today = new Date(),
): number {
  const h = normalizeHabit(habit);
  let cursor = today;
  const todayDue = isOpenOn(h, today, logs) && !restOrSkip(h, logs, today);
  const todayDone = isDone(h, logFor(logs, toKey(today)));
  if (todayDue && !todayDone) {
    cursor = subDays(today, 1);
  }

  let streak = 0;
  for (let i = 0; i < 420; i++) {
    if (restOrSkip(h, logs, cursor)) {
      cursor = subDays(cursor, 1);
      continue;
    }
    if (isDone(h, logFor(logs, toKey(cursor)))) {
      streak += 1;
      cursor = subDays(cursor, 1);
      continue;
    }
    break;
  }
  return streak;
}

export function longestStreak(
  habit: Habit,
  logs: Record<string, DayLog>,
  today = new Date(),
): number {
  const h = normalizeHabit(habit);
  let best = 0;
  let current = 0;
  let cursor = subDays(today, 400);
  const created = fromKey(h.createdAt.slice(0, 10));
  if (!Number.isNaN(created.getTime()) && created < cursor) cursor = created;

  for (let d = cursor; d <= today; d = addDays(d, 1)) {
    if (restOrSkip(h, logs, d)) continue;
    if (isDone(h, logFor(logs, toKey(d)))) {
      current += 1;
      if (current > best) best = current;
    } else {
      current = 0;
    }
  }
  return best;
}

export function strengthFor(
  habit: Habit,
  logs: Record<string, DayLog>,
  today = new Date(),
): number {
  const h = normalizeHabit(habit);
  let due = 0;
  let done = 0;
  for (let i = 0; i < 60 && due < 30; i++) {
    const d = subDays(today, i);
    if (!isOpenOn(h, d, logs)) continue;
    if (isSkipped(h, logFor(logs, toKey(d)))) continue;
    due += 1;
    if (isDone(h, logFor(logs, toKey(d)))) done += 1;
  }
  return due === 0 ? 0 : Math.round((done / due) * 100);
}

export function weekChain(
  habit: Habit,
  logs: Record<string, DayLog>,
  anchor = new Date(),
): { key: string; state: "done" | "skip" | "miss" | "rest" | "future" }[] {
  const h = normalizeHabit(habit);
  const today = toKey(anchor);
  return weekOf(anchor).map((day) => {
    const key = toKey(day);
    if (key > today) return { key, state: "future" as const };
    if (!isOpenOn(h, day, logs)) return { key, state: "rest" as const };
    const log = logFor(logs, key);
    if (isSkipped(h, log)) return { key, state: "skip" as const };
    if (isDone(h, log)) return { key, state: "done" as const };
    return { key, state: "miss" as const };
  });
}

export function recoveredToday(
  habits: Habit[],
  logs: Record<string, DayLog>,
  today = new Date(),
): boolean {
  const yesterday = subDays(today, 1);
  return dueHabits(habits, today, logs).some((h) => {
    const todayLog = logFor(logs, toKey(today));
    const yLog = logFor(logs, toKey(yesterday));
    if (!isOpenOn(h, yesterday, logs)) return false;
    if (isSkipped(h, yLog) || isDone(h, yLog)) return false;
    return isDone(h, todayLog);
  });
}

export function currentPartOfDay(now = new Date()): PartOfDay {
  const hour = now.getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function partLabel(part: PartOfDay): string {
  return { morning: "Morning", afternoon: "Afternoon", evening: "Evening", any: "Anytime" }[
    part
  ];
}

export function moodLabel(mood: Mood): string {
  return ["", "Rough", "Dim", "Steady", "Clear", "Bright"][mood] ?? "";
}

export function moodEmoji(mood: Mood): string {
  return ["", "😞", "😕", "😐", "🙂", "😄"][mood] ?? "";
}

export function energyLabel(energy: Mood): string {
  return ["", "Still", "Quiet", "Even", "Live", "Full"][energy] ?? "";
}

export function feelingLabel(feeling: Feeling): string {
  return feeling[0].toUpperCase() + feeling.slice(1);
}

export const FACTOR_META: { id: Factor; label: string }[] = [
  { id: "sleep", label: "Sleep" },
  { id: "people", label: "People" },
  { id: "work", label: "Work" },
  { id: "move", label: "Move" },
  { id: "rest", label: "Rest" },
  { id: "out", label: "Out" },
];

export function feelingsFor(mood?: Mood, _energy?: Mood): Feeling[] {
  if (!mood) return [];
  if (mood >= 4) return ["glad", "open", "calm"];
  if (mood <= 2) return ["heavy", "tense", "tired"];
  return ["steady", "mixed", "okay"];
}

export function keepFeeling(mood?: Mood, energy?: Mood, feeling?: Feeling): Feeling | undefined {
  if (!feeling) return undefined;
  return feelingsFor(mood, energy).includes(feeling) ? feeling : undefined;
}

export function dayScore(
  habits: Habit[],
  logs: Record<string, DayLog>,
  date: Date,
): number {
  const { ratio } = completionOf(habits, logs, date);
  return Math.round(ratio * 4);
}

export function habitDayScore(habit: Habit, log: DayLog): number {
  const h = normalizeHabit(habit);
  if (isSkipped(h, log)) return -1;
  if (h.kind === "count") {
    const value = log.values[h.id] ?? (log.completed[h.id] ? h.target : 0);
    if (h.polarity === "avoid") {
      if (log.values[h.id] === undefined && !log.completed[h.id]) return 0;
      return value <= h.target ? 4 : 0;
    }
    if (h.target <= 0) return value > 0 ? 4 : 0;
    return Math.min(4, Math.round((value / h.target) * 4));
  }
  return isDone(h, log) ? 4 : 0;
}

export function weekdayPattern(
  habits: Habit[],
  logs: Record<string, DayLog>,
  today = new Date(),
): { label: string; pct: number }[] {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const monday = startOfWeek(today, { weekStartsOn: 1 });
  return labels.map((label, i) => {
    let due = 0;
    let done = 0;
    for (let w = 0; w < 12; w++) {
      const d = subDays(addDays(monday, i), w * 7);
      if (startOfDay(d) > startOfDay(today)) continue;
      const c = completionOf(habits, logs, d);
      due += c.due;
      done += c.done;
    }
    return { label, pct: due ? Math.round((done / due) * 100) : 0 };
  });
}

export function weeklyTrend(
  habits: Habit[],
  logs: Record<string, DayLog>,
  today = new Date(),
  weeks = 12,
): { label: string; pct: number; mood: number | null }[] {
  const thisMonday = startOfWeek(today, { weekStartsOn: 1 });
  return Array.from({ length: weeks }, (_, i) => {
    const weekStart = subDays(thisMonday, (weeks - 1 - i) * 7);
    let due = 0;
    let done = 0;
    let moodSum = 0;
    let moodN = 0;
    for (const day of weekOf(weekStart)) {
      if (startOfDay(day) > startOfDay(today)) break;
      const c = completionOf(habits, logs, day);
      due += c.due;
      done += c.done;
      const mood = logFor(logs, toKey(day)).mood;
      if (mood) {
        moodSum += mood;
        moodN += 1;
      }
    }
    return {
      label: format(weekStart, "d MMM"),
      pct: due ? Math.round((done / due) * 100) : 0,
      mood: moodN ? Math.round((moodSum / moodN) * 10) / 10 : null,
    };
  });
}

export function moodCompletion(
  habits: Habit[],
  logs: Record<string, DayLog>,
  today = new Date(),
): { mood: Mood; label: string; pct: number; days: number }[] {
  const buckets: Record<Mood, { due: number; done: number; days: number }> = {
    1: { due: 0, done: 0, days: 0 },
    2: { due: 0, done: 0, days: 0 },
    3: { due: 0, done: 0, days: 0 },
    4: { due: 0, done: 0, days: 0 },
    5: { due: 0, done: 0, days: 0 },
  };
  for (let i = 0; i < 90; i++) {
    const d = subDays(today, i);
    const log = logFor(logs, toKey(d));
    if (!log.mood) continue;
    const c = completionOf(habits, logs, d);
    buckets[log.mood].due += c.due;
    buckets[log.mood].done += c.done;
    buckets[log.mood].days += 1;
  }
  return ([1, 2, 3, 4, 5] as Mood[]).map((mood) => ({
    mood,
    label: moodLabel(mood),
    days: buckets[mood].days,
    pct: buckets[mood].due
      ? Math.round((buckets[mood].done / buckets[mood].due) * 100)
      : 0,
  }));
}

export function moodQuadrants(
  logs: Record<string, DayLog>,
  today = new Date(),
): { id: string; label: string; days: number }[] {
  const cells = {
    "bright-live": { label: "Bright · live", days: 0 },
    "rough-live": { label: "Rough · live", days: 0 },
    "bright-still": { label: "Bright · still", days: 0 },
    "rough-still": { label: "Rough · still", days: 0 },
  };
  for (let i = 0; i < 90; i++) {
    const log = logFor(logs, toKey(subDays(today, i)));
    if (!log.mood || !log.energy) continue;
    const pleasant = log.mood >= 4;
    const unpleasant = log.mood <= 2;
    const high = log.energy >= 4;
    const low = log.energy <= 2;
    if (pleasant && high) cells["bright-live"].days += 1;
    else if (unpleasant && high) cells["rough-live"].days += 1;
    else if (pleasant && low) cells["bright-still"].days += 1;
    else if (unpleasant && low) cells["rough-still"].days += 1;
  }
  return Object.entries(cells).map(([id, row]) => ({ id, ...row }));
}

export function factorMood(
  logs: Record<string, DayLog>,
  today = new Date(),
): { id: Factor; label: string; avg: number; days: number }[] {
  return FACTOR_META.map((meta) => {
    let sum = 0;
    let days = 0;
    for (let i = 0; i < 90; i++) {
      const log = logFor(logs, toKey(subDays(today, i)));
      if (!log.mood || !log.factors.includes(meta.id)) continue;
      sum += log.mood;
      days += 1;
    }
    return {
      id: meta.id,
      label: meta.label,
      days,
      avg: days ? Math.round((sum / days) * 10) / 10 : 0,
    };
  }).filter((row) => row.days >= 2);
}

export function snapshotToCsv(
  habits: Habit[],
  logs: Record<string, DayLog>,
): string {
  const active = habits.map(normalizeHabit).filter((h) => !h.archived);
  const dates = Object.keys(logs).sort();
  const escape = (value: string) => {
    if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
    return value;
  };
  const header = ["date", "mood", "energy", "feeling", "factors", "note", ...active.map((h) => h.name)]
    .map(escape)
    .join(",");
  const rows = dates.map((date) => {
    const log = logFor(logs, date);
    const cells = active.map((h) => {
      if (isSkipped(h, log)) return "skip";
      if (h.kind === "count") {
        const value = log.values[h.id];
        if (value !== undefined) return String(value);
        return log.completed[h.id] ? String(h.target) : "";
      }
      return isDone(h, log) ? "1" : "0";
    });
    return [
      date,
      log.mood ? String(log.mood) : "",
      log.energy ? String(log.energy) : "",
      log.feeling ?? "",
      log.factors.join("|"),
      escape(log.note),
      ...cells,
    ].join(",");
  });
  return [header, ...rows].join("\n");
}
