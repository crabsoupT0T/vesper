import { Check, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { HABIT_COLOR_CLASS, HABIT_COLOR_FILL, HABIT_ICON_MAP } from "@/lib/tracker/icons";
import { isDone, isSkipped, weekChain, weekProgress } from "@/lib/tracker/logic";
import { normalizeHabit } from "@/lib/tracker/normalize";
import type { DayLog, Habit } from "@/lib/tracker/types";
import { useTracker } from "@/lib/tracker/store";

type Props = {
  habit: Habit;
  log: DayLog;
  streak: number;
  locked?: boolean;
  date?: Date;
};

export function HabitRow({ habit, log, streak, locked, date }: Props) {
  const h = normalizeHabit(habit);
  const Icon = HABIT_ICON_MAP[h.icon];
  const done = isDone(h, log);
  const skipped = isSkipped(h, log);
  const toggleComplete = useTracker((s) => s.toggleComplete);
  const addCount = useTracker((s) => s.addCount);
  const toggleSkip = useTracker((s) => s.toggleSkip);
  const logs = useTracker((s) => s.logs);
  const value = log.values[h.id] ?? (done && h.kind === "count" ? (h.polarity === "avoid" ? 0 : h.target) : 0);
  const chain = weekChain(h, logs, date);
  const progress = weekProgress(h, logs, date ?? new Date());
  const overLimit = h.kind === "count" && h.polarity === "avoid" && value > h.target;

  return (
    <div
      className={cn(
        "flex min-h-14 items-center gap-3 rounded-lg px-3 py-2",
        skipped && "opacity-60",
      )}
    >
      <button
        type="button"
        disabled={locked || skipped}
        onClick={() => h.kind === "check" && toggleComplete(h.id)}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-3 text-left",
          h.kind === "check" && !locked && "active:scale-[0.99]",
        )}
        aria-pressed={h.kind === "check" ? done : undefined}
      >
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-md",
            HABIT_COLOR_CLASS[h.color],
          )}
        >
          <Icon className="size-4" strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate text-sm font-medium",
              done || skipped ? "text-muted" : "text-fg",
            )}
          >
            {h.name}
            {h.kind === "count" ? (
              <span
                className={cn(
                  "ml-2 font-normal tabular-nums text-subtle",
                  overLimit && "text-destructive",
                )}
              >
                {value}/{h.target}
                {h.unit ? ` ${h.unit}` : ""}
                {h.polarity === "avoid" ? " max" : ""}
              </span>
            ) : h.polarity === "avoid" ? (
              <span className="ml-2 font-normal text-subtle">Avoid</span>
            ) : null}
          </span>
          <span className="mt-1 flex items-center gap-2">
            <span className="flex gap-0.5" aria-hidden>
              {chain.map((cell) => (
                <span
                  key={cell.key}
                  className={cn(
                    "size-1.5 rounded-full",
                    cell.state === "done" && HABIT_COLOR_FILL[h.color],
                    cell.state === "miss" && "bg-surface-2",
                    cell.state === "skip" && "bg-subtle/40",
                    cell.state === "rest" && "bg-transparent shadow-[var(--shadow-border)]",
                    cell.state === "future" && "bg-transparent",
                  )}
                />
              ))}
            </span>
            <span className="text-xs tabular-nums text-subtle">
              {skipped
                ? "Skipped"
                : progress
                  ? `${Math.min(progress.done, progress.target)}/${progress.target} this week`
                  : streak > 0
                    ? `${streak} day${streak === 1 ? "" : "s"}`
                    : "No streak"}
            </span>
          </span>
        </span>
      </button>

      {h.kind === "count" && !skipped ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={locked || value <= 0}
            aria-label="Decrease"
            onClick={() => addCount(h.id, -1)}
            className="flex size-9 items-center justify-center rounded-sm text-muted hover:bg-surface-2 hover:text-fg disabled:opacity-30"
          >
            <Minus className="size-3.5" />
          </button>
          <button
            type="button"
            disabled={locked}
            aria-label="Increase"
            onClick={() => addCount(h.id, 1)}
            className="flex size-9 items-center justify-center rounded-sm text-muted hover:bg-surface-2 hover:text-fg disabled:opacity-30"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={locked || skipped}
          onClick={() => toggleComplete(h.id)}
          aria-label={done ? "Undo" : h.polarity === "avoid" ? "Mark avoided" : "Mark done"}
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-sm transition-[background-color,color] duration-[var(--motion-quick)]",
            done
              ? cn(HABIT_COLOR_FILL[h.color], "text-bg")
              : "bg-transparent text-transparent shadow-[var(--shadow-border)]",
          )}
        >
          <Check
            className={cn(
              "size-3.5 transition-[opacity,transform] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
              done ? "scale-100 opacity-100" : "scale-50 opacity-0",
            )}
            strokeWidth={2.5}
          />
        </button>
      )}

      <button
        type="button"
        disabled={locked}
        onClick={() => toggleSkip(h.id)}
        className={cn(
          "shrink-0 text-xs transition-colors duration-[var(--motion-quick)]",
          skipped ? "text-fg" : "text-subtle hover:text-muted",
        )}
      >
        {skipped ? "Undo" : "Skip"}
      </button>
    </div>
  );
}
