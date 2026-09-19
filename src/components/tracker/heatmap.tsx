import { addDays, format, startOfWeek, subDays } from "date-fns";
import { fromKey, toKey } from "@/lib/tracker/dates";
import { completionOf, dayScore, habitDayScore, isDone, isSkipped, logFor } from "@/lib/tracker/logic";
import { useTracker } from "@/lib/tracker/store";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const LEVELS = [
  "bg-surface-2",
  "bg-accent/20",
  "bg-accent/40",
  "bg-accent/70",
  "bg-accent",
] as const;

const CELL = 16;

export function Heatmap() {
  const habits = useTracker((s) => s.habits);
  const logs = useTracker((s) => s.logs);
  const setSelectedDate = useTracker((s) => s.setSelectedDate);
  const selectedDate = useTracker((s) => s.selectedDate);
  const heatmapHabitId = useTracker((s) => s.heatmapHabitId);
  const setHeatmapHabitId = useTracker((s) => s.setHeatmapHabitId);
  const active = habits.filter((h) => !h.archived).sort((a, b) => a.order - b.order);
  const focus = active.find((h) => h.id === heatmapHabitId) ?? null;

  const today = new Date();
  const end = startOfWeek(today, { weekStartsOn: 1 });
  const thisWeekEnd = addDays(end, 6);
  const start = startOfWeek(subDays(today, 364), { weekStartsOn: 1 });

  const weeks: Date[][] = [];
  for (let cursor = start; cursor <= thisWeekEnd; cursor = addDays(cursor, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(cursor, i)));
  }

  const monthLabels: { week: number; label: string }[] = [];
  let lastMonth = "";
  weeks.forEach((week, i) => {
    const label = format(week[0], "MMM");
    if (label !== lastMonth) {
      monthLabels.push({ week: i, label });
      lastMonth = label;
    }
  });

  return (
    <div className="flex flex-col gap-3" suppressHydrationWarning>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setHeatmapHabitId(null)}
          className={cn(
            "h-8 rounded-md px-2.5 text-xs font-medium",
            !focus ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted",
          )}
        >
          All
        </button>
        {active.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => setHeatmapHabitId(h.id)}
            className={cn(
              "h-8 rounded-md px-2.5 text-xs font-medium",
              focus?.id === h.id ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted",
            )}
          >
            {h.name}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="inline-flex min-w-full flex-col gap-2">
          <div className="relative h-4" style={{ width: weeks.length * CELL }}>
            {monthLabels.map((m) => (
              <span
                key={`${m.label}-${m.week}`}
                className="absolute top-0 text-xs tracking-wide text-subtle uppercase"
                style={{ left: m.week * CELL }}
              >
                {m.label}
              </span>
            ))}
          </div>
          <div className="flex gap-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day) => {
                  const key = toKey(day);
                  const future = day > today;
                  const log = logFor(logs, key);
                  const skipped = Boolean(focus && !future && isSkipped(focus, log));
                  const rawScore = future
                    ? 0
                    : focus
                      ? habitDayScore(focus, log)
                      : dayScore(habits, logs, day);
                  const score = rawScore < 0 ? 0 : rawScore;
                  const { done, due } = future
                    ? { done: 0, due: 0 }
                    : completionOf(habits, logs, day);
                  const selected = key === selectedDate;
                  const label = focus
                    ? `${format(day, "d MMM")}: ${skipped ? "skipped" : isDone(focus, log) ? "kept" : "open"}`
                    : `${format(day, "d MMM")}: ${done} of ${due}`;
                  return (
                    <Tooltip key={key}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          disabled={future}
                          onClick={() => setSelectedDate(key)}
                          aria-label={label}
                          className={cn(
                            "size-3 rounded-2xs transition-[box-shadow,transform] duration-[var(--motion-quick)] disabled:opacity-20",
                            skipped
                              ? "bg-transparent shadow-[var(--shadow-border)]"
                              : LEVELS[score],
                            selected && "ring-1 ring-fg",
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        {format(fromKey(key), "EEE d MMM")}
                        {focus
                          ? skipped
                            ? " · skipped"
                            : isDone(focus, log)
                              ? " · kept"
                              : " · open"
                          : ` · ${done}/${due}`}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="mt-1 flex items-center justify-end gap-1.5 text-xs text-subtle">
            <span>Less</span>
            {LEVELS.map((cls) => (
              <span key={cls} className={cn("size-2.5 rounded-2xs", cls)} />
            ))}
            <span>More</span>
            <span className="ml-2 size-2.5 rounded-2xs bg-transparent shadow-[var(--shadow-border)]" />
            <span>Skip</span>
          </div>
        </div>
      </div>
    </div>
  );
}
