import { format } from "date-fns";
import { Check } from "lucide-react";
import { Heatmap } from "@/components/tracker/heatmap";
import { Button } from "@/components/ui/button";
import { fromKey } from "@/lib/tracker/dates";
import { completionOf, dueHabits, feelingLabel, isDone, isSkipped, logFor, moodLabel } from "@/lib/tracker/logic";
import { HABIT_ICON_MAP } from "@/lib/tracker/icons";
import { useTracker } from "@/lib/tracker/store";
import { cn } from "@/lib/utils";

export function HistoryView() {
  const selectedDate = useTracker((s) => s.selectedDate);
  const setView = useTracker((s) => s.setView);
  const habits = useTracker((s) => s.habits);
  const logs = useTracker((s) => s.logs);
  const date = fromKey(selectedDate);
  const log = logFor(logs, selectedDate);
  const stats = completionOf(habits, logs, date);
  const due = dueHabits(habits, date, logs);

  return (
    <div className="flex flex-col gap-8">
      <header className="rise">
        <p className="text-sm text-muted">The year</p>
        <h1 className="mt-1 font-display text-4xl font-medium tracking-tight text-fg">
          History
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted">
          Each square is a day. Outline is a skip. Tap one to read it.
        </p>
      </header>

      <section className="rise rise-2 rounded-xl bg-surface p-4">
        <Heatmap />
      </section>

      <section className="rise rise-3 rounded-xl bg-surface p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-xl font-medium tracking-tight text-fg">
            {format(date, "d MMMM")}
          </h2>
          <p className="text-sm tabular-nums text-muted">
            {stats.done} / {stats.due}
          </p>
        </div>
        <p className="mt-1 text-sm text-muted">
          {[
            log.mood ? moodLabel(log.mood) : null,
            log.feeling ? feelingLabel(log.feeling) : null,
          ]
            .filter(Boolean)
            .join(" · ") || "Mood unmarked"}
        </p>
        {log.note ? (
          <p className="mt-4 text-sm leading-relaxed text-fg">{log.note}</p>
        ) : null}
        <ul className="mt-5 flex flex-col gap-2">
          {due.map((habit) => {
            const Icon = HABIT_ICON_MAP[habit.icon];
            const done = isDone(habit, log);
            const skipped = isSkipped(habit, log);
            return (
              <li key={habit.id} className="flex items-center gap-3 text-sm">
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-sm",
                    done ? "bg-accent text-accent-fg" : "bg-surface-2 text-subtle",
                  )}
                >
                  {done ? (
                    <Check className="size-3.5" strokeWidth={2.5} />
                  ) : (
                    <Icon className="size-3.5" strokeWidth={1.75} />
                  )}
                </span>
                <span className={done || skipped ? "text-muted" : "text-fg"}>
                  {habit.name}
                  {habit.polarity === "avoid" ? " · avoid" : null}
                  {skipped ? " · skipped" : null}
                  {habit.kind === "count" && log.values[habit.id] != null
                    ? ` · ${log.values[habit.id]}/${habit.target}`
                    : null}
                </span>
              </li>
            );
          })}
        </ul>
        <Button
          variant="outline"
          className="mt-5 w-full"
          onClick={() => setView("today")}
        >
          Edit this day
        </Button>
      </section>
    </div>
  );
}
