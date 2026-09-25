import { Capacitor, registerPlugin } from "@capacitor/core";
import { todayKey, fromKey } from "@/lib/tracker/dates";
import {
  completionOf,
  dueHabits,
  isDone,
  logFor,
  moodEmoji,
  moodLabel,
  streakFor,
} from "@/lib/tracker/logic";
import { normalizeHabit } from "@/lib/tracker/normalize";
import type { WidgetKind } from "@/lib/pwa";
import type { DayLog, Habit } from "@/lib/tracker/types";

type Snapshot = {
  habits: Habit[];
  logs: Record<string, DayLog>;
};

type Bridge = {
  sync(options: { payload: string }): Promise<void>;
  pin(options: { kind: WidgetKind }): Promise<void>;
};

const Bridge = registerPlugin<Bridge>("VesperWidgets");

function payload(state: Snapshot) {
  const date = fromKey(todayKey());
  const key = todayKey();
  const log = logFor(state.logs, key);
  const stats = completionOf(state.habits, state.logs, date);
  const due = dueHabits(state.habits, date, state.logs);
  const next = due.find((h) => !isDone(h, log));
  const open = state.habits.filter((h) => !h.archived && !h.paused);
  let best = open[0];
  let streak = best ? streakFor(best, state.logs, date) : 0;
  for (const habit of open.slice(1)) {
    const n = streakFor(habit, state.logs, date);
    if (n > streak) {
      best = habit;
      streak = n;
    }
  }
  return {
    todayValue: stats.due ? String(Math.round(stats.ratio * 100)) : "—",
    todayDetail: stats.due ? `${stats.done} of ${stats.due}` : "Nothing due",
    todayNote: next ? next.name : stats.due ? "All in" : "Quiet day",
    streakValue: String(streak),
    streakDetail: streak === 1 ? "day" : "days",
    streakNote: best && streak ? best.name : "Start one today",
    moodValue: log.mood ? moodEmoji(log.mood) : "—",
    moodDetail: log.mood ? moodLabel(log.mood) : "unmarked",
    moodNote: log.mood ? "Logged" : "Open Vesper to mark the day",
    habits: due.map((habit) => {
      const h = normalizeHabit(habit);
      const done = isDone(h, log);
      const value = log.values[h.id] ?? 0;
      const count = h.kind === "count" ? ` ${value}/${h.target}` : "";
      return { line: `${done ? "✓" : "○"} ${h.name}${count}` };
    }),
  };
}

export function homeWidgetsAvailable() {
  return Capacitor.isNativePlatform();
}

export async function syncHomeWidgets(state: Snapshot) {
  if (!Capacitor.isNativePlatform()) return;
  await Bridge.sync({ payload: JSON.stringify(payload(state)) });
}

export async function pinHomeWidget(kind: WidgetKind, state: Snapshot) {
  await syncHomeWidgets(state);
  await Bridge.pin({ kind });
}
