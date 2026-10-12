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
import type { DayLog, Habit, Mood } from "@/lib/tracker/types";
import { useTracker } from "@/lib/tracker/store";

type Snapshot = {
  habits: Habit[];
  logs: Record<string, DayLog>;
};

type Bridge = {
  sync(options: { payload: string }): Promise<void>;
  pin(options: { kind: WidgetKind }): Promise<void>;
  pull(): Promise<{ actions?: string }>;
};

const Bridge = registerPlugin<Bridge>("VesperWidgets");

declare global {
  interface Window {
    __vesperFlush?: () => void;
  }
}

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
    date: key,
    todayValue: stats.due ? String(Math.round(stats.ratio * 100)) : "—",
    todayDetail: stats.due ? `${stats.done} of ${stats.due}` : "Nothing due",
    todayNote: next ? next.name : stats.due ? "All in" : "Quiet day",
    nextId: next?.id ?? "",
    streakValue: String(streak),
    streakDetail: streak === 1 ? "day" : "days",
    streakNote: best && streak ? best.name : "Start one today",
    streakHabitId: best?.id ?? "",
    streakDone: best ? isDone(best, log) : false,
    moodLevel: log.mood ?? 0,
    moodValue: log.mood ? moodEmoji(log.mood) : "—",
    moodDetail: log.mood ? moodLabel(log.mood) : "unmarked",
    moodNote: log.mood ? "Logged" : "Tap a face",
    habits: due.map((habit) => {
      const h = normalizeHabit(habit);
      const done = isDone(h, log);
      const value = log.values[h.id] ?? 0;
      const count = h.kind === "count" ? ` ${value}/${h.target}` : "";
      return {
        id: h.id,
        name: h.name,
        done,
        kind: h.kind,
        polarity: h.polarity,
        target: h.target,
        value,
        line: `${done ? "✓" : "○"} ${h.name}${count}`,
      };
    }),
  };
}

type WidgetAction = {
  op?: string;
  id?: string;
  date?: string;
  mood?: number;
  delta?: number;
};

export function homeWidgetsAvailable() {
  return Capacitor.isNativePlatform();
}

export async function syncHomeWidgets(_state?: Snapshot) {
  if (!Capacitor.isNativePlatform()) return;
  const pulled = await Bridge.pull();
  let actions: WidgetAction[] = [];
  try {
    actions = JSON.parse(pulled.actions || "[]") as WidgetAction[];
  } catch {
    actions = [];
  }
  if (actions.length > 0) {
    const store = useTracker.getState();
    for (const action of actions) {
      if (!action.date) continue;
      if (action.op === "toggle" && action.id) {
        store.toggleComplete(action.id, action.date);
      } else if (action.op === "bump" && action.id) {
        store.addCount(action.id, action.delta ?? 1, action.date);
      } else if (action.op === "mood") {
        const mood = action.mood ?? 0;
        store.setMood(mood >= 1 && mood <= 5 ? (mood as Mood) : undefined, action.date);
      }
    }
  }
  const fresh = useTracker.getState();
  await Bridge.sync({ payload: JSON.stringify(payload(fresh)) });
}

export async function pinHomeWidget(kind: WidgetKind, state: Snapshot) {
  await syncHomeWidgets(state);
  await Bridge.pin({ kind });
}
