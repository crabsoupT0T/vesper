import { useState } from "react";
import { fromKey, todayKey } from "@/lib/tracker/dates";
import { dueHabits, isDone, logFor, partLabel } from "@/lib/tracker/logic";
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
    <div className="rounded-[28px] bg-[#2a2a2c] px-4 pt-3.5 pb-2">
      <p className="text-xl font-semibold text-[#e38b84]">Today</p>
      {open.length === 0 ? (
        <p className="mt-3 pb-2 text-sm text-zinc-400">All checked.</p>
      ) : (
        <ul className="mt-1 flex max-h-72 flex-col divide-y divide-white/10 overflow-y-auto">
          {open.map((habit) => {
            const out = Boolean(leaving[habit.id]);
            const value = log.values[habit.id] ?? 0;
            const when = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" });
            const count = habit.kind === "count" ? `${out ? habit.target : value}/${habit.target}` : "";
            return (
              <li
                key={habit.id}
                className={cn(
                  "grid transition-[grid-template-rows,opacity] duration-500",
                  out ? "grid-rows-[0fr] opacity-0 delay-300" : "grid-rows-[1fr]",
                )}
              >
                <div className="overflow-hidden">
                  <div className="flex min-h-14 items-center gap-3 py-2.5">
                    <button
                      type="button"
                      aria-label={`Check ${habit.name}`}
                      onClick={() => check(habit.id)}
                      className={cn(
                        "size-[22px] shrink-0 rounded-full border-[1.5px]",
                        out ? "border-[#4c8dff] bg-[#4c8dff]" : "border-[#8e8e93]",
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className={cn("relative block truncate text-base text-white", out && "text-zinc-400")}>
                        {habit.name}
                        <span
                          aria-hidden
                          className={cn(
                            "absolute top-1/2 left-0 h-px w-full origin-left bg-zinc-400 transition-transform duration-300",
                            out ? "scale-x-100" : "scale-x-0",
                          )}
                        />
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-[#e38b84]">
                        {when}
                        {count ? `   ${count}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-[13px] text-[#c7c7cc]">{partLabel(habit.partOfDay)}</span>
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
