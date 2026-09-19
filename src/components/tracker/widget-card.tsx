import { Link } from "@tanstack/react-router";
import { CompletionRing } from "@/components/tracker/completion-ring";
import { fromKey, todayKey } from "@/lib/tracker/dates";
import {
  completionOf,
  dueHabits,
  isDone,
  logFor,
  moodLabel,
  streakFor,
} from "@/lib/tracker/logic";
import { WIDGET_META, type WidgetKind } from "@/lib/pwa";
import { useTracker } from "@/lib/tracker/store";
import { cn } from "@/lib/utils";

export function useWidgetCopy(kind: WidgetKind) {
  const habits = useTracker((s) => s.habits);
  const logs = useTracker((s) => s.logs);
  const date = fromKey(todayKey());
  const log = logFor(logs, todayKey());

  if (kind === "today") {
    const stats = completionOf(habits, logs, date);
    const next = dueHabits(habits, date, logs).find((h) => !isDone(h, log));
    return {
      kicker: WIDGET_META.today.title,
      value: stats.due ? `${Math.round(stats.ratio * 100)}` : "—",
      detail: stats.due ? `${stats.done} of ${stats.due}` : "Nothing due",
      note: next ? next.name : stats.due ? "All in" : "Quiet day",
      ratio: stats.ratio,
    };
  }

  if (kind === "streak") {
    const open = habits.filter((h) => !h.archived && !h.paused);
    let best = open[0];
    let n = best ? streakFor(best, logs, date) : 0;
    for (const habit of open.slice(1)) {
      const s = streakFor(habit, logs, date);
      if (s > n) {
        best = habit;
        n = s;
      }
    }
    return {
      kicker: WIDGET_META.streak.title,
      value: n ? String(n) : "0",
      detail: n === 1 ? "day" : "days",
      note: best && n ? best.name : "Start one today",
      ratio: n ? Math.min(1, n / 21) : 0,
    };
  }

  const mood = log.mood;
  return {
    kicker: WIDGET_META.mood.title,
    value: mood ? moodLabel(mood) : "—",
    detail: mood ? "today" : "unmarked",
    note: mood ? "Logged" : "Tap to mark the day",
    ratio: mood ? mood / 5 : 0,
  };
}

type CardProps = {
  kind: WidgetKind;
  compact?: boolean;
};

export function WidgetCard({ kind, compact = false }: CardProps) {
  const copy = useWidgetCopy(kind);
  return (
    <div
      className={cn(
        "flex h-full flex-col justify-between bg-surface shadow-[var(--shadow-border)]",
        compact ? "rounded-md p-3" : "rounded-xl p-5",
      )}
    >
      <p className="text-xs font-medium tracking-wide text-muted uppercase">{copy.kicker}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p
            className={cn(
              "font-display font-medium tracking-tight text-fg",
              compact ? "text-2xl leading-none" : "text-4xl leading-none",
              kind === "mood" && compact && "text-xl",
            )}
          >
            {copy.value}
          </p>
          <p className="mt-1 text-sm text-muted">{copy.detail}</p>
        </div>
        {kind === "today" ? (
          <CompletionRing ratio={copy.ratio} size={compact ? 44 : 64} />
        ) : null}
      </div>
      <p className={cn("truncate text-sm text-subtle", compact ? "mt-3" : "mt-5")}>{copy.note}</p>
    </div>
  );
}

export function WidgetLink({ kind }: { kind: WidgetKind }) {
  return (
    <Link
      to="/widget/$kind"
      params={{ kind }}
      className="block h-full min-h-28 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <WidgetCard kind={kind} compact />
    </Link>
  );
}
