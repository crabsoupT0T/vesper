import type { DayLog, DayTask, Factor, Feeling, Frequency, Habit, Polarity } from "./types";
import { FACTORS, FEELINGS } from "./types";

export function normalizeFrequency(frequency: Frequency | undefined): Frequency {
  if (frequency?.kind === "times") {
    const count = Math.min(7, Math.max(1, Math.round(frequency.count || 3)));
    return { kind: "times", count };
  }
  if (frequency?.kind === "weekly") {
    const days = (frequency.days ?? []).filter((d) => d >= 0 && d <= 6);
    return { kind: "weekly", days: days.length ? days : [1, 2, 3, 4, 5] };
  }
  return { kind: "daily" };
}

export function normalizePolarity(polarity: Polarity | undefined): Polarity {
  return polarity === "avoid" ? "avoid" : "keep";
}

export function normalizeHabit(habit: Habit): Habit {
  return {
    ...habit,
    partOfDay: habit.partOfDay ?? "any",
    kind: habit.kind ?? "check",
    target: habit.target && habit.target > 0 ? habit.target : 1,
    unit: habit.unit ?? "",
    polarity: normalizePolarity(habit.polarity),
    paused: Boolean(habit.paused),
    frequency: normalizeFrequency(habit.frequency),
  };
}

export function emptyLog(date: string): DayLog {
  return { date, note: "", factors: [], completed: {}, values: {}, skipped: {}, tasks: [] };
}

function normalizeTasks(value: unknown): DayTask[] {
  if (!Array.isArray(value)) return [];
  const tasks: DayTask[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const task = item as Partial<DayTask>;
    const title = typeof task.title === "string" ? task.title.trim().slice(0, 140) : "";
    if (!title || typeof task.id !== "string") continue;
    tasks.push({
      id: task.id,
      title,
      done: Boolean(task.done),
      important: Boolean(task.important),
    });
  }
  return tasks;
}

function asMood(value: unknown): 1 | 2 | 3 | 4 | 5 | undefined {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5
    ? value
    : undefined;
}

export function normalizeLog(log: DayLog, date = log.date): DayLog {
  const rawFactors = Array.isArray(log.factors) ? log.factors : [];
  const factors = rawFactors.filter((f): f is Factor =>
    (FACTORS as readonly string[]).includes(f),
  );
  const feeling = log.feeling && (FEELINGS as readonly string[]).includes(log.feeling)
    ? log.feeling
    : undefined;
  return {
    date,
    note: log.note ?? "",
    mood: asMood(log.mood),
    energy: asMood(log.energy),
    feeling,
    factors,
    completed: log.completed ?? {},
    values: log.values ?? {},
    skipped: log.skipped ?? {},
    tasks: normalizeTasks(log.tasks),
  };
}
