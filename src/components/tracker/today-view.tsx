import { format } from "date-fns";
import { CompletionRing } from "@/components/tracker/completion-ring";
import { GlanceWidgets } from "@/components/tracker/glance-widgets";
import { HabitRow } from "@/components/tracker/habit-row";
import { InstallHint } from "@/components/tracker/install-hint";
import { MoodPicker } from "@/components/tracker/mood-picker";
import { Textarea } from "@/components/ui/textarea";
import {
  fromKey,
  greeting,
  isFutureDay,
  isToday,
  lastNDays,
  todayKey,
  toKey,
  weekOf,
} from "@/lib/tracker/dates";
import {
  completionOf,
  currentPartOfDay,
  dueHabits,
  isDone,
  isSkipped,
  logFor,
  partLabel,
  recoveredToday,
  streakFor,
  weekMetHabits,
} from "@/lib/tracker/logic";
import { useTracker } from "@/lib/tracker/store";
import type { PartOfDay } from "@/lib/tracker/types";
import { cn } from "@/lib/utils";

const GROUP_ORDER: PartOfDay[] = ["morning", "afternoon", "evening", "any"];

export function TodayView() {
  const selectedDate = useTracker((s) => s.selectedDate);
  const setSelectedDate = useTracker((s) => s.setSelectedDate);
  const habits = useTracker((s) => s.habits);
  const logs = useTracker((s) => s.logs);
  const profileName = useTracker((s) => s.profileName);
  const setMood = useTracker((s) => s.setMood);
  const setFeeling = useTracker((s) => s.setFeeling);
  const setNote = useTracker((s) => s.setNote);
  const completeOpen = useTracker((s) => s.completeOpen);

  const date = fromKey(selectedDate);
  const log = logFor(logs, selectedDate);
  const due = dueHabits(habits, date, logs);
  const met = weekMetHabits(habits, date, logs);
  const stats = completionOf(habits, logs, date);
  const days = weekOf(date);
  const locked = isFutureDay(selectedDate);
  const today = isToday(selectedDate);
  const greet = greeting();
  const who = profileName.trim();
  const nowPart = currentPartOfDay();
  const recovered = recoveredToday(habits, logs, date);

  const weekStats = lastNDays(7, date).reduce(
    (acc, d) => {
      const c = completionOf(habits, logs, d);
      return { due: acc.due + c.due, done: acc.done + c.done };
    },
    { due: 0, done: 0 },
  );
  const weekPct = weekStats.due ? Math.round((weekStats.done / weekStats.due) * 100) : 0;

  const groups = GROUP_ORDER.map((part) => ({
    part,
    items: [
      ...due.filter((h) => (h.partOfDay ?? "any") === part),
      ...met.filter((h) => (h.partOfDay ?? "any") === part),
    ],
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-8">
      <header className="rise flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-muted" suppressHydrationWarning>
            {today
              ? who
                ? `${greet}, ${who}`
                : greet
              : format(date, "EEEE")}
          </p>
          <div className="mt-1 flex items-baseline gap-3">
            <h1
              className="font-sans text-5xl leading-none font-medium tracking-tight text-fg tabular-nums sm:text-6xl"
              suppressHydrationWarning
            >
              {format(date, "d")}
            </h1>
            <div className="pb-1">
              <p className="font-sans text-lg font-medium text-fg" suppressHydrationWarning>
                {format(date, "MMMM")}
              </p>
              <p className="text-sm text-subtle" suppressHydrationWarning>
                {format(date, "yyyy")}
              </p>
            </div>
          </div>
          {!today ? (
            <button
              type="button"
              onClick={() => setSelectedDate(todayKey())}
              className="mt-3 text-sm text-muted underline-offset-4 transition-colors duration-[var(--motion-quick)] hover:text-fg hover:underline"
            >
              Back to today
            </button>
          ) : null}
        </div>
        <CompletionRing
          ratio={stats.ratio}
          label={`${stats.done} of ${stats.due} habits`}
        />
      </header>

      <p className="rise rise-2 -mt-4 text-sm text-muted">
        This week {weekPct}%
        {recovered ? " · Back on after a miss" : null}
      </p>

      <GlanceWidgets />
      <InstallHint />

      <div className="rise rise-2 flex gap-1.5" suppressHydrationWarning>
        {days.map((day) => {
          const key = toKey(day);
          const future = isFutureDay(key);
          const selected = key === selectedDate;
          const isNow = isToday(key);
          return (
            <button
              key={key}
              type="button"
              disabled={future}
              onClick={() => setSelectedDate(key)}
              className={cn(
                "flex h-14 flex-1 flex-col items-center justify-center rounded-md transition-[background-color,color] duration-[var(--motion-quick)] disabled:opacity-30",
                selected ? "bg-accent text-accent-fg" : "bg-surface text-muted hover:text-fg",
              )}
            >
              <span className="text-xs font-medium tracking-wide uppercase">
                {format(day, "EEEEE")}
              </span>
              <span className={cn("text-sm tabular-nums", isNow && !selected && "text-fg")}>
                {format(day, "d")}
              </span>
            </button>
          );
        })}
      </div>

      <section className="rise rise-3">
        <MoodPicker
          mood={log.mood}
          feeling={log.feeling}
          locked={locked}
          onMood={setMood}
          onFeeling={setFeeling}
        />
      </section>

      <section className="rise rise-4 flex flex-col gap-5">
        <div className="flex items-baseline justify-between px-1">
          <h2 className="text-sm font-medium text-fg">Marks</h2>
          <p className="text-sm tabular-nums text-muted">
            {stats.done} / {stats.due}
          </p>
        </div>
        {due.length === 0 && met.length === 0 ? (
          <p className="rounded-xl bg-surface px-4 py-8 text-center text-sm text-muted">
            Nothing due this day. Add a habit to begin.
          </p>
        ) : (
          groups.map((group) => {
            const openIds = group.items
              .filter((h) => due.some((d) => d.id === h.id) && !isDone(h, log) && !isSkipped(h, log))
              .map((h) => h.id);
            return (
              <div key={group.part}>
                <p className="mb-2 flex items-baseline justify-between gap-2 px-1 text-xs tracking-wide text-subtle uppercase">
                  <span className="flex items-baseline gap-2">
                    {partLabel(group.part)}
                    {today && group.part === nowPart ? (
                      <span className="normal-case tracking-normal text-muted">Now</span>
                    ) : null}
                  </span>
                  {!locked && openIds.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => completeOpen(openIds)}
                      className="normal-case tracking-normal text-muted hover:text-fg"
                    >
                      Mark rest
                    </button>
                  ) : null}
                </p>
                <ul className="rounded-xl bg-surface p-2">
                  {group.items.map((habit) => (
                    <li key={habit.id}>
                      <HabitRow
                        habit={habit}
                        log={log}
                        streak={streakFor(habit, logs, date)}
                        locked={locked || met.some((m) => m.id === habit.id)}
                        date={date}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
        {stats.due > 0 && stats.done === stats.due ? (
          <p className="px-1 text-sm text-muted">That is the day.</p>
        ) : null}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="px-1 text-sm font-medium text-fg">A note</h2>
        <Textarea
          value={log.note}
          disabled={locked}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What stayed with you."
          className="min-h-28 rounded-xl bg-surface shadow-none"
        />
      </section>
    </div>
  );
}
