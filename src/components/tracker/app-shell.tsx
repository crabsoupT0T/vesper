import type { ReactNode } from "react";
import { BarChart3, CalendarDays, ListChecks, Settings, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NightSky, useSceneLighting } from "@/components/tracker/scene-light";
import { MeteorShower } from "@/components/tracker/silk-mark";
import { useTracker, type ViewId } from "@/lib/tracker/store";

const NAV: { id: ViewId; label: string; Icon: typeof Star }[] = [
  { id: "today", label: "Today", Icon: Star },
  { id: "history", label: "History", Icon: CalendarDays },
  { id: "insights", label: "Insights", Icon: BarChart3 },
  { id: "habits", label: "Habits", Icon: ListChecks },
];

function Wordmark() {
  return (
    <span className="flex items-center gap-2">
      <svg viewBox="0 0 16 16" className="size-3.5 text-fg" aria-hidden>
        <path fill="currentColor" d="M2.2 2.6h2.6l2.4 6.4 2.4-6.4h2.6L8.7 13.6H6.3L2.2 2.6z" />
        <path fill="currentColor" d="M1.5 5.8 6.1 2.2l1 .9-4.6 3.6z" />
      </svg>
      <span className="font-display text-lg font-medium tracking-tight text-fg">Vesper</span>
    </span>
  );
}

type Props = {
  onOpenSettings: () => void;
  children: ReactNode;
};

export function AppShell({ onOpenSettings, children }: Props) {
  const view = useTracker((s) => s.view);
  const setView = useTracker((s) => s.setView);
  const { phase } = useSceneLighting();

  return (
    <div className="scene min-h-dvh overflow-x-hidden bg-bg text-fg" data-light={phase}>
      <NightSky />
      <MeteorShower />
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-5xl">
        <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-border px-4 py-6 md:flex">
          <div className="flex items-center justify-between px-2">
            <Wordmark />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Settings"
              onClick={onOpenSettings}
            >
              <Settings className="size-4" />
            </Button>
          </div>
          <nav className="mt-8 flex flex-col gap-1">
            {NAV.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-[var(--motion-quick)]",
                  view === id
                    ? "bg-surface text-fg"
                    : "text-muted hover:bg-surface-2 hover:text-fg",
                )}
              >
                <Icon className="size-4" strokeWidth={1.75} />
                {label}
              </button>
            ))}
          </nav>
          <p className="mt-auto px-3 text-xs leading-relaxed text-subtle">
            A quiet tracker for the days you actually live.
          </p>
        </aside>

        <div className="relative flex min-w-0 flex-1 flex-col">
          <header className="relative z-10 flex items-center justify-between px-5 pt-5 pb-1 md:hidden">
            <Wordmark />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Settings"
              onClick={onOpenSettings}
            >
              <Settings className="size-4" />
            </Button>
          </header>
          <main className="relative z-10 flex-1 px-5 pt-3 pb-28 md:px-10 md:pt-2 md:pb-16">
            <div className="mx-auto w-full max-w-xl">{children}</div>
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-4">
          {NAV.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium tracking-wide",
                view === id ? "text-fg" : "text-subtle",
              )}
            >
              <Icon className="size-4" strokeWidth={1.75} />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
