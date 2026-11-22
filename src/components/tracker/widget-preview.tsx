import { useState } from "react";
import { fromKey, todayKey } from "@/lib/tracker/dates";
import { dueHabits, isDone, logFor } from "@/lib/tracker/logic";
import { normalizeHabit } from "@/lib/tracker/normalize";
import { useTracker } from "@/lib/tracker/store";
import { cn } from "@/lib/utils";

export function WidgetPreview() {
  const habits = useTracker((s) => s.habits);
  const logs = useTracker((s) => s.logs);
  const toggleComplete = useTracker((s) => s.toggleComplete);
  const key = todayKey();
  const log = logFor(logs, key);
  const open = dueHabits(habits, fromKey(key), logs)
    .map(normalizeHabit)
    .filter((habit) => !isDone(habit, log));
  const [leaving, setLeaving] = useState<Record<string, true>>({});

  function check(id: string) {
    if (leaving[id]) return;
    setLeaving((current) => ({ ...current, [id]: true }));
    window.setTimeout(() => {
      toggleComplete(id, key);
      setLeaving((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    }, 720);
  }

  return (
    <div className="rounded-xl bg-[#0c0c0e] p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
      <p className="text-[10px] font-medium tracking-[0.16em] text-zinc-500 uppercase">Habits</p>
      {open.length === 0 ? (
        <p className="mt-3 text-xs text-zinc-500">All checked.</p>
      ) : (
        <ul className="mt-2 flex max-h-72 flex-col gap-1 overflow-y-auto">
          {open.map((habit) => {
            const out = Boolean(leaving[habit.id]);
            const value = log.values[habit.id] ?? 0;
            return (
              <li
                key={habit.id}
                className={cn(
                  "grid transition-[grid-template-rows,opacity] duration-500",
                  out ? "grid-rows-[0fr] opacity-0 delay-300" : "grid-rows-[1fr]",
                )}
              >
                <div className="overflow-hidden">
                  <div className="flex min-h-14 items-center gap-2">
                    <button
                      type="button"
                      aria-label={`Check ${habit.name}`}
                      onClick={() => check(habit.id)}
                      className={cn(
                        "flex size-12 shrink-0 items-center justify-center border border-[#ffe14a] text-[#0c0c0e]",
                        out ? "bg-[#ffe14a]" : "bg-transparent",
                      )}
                    >
                      <span className={cn("size-5 bg-[#ffe14a]", out ? "opacity-100" : "opacity-0")} />
                    </button>
                    <span className="relative min-w-0 flex-1 truncate text-sm text-zinc-100">
                      <span className={cn("transition-colors duration-300", out && "text-zinc-500")}>
                        {habit.name}
                      </span>
                      <span
                        aria-hidden
                        className={cn(
                          "absolute top-1/2 left-0 h-px w-full origin-left bg-zinc-400 transition-transform duration-300",
                          out ? "scale-x-100" : "scale-x-0",
                        )}
                      />
                    </span>
                    {habit.kind === "count" ? (
                      <span className="shrink-0 text-[11px] text-zinc-500 tabular-nums">
                        {out ? habit.target : value}/{habit.target}
                      </span>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
