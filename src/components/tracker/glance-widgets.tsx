import { WidgetLink } from "@/components/tracker/widget-card";
import { WIDGET_KINDS } from "@/lib/pwa";
import { useTracker } from "@/lib/tracker/store";
import { cn } from "@/lib/utils";

export function GlanceWidgets() {
  const widgets = useTracker((s) => s.widgets);
  const active = WIDGET_KINDS.filter((kind) => widgets[kind]);
  if (active.length === 0) return null;
  return (
    <div
      className={cn(
        "rise rise-2 grid grid-cols-1 gap-2",
        active.length === 2 && "sm:grid-cols-2",
        active.length >= 3 && "sm:grid-cols-3",
      )}
    >
      {active.map((kind) => (
        <WidgetLink key={kind} kind={kind} />
      ))}
    </div>
  );
}
