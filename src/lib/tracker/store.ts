import { create } from "zustand";
import { persist } from "zustand/middleware";
import { todayKey } from "./dates";
import { emptyLog, isDone, keepFeeling } from "./logic";
import { normalizeHabit, normalizeLog } from "./normalize";
import { createDemoData } from "./seed";
import type { WidgetKind } from "@/lib/pwa";
import type {
  DayLog,
  Factor,
  Feeling,
  Habit,
  HabitDraft,
  Mood,
  TrackerSnapshot,
} from "./types";

export type ViewId = "today" | "history" | "insights" | "habits";

export type WidgetSet = Record<WidgetKind, boolean>;

type TrackerState = TrackerSnapshot & {
  selectedDate: string;
  view: ViewId;
  heatmapHabitId: string | null;
  reminderOn: boolean;
  lastNudgeKey: string;
  widgets: WidgetSet;
  hideInstallHint: boolean;
  setView: (view: ViewId) => void;
  setSelectedDate: (date: string) => void;
  setHeatmapHabitId: (id: string | null) => void;
  setProfileName: (name: string) => void;
  toggleComplete: (habitId: string, date?: string) => void;
  addCount: (habitId: string, delta: number, date?: string) => void;
  toggleSkip: (habitId: string, date?: string) => void;
  completeOpen: (habitIds: string[], date?: string) => void;
  setMood: (mood: Mood | undefined, date?: string) => void;
  setEnergy: (energy: Mood | undefined, date?: string) => void;
  setFeeling: (feeling: Feeling | undefined, date?: string) => void;
  toggleFactor: (factor: Factor, date?: string) => void;
  setNote: (note: string, date?: string) => void;
  addHabit: (input: HabitDraft) => void;
  updateHabit: (id: string, patch: Partial<HabitDraft>) => void;
  archiveHabit: (id: string) => void;
  restoreHabit: (id: string) => void;
  deleteHabit: (id: string) => void;
  setPaused: (id: string, paused: boolean) => void;
  moveHabit: (id: string, direction: -1 | 1) => void;
  resetDemo: () => void;
  importSnapshot: (data: TrackerSnapshot) => void;
  exportSnapshot: () => TrackerSnapshot;
  setReminderOn: (on: boolean) => void;
  setLastNudgeKey: (key: string) => void;
  setWidgetEnabled: (kind: WidgetKind, on: boolean) => void;
  setHideInstallHint: (hide: boolean) => void;
};

function patchLog(
  logs: Record<string, DayLog>,
  date: string,
  patch: (log: DayLog) => DayLog,
): Record<string, DayLog> {
  const current = normalizeLog(logs[date] ?? emptyLog(date), date);
  return { ...logs, [date]: patch(current) };
}

function applyCount(habit: Habit, log: DayLog, nextValue: number): DayLog {
  const values = { ...log.values, [habit.id]: Math.max(0, nextValue) };
  const completed = { ...log.completed };
  const skipped = { ...log.skipped };
  delete skipped[habit.id];
  const ok =
    habit.polarity === "avoid"
      ? values[habit.id] <= habit.target
      : values[habit.id] >= habit.target;
  if (ok) completed[habit.id] = true;
  else delete completed[habit.id];
  return { ...log, values, completed, skipped };
}

function clearCount(habit: Habit, log: DayLog): DayLog {
  const values = { ...log.values };
  const completed = { ...log.completed };
  const skipped = { ...log.skipped };
  delete values[habit.id];
  delete completed[habit.id];
  delete skipped[habit.id];
  return { ...log, values, completed, skipped };
}

function markDone(habit: Habit, log: DayLog): DayLog {
  if (isSkipped(habit, log) || isDone(habit, log)) return log;
  if (habit.kind === "count") {
    return applyCount(habit, log, habit.polarity === "avoid" ? 0 : habit.target);
  }
  const completed = { ...log.completed, [habit.id]: true as const };
  const skipped = { ...log.skipped };
  delete skipped[habit.id];
  return { ...log, completed, skipped };
}

function isSkipped(habit: Habit, log: DayLog): boolean {
  return Boolean(log.skipped[habit.id]);
}

function seedState(): Pick<
  TrackerState,
  | "initialized"
  | "profileName"
  | "habits"
  | "logs"
  | "selectedDate"
  | "view"
  | "heatmapHabitId"
  | "reminderOn"
  | "lastNudgeKey"
  | "widgets"
  | "hideInstallHint"
> {
  const { habits, logs } = createDemoData();
  return {
    initialized: true,
    profileName: "",
    habits,
    logs,
    selectedDate: todayKey(),
    view: "today",
    heatmapHabitId: null,
    reminderOn: false,
    lastNudgeKey: "",
    widgets: { today: true, streak: true, mood: true },
    hideInstallHint: false,
  };
}

