import { Check } from "lucide-react";
import { todayKey, fromKey } from "@/lib/tracker/dates";
import { dueHabits, isDone, isSkipped, logFor } from "@/lib/tracker/logic";
import { normalizeHabit } from "@/lib/tracker/normalize";
import { useTracker } from "@/lib/tracker/store";
import { cn } from "@/lib/utils";

export function HabitChecklist({ compact = false }: { compact?: boolean }) {
  const habits = useTracker((s) => s.habits);
  const logs = useTracker((s) => s.logs);
  const toggleComplete = useTracker((s) => s.toggleComplete);
  const key = todayKey();
  const date = fromKey(key);
  const log = logFor(logs, key);
  const due = dueHabits(habits, date, logs);

  return (
    <section className={cn("rounded-xl bg-surface", compact ? "p-2" : "p-2")}>
      <p className="px-3 pt-1 pb-2 text-xs font-medium tracking-wide text-subtle uppercase">
        Habits
      </p>
      {due.length === 0 ? (
        <p className="px-3 pb-3 text-sm text-muted">Nothing due today.</p>
      ) : (
        <ul>
          {due.map((habit) => {
            const h = normalizeHabit(habit);
            const done = isDone(h, log);
            const skipped = isSkipped(h, log);
            const value = log.values[h.id];
            return (
              <li key={h.id} className="flex min-h-12 items-center gap-2 px-2">
                <button
                  type="button"
                  disabled={skipped}
                  aria-label={done ? `Undo ${h.name}` : `Done ${h.name}`}
                  aria-pressed={done}
                  onClick={() => toggleComplete(h.id, key)}
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-sm",
                    done
                      ? "bg-accent text-accent-fg"
                      : "text-transparent shadow-[var(--shadow-border)]",
                  )}
                >
                  <Check
                    className={cn("size-3.5", done ? "opacity-100" : "opacity-0")}
                    strokeWidth={2.5}
                  />
                </button>
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-sm",
                    done || skipped ? "text-muted" : "text-fg",
                  )}
                >
                  {h.name}
                  {skipped ? <span className="ml-2 text-xs text-subtle">Skipped</span> : null}
                </span>
                {h.kind === "count" ? (
                  <span className="shrink-0 text-xs tabular-nums text-subtle">
                    {value ?? 0}/{h.target}
                    {h.unit ? ` ${h.unit}` : ""}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
