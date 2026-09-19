import {
  addDays,
  format,
  isAfter,
  isSameDay,
  parseISO,
  startOfDay,
  startOfWeek,
  subDays,
} from "date-fns";
import { normalizeHabit } from "./normalize";
import type { Habit } from "./types";

export function todayKey(now = new Date()): string {
  return format(now, "yyyy-MM-dd");
}

export function toKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function fromKey(key: string): Date {
  return parseISO(key);
}

export function isFutureDay(key: string, now = new Date()): boolean {
  return isAfter(startOfDay(fromKey(key)), startOfDay(now));
}

export function isToday(key: string, now = new Date()): boolean {
  return isSameDay(fromKey(key), now);
}

export function weekdayIndex(date: Date): number {
  return date.getDay();
}

export function isHabitDue(habit: Habit, date: Date): boolean {
  const h = normalizeHabit(habit);
  if (h.archived || h.paused) return false;
  const created = fromKey(h.createdAt.slice(0, 10));
  if (!Number.isNaN(created.getTime()) && startOfDay(date) < startOfDay(created)) {
    return false;
  }
  if (h.frequency.kind === "daily" || h.frequency.kind === "times") return true;
  return h.frequency.days.includes(weekdayIndex(date));
}

export function weekOf(anchor: Date): Date[] {
  const start = startOfWeek(anchor, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function lastNDays(n: number, end = new Date()): Date[] {
  return Array.from({ length: n }, (_, i) => subDays(end, n - 1 - i));
}

export function formatLong(date: Date): string {
  return format(date, "EEEE, d MMMM");
}

export function formatShort(date: Date): string {
  return format(date, "d MMM");
}

export function greeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 5) return "Still up";
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  if (hour < 21) return "Evening";
  return "Night";
}
