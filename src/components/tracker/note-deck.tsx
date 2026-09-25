import { useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { fromKey, isToday, todayKey } from "@/lib/tracker/dates";
import { useTracker } from "@/lib/tracker/store";

export function NoteDeck() {
  const logs = useTracker((s) => s.logs);
  const setNote = useTracker((s) => s.setNote);
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const today = todayKey();

  const pages = useMemo(() => {
    const dates = new Set<string>([today]);
    for (const [date, log] of Object.entries(logs)) {
      if (date > today) continue;
      if (log.note?.trim()) dates.add(date);
    }
    return [...dates].sort((a, b) => (a < b ? 1 : -1));
  }, [logs, today]);

  function go(next: number) {
    const el = scroller.current;
    if (!el) return;
    const i = Math.max(0, Math.min(pages.length - 1, next));
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    setIndex(i);
  }

  return (
    <section className="rounded-xl bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-fg">Notes</h2>
          <p className="mt-1 text-sm text-muted">Swipe for older days.</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Newer note"
            disabled={index <= 0}
            onClick={() => go(index - 1)}
            className="flex size-8 items-center justify-center rounded-sm text-muted hover:text-fg disabled:opacity-30"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="min-w-10 text-center text-xs tabular-nums text-subtle">
            {index + 1}/{pages.length}
          </span>
          <button
            type="button"
            aria-label="Older note"
            disabled={index >= pages.length - 1}
            onClick={() => go(index + 1)}
            className="flex size-8 items-center justify-center rounded-sm text-muted hover:text-fg disabled:opacity-30"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          if (!el.clientWidth) return;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="mt-4 flex w-full flex-nowrap snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {pages.map((date) => {
          const when = isToday(date) ? "Today" : format(fromKey(date), "d MMMM");
          return (
            <div key={date} className="min-w-full shrink-0 snap-center">
              <p className="mb-2 text-xs tracking-wide text-subtle uppercase">{when}</p>
              <Textarea
                value={logs[date]?.note ?? ""}
                onChange={(e) => setNote(e.target.value, date)}
                placeholder={isToday(date) ? "What stayed with you." : "Nothing written."}
                className="min-h-32 rounded-lg bg-bg shadow-none"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
