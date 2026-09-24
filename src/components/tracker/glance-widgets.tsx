import { HabitChecklist } from "@/components/tracker/habit-checklist";
import { WidgetLink } from "@/components/tracker/widget-card";
import { WIDGET_KINDS } from "@/lib/pwa";
import { useTracker } from "@/lib/tracker/store";
import { cn } from "@/lib/utils";

export function GlanceWidgets() {
  const widgets = useTracker((s) => s.widgets);
  const active = WIDGET_KINDS.filter((kind) => widgets[kind]);
  const cards = active.filter((kind) => kind !== "habits");
  if (active.length === 0) return null;
  return (
    <div className="rise rise-2 flex flex-col gap-2">
      {widgets.habits ? <HabitChecklist /> : null}
      {cards.length > 0 ? (
        <div
          className={cn(
            "grid grid-cols-1 gap-2",
            cards.length === 2 && "sm:grid-cols-2",
            cards.length >= 3 && "sm:grid-cols-3",
          )}
        >
          {cards.map((kind) => (
            <WidgetLink key={kind} kind={kind} />
          ))}
        </div>
      ) : null}
    </div>
  );
}