import { useEffect, useState } from "react";
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
  const setCount = useTracker((s) => s.setCount);
  const updateHabit = useTracker((s) => s.updateHabit);
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
      <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <button
          type="button"
          disabled={locked || skipped || h.kind !== "check"}
          onClick={() => h.kind === "check" && toggleComplete(h.id)}
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-md",
            HABIT_COLOR_CLASS[h.color],
            h.kind !== "check" && "cursor-default",
          )}
          aria-pressed={h.kind === "check" ? done : undefined}
          aria-label={h.kind === "check" ? (done ? `Undo ${h.name}` : `Mark ${h.name} done`) : undefined}
        >
          <Icon className="size-4" strokeWidth={1.75} />
        </button>
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate text-sm font-medium",
              done || skipped ? "text-muted" : "text-fg",
            )}
          >
            {h.name}
            {h.kind !== "count" && h.polarity === "avoid" ? (
              <span className="ml-2 font-normal text-subtle">Avoid</span>
            ) : null}
          </span>
          {h.kind === "count" ? (
            <span className="mt-1.5 flex flex-wrap items-center gap-1.5 font-normal">
              <CountField
                label={`${h.name} today`}
                value={value}
                disabled={locked || skipped}
                onCommit={(n) => setCount(h.id, n)}
              />
              <span className="text-subtle">/</span>
              <CountField
                label={`${h.name} goal`}
                value={h.target}
                min={1}
                disabled={locked}
                onCommit={(n) => {
                  updateHabit(h.id, { target: Math.max(1, n) });
                  setCount(h.id, value);
                }}
              />
              {h.unit ? (
                <span className={cn("text-subtle", overLimit && "text-destructive")}>{h.unit}</span>
              ) : null}
              {h.polarity === "avoid" ? <span className="text-subtle">max</span> : null}
            </span>
          ) : null}
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
      </div>

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

function CountField({
  label,
  value,
  disabled,
  min = 0,
  onCommit,
}: {
  label: string;
  value: number;
  disabled?: boolean;
  min?: number;
  onCommit: (n: number) => void;
}) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);

  return (
    <input
      aria-label={label}
      inputMode="numeric"
      disabled={disabled}
      value={text}
      onChange={(e) => {
        const next = e.target.value.replace(/\D/g, "").slice(0, 4);
        setText(next);
        if (next !== "") onCommit(Math.max(min, Number(next)));
      }}
      onBlur={() => {
        if (text === "") {
          setText(String(min));
          onCommit(min);
        }
      }}
      className="w-12 rounded-sm bg-surface-2 px-1 py-1 text-center text-sm tabular-nums text-fg outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-40"
    />
  );
}
