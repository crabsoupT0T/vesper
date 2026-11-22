import { todayKey, fromKey } from "@/lib/tracker/dates";
import { dueHabits, isDone, isSkipped, logFor, partLabel } from "@/lib/tracker/logic";
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
    <section className={cn("rounded-[28px] bg-[#2a2a2c] px-4 pt-3.5 pb-2", compact && "px-3")}>
      <p className="pb-1 text-xl font-semibold text-[#e38b84]">Today</p>
      {due.length === 0 ? (
        <p className="px-0.5 pt-2 pb-3 text-sm text-zinc-400">Nothing due today.</p>
      ) : (
        <ul className="divide-y divide-white/10">
          {due.map((habit) => {
            const h = normalizeHabit(habit);
            const done = isDone(h, log);
            const skipped = isSkipped(h, log);
            const value = log.values[h.id] ?? 0;
            const when = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" });
            const count = h.kind === "count" ? `${value}/${h.target}` : "";
            return (
              <li key={h.id} className="flex min-h-14 items-center gap-3 py-2.5">
                <button
                  type="button"
                  disabled={skipped}
                  aria-label={done ? `Undo ${h.name}` : `Done ${h.name}`}
                  aria-pressed={done}
                  onClick={() => toggleComplete(h.id, key)}
                  className={cn(
                    "size-[22px] shrink-0 rounded-full border-[1.5px]",
                    done ? "border-[#4c8dff] bg-[#4c8dff]" : "border-[#8e8e93] bg-transparent",
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className={cn("block truncate text-base text-white", (done || skipped) && "text-zinc-400 line-through")}>
                    {h.name}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-[#e38b84]">
                    {when}
                    {count ? `   ${count}` : ""}
                    {skipped ? "   Skipped" : ""}
                  </span>
                </span>
                <span className="shrink-0 text-[13px] text-[#c7c7cc]">{partLabel(h.partOfDay)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
