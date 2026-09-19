import { useEffect, useState } from "react";
import { AppShell } from "@/components/tracker/app-shell";
import { HabitsView } from "@/components/tracker/habits-view";
import { HistoryView } from "@/components/tracker/history-view";
import { InsightsView } from "@/components/tracker/insights-view";
import { SettingsSheet } from "@/components/tracker/settings-sheet";
import { TodayView } from "@/components/tracker/today-view";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { fromKey, todayKey } from "@/lib/tracker/dates";
import { completionOf } from "@/lib/tracker/logic";
import { useTracker } from "@/lib/tracker/store";
import {
  listenForInstallPrompt,
  notifyPermission,
  registerVesperWorker,
  showNudge,
} from "@/lib/pwa";

export function TrackerApp() {
  const view = useTracker((s) => s.view);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    listenForInstallPrompt();
    void registerVesperWorker();
    const state = useTracker.getState();
    if (!state.reminderOn) return;
    if (notifyPermission() !== "granted") return;
    const key = todayKey();
    if (state.lastNudgeKey === key) return;
    if (new Date().getHours() < 18) return;
    const stats = completionOf(state.habits, state.logs, fromKey(key));
    if (stats.due === 0 || stats.ratio >= 1) return;
    void showNudge("Vesper", `${stats.done} of ${stats.due} still open.`);
    state.setLastNudgeKey(key);
  }, []);

  return (
    <TooltipProvider>
      <AppShell onOpenSettings={() => setSettingsOpen(true)}>
        {view === "today" ? <TodayView /> : null}
        {view === "history" ? <HistoryView /> : null}
        {view === "insights" ? <InsightsView /> : null}
        {view === "habits" ? <HabitsView /> : null}
      </AppShell>
      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
      <Toaster />
    </TooltipProvider>
  );
}