const initial = seedState();

export const useTracker = create<TrackerState>()(
  persist(
    (set, get) => ({
      version: 1,
      ...initial,
      setView: (view) => set({ view }),
      setSelectedDate: (date) => set({ selectedDate: date }),
      setHeatmapHabitId: (heatmapHabitId) => set({ heatmapHabitId }),
      setProfileName: (profileName) => set({ profileName }),
      toggleComplete: (habitId, date) => {
        const found = get().habits.find((h) => h.id === habitId);
        if (!found) return;
        const key = date ?? get().selectedDate;
        const habit = normalizeHabit(found);
        set({
          logs: patchLog(get().logs, key, (log) => {
            const skipped = { ...log.skipped };
            delete skipped[habit.id];
            if (habit.kind === "count") {
              const done = isDone(habit, { ...log, skipped });
              if (habit.polarity === "avoid") {
                return done
                  ? clearCount(habit, { ...log, skipped })
                  : applyCount(habit, { ...log, skipped }, 0);
              }
              return applyCount(
                habit,
                { ...log, skipped },
                done ? 0 : habit.target,
              );
            }
            const completed = { ...log.completed };
            if (completed[habit.id]) delete completed[habit.id];
            else completed[habit.id] = true;
            return { ...log, completed, skipped };
          }),
        });
      },
      addCount: (habitId, delta, date) => {
        const found = get().habits.find((h) => h.id === habitId);
        if (!found) return;
        const key = date ?? get().selectedDate;
        const habit = normalizeHabit(found);
        set({
          logs: patchLog(get().logs, key, (log) => {
            const current =
              log.values[habit.id] ??
              (log.completed[habit.id]
                ? habit.polarity === "avoid"
                  ? 0
                  : habit.target
                : 0);
            return applyCount(habit, log, current + delta);
          }),
        });
      },
      toggleSkip: (habitId, date) => {
        const key = date ?? get().selectedDate;
        set({
          logs: patchLog(get().logs, key, (log) => {
            const skipped = { ...log.skipped };
            const completed = { ...log.completed };
            const values = { ...log.values };
            if (skipped[habitId]) {
              delete skipped[habitId];
            } else {
              skipped[habitId] = true;
              delete completed[habitId];
            }
            return { ...log, skipped, completed, values };
          }),
        });
      },
      completeOpen: (habitIds, date) => {
        const key = date ?? get().selectedDate;
        const habits = get().habits;
        set({
          logs: patchLog(get().logs, key, (log) => {
            let next = log;
            for (const id of habitIds) {
              const found = habits.find((h) => h.id === id);
              if (!found) continue;
              next = markDone(normalizeHabit(found), next);
            }
            return next;
          }),
        });
      },
      setMood: (mood, date) => {
        const key = date ?? get().selectedDate;
        set({
          logs: patchLog(get().logs, key, (log) => ({
            ...log,
            mood,
            feeling: keepFeeling(mood, log.energy, log.feeling),
          })),
        });
      },
      setEnergy: (energy, date) => {
        const key = date ?? get().selectedDate;
        set({
          logs: patchLog(get().logs, key, (log) => ({
            ...log,
            energy,
            feeling: keepFeeling(log.mood, energy, log.feeling),
          })),
        });
      },
      setFeeling: (feeling, date) => {
        const key = date ?? get().selectedDate;
        set({
          logs: patchLog(get().logs, key, (log) => ({ ...log, feeling })),
        });
      },
      toggleFactor: (factor, date) => {
        const key = date ?? get().selectedDate;
        set({
          logs: patchLog(get().logs, key, (log) => {
            const list = log.factors ?? [];
            const on = list.includes(factor);
            return {
              ...log,
              factors: on ? list.filter((f) => f !== factor) : [...list, factor],
            };
          }),
        });
      },
      setNote: (note, date) => {
        const key = date ?? get().selectedDate;
        set({
          logs: patchLog(get().logs, key, (log) => ({ ...log, note })),
        });
      },
      addHabit: (input) => {
        const habits = get().habits;
        const next: Habit = normalizeHabit({
          id:
            typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `h_${Date.now()}`,
          name: input.name.trim(),
          icon: input.icon,
          color: input.color,
          frequency: input.frequency,
          archived: false,
          createdAt: new Date().toISOString(),
          order: habits.length,
          partOfDay: input.partOfDay,
          kind: input.kind,
          target: input.kind === "count" ? Math.max(1, input.target) : 1,
          unit: input.kind === "count" ? input.unit.trim() : "",
          polarity: input.polarity,
          paused: false,
        });
        set({ habits: [...habits, next] });
      },
      updateHabit: (id, patch) => {
        set({
          habits: get().habits.map((h) => {
            if (h.id !== id) return h;
            const merged = normalizeHabit({
              ...h,
              ...patch,
              name: patch.name?.trim() ?? h.name,
            });
            if (merged.kind === "check") {
              merged.target = 1;
              merged.unit = "";
            } else {
              merged.target = Math.max(1, merged.target);
            }
            return merged;
          }),
        });
      },
      archiveHabit: (id) => {
        set({
          habits: get().habits.map((h) =>
            h.id === id ? { ...h, archived: true, paused: false } : h,
          ),
        });
      },
      restoreHabit: (id) => {
        set({
          habits: get().habits.map((h) =>
            h.id === id ? { ...h, archived: false } : h,
          ),
        });
      },
      setPaused: (id, paused) => {
        set({
          habits: get().habits.map((h) =>
            h.id === id ? { ...h, paused, archived: paused ? h.archived : false } : h,
          ),
        });
      },
      moveHabit: (id, direction) => {
        const habits = [...get().habits];
        const active = habits
          .filter((h) => !h.archived)
          .sort((a, b) => a.order - b.order);
        const index = active.findIndex((h) => h.id === id);
        const swap = index + direction;
        if (index < 0 || swap < 0 || swap >= active.length) return;
        const a = active[index];
        const b = active[swap];
        set({
          habits: habits.map((h) => {
            if (h.id === a.id) return { ...h, order: b.order };
            if (h.id === b.id) return { ...h, order: a.order };
            return h;
          }),
        });
      },
      deleteHabit: (id) => {
        const logs = { ...get().logs };
        for (const key of Object.keys(logs)) {
          const log = normalizeLog(logs[key], key);
          if (!log.completed[id] && log.values[id] === undefined && !log.skipped[id]) continue;
          const completed = { ...log.completed };
          const values = { ...log.values };
          const skipped = { ...log.skipped };
          delete completed[id];
          delete values[id];
          delete skipped[id];
          logs[key] = { ...log, completed, values, skipped };
        }
        set({
          habits: get().habits.filter((h) => h.id !== id),
          logs,
          heatmapHabitId: get().heatmapHabitId === id ? null : get().heatmapHabitId,
        });
      },
      resetDemo: () => set(seedState()),
      importSnapshot: (data) => {
        if (!Array.isArray(data.habits)) return;
        set({
          initialized: true,
          profileName: data.profileName ?? "",
          habits: data.habits.map(normalizeHabit),
          logs: Object.fromEntries(
            Object.entries(data.logs ?? {}).map(([k, v]) => [k, normalizeLog(v, k)]),
          ),
        });
      },
      exportSnapshot: () => {
        const { version, initialized, profileName, habits, logs } = get();
        return { version, initialized, profileName, habits, logs };
      },
      setReminderOn: (reminderOn) => set({ reminderOn }),
      setLastNudgeKey: (lastNudgeKey) => set({ lastNudgeKey }),
      setWidgetEnabled: (kind, on) =>
        set({ widgets: { ...get().widgets, [kind]: on } }),
      setHideInstallHint: (hideInstallHint) => set({ hideInstallHint }),
    }),
    {
      name: "vesper-tracker-v1",
      partialize: (state) => ({
        version: state.version,
        initialized: state.initialized,
        profileName: state.profileName,
        habits: state.habits,
        logs: state.logs,
        reminderOn: state.reminderOn,
        lastNudgeKey: state.lastNudgeKey,
        widgets: state.widgets,
        hideInstallHint: state.hideInstallHint,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<TrackerSnapshot> & {
          reminderOn?: boolean;
          lastNudgeKey?: string;
          widgets?: Partial<WidgetSet>;
          hideInstallHint?: boolean;
        };
        return {
          ...current,
          ...p,
          habits: (p.habits ?? current.habits).map(normalizeHabit),
          logs: Object.fromEntries(
            Object.entries(p.logs ?? current.logs).map(([k, v]) => [
              k,
              normalizeLog(v, k),
            ]),
          ),
          reminderOn: p.reminderOn ?? current.reminderOn,
          lastNudgeKey: p.lastNudgeKey ?? current.lastNudgeKey,
          widgets: {
            today: p.widgets?.today ?? current.widgets.today,
            streak: p.widgets?.streak ?? current.widgets.streak,
            mood: p.widgets?.mood ?? current.widgets.mood,
          },
          hideInstallHint: p.hideInstallHint ?? current.hideInstallHint,
        };
      },
    },
  ),
);
