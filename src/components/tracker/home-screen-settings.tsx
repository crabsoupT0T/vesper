import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { WidgetCard } from "@/components/tracker/widget-card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  WIDGET_KINDS,
  WIDGET_META,
  installApp,
  isIosDevice,
  isStandalone,
  listenForInstallPrompt,
  notifyPermission,
  requestNotifyPermission,
  type WidgetKind,
} from "@/lib/pwa";
import { useTracker } from "@/lib/tracker/store";

export function HomeScreenSettings() {
  const navigate = useNavigate();
  const widgets = useTracker((s) => s.widgets);
  const setWidgetEnabled = useTracker((s) => s.setWidgetEnabled);
  const reminderOn = useTracker((s) => s.reminderOn);
  const setReminderOn = useTracker((s) => s.setReminderOn);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [notify, setNotify] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    listenForInstallPrompt();
    setInstalled(isStandalone());
    setIos(isIosDevice());
    setNotify(notifyPermission());
    const onDone = () => {
      setInstalled(true);
    };
    window.addEventListener("vesper-installed", onDone);
    return () => {
      window.removeEventListener("vesper-installed", onDone);
    };
  }, []);

  async function onInstall() {
    const result = await installApp();
    if (result === "installed") {
      setInstalled(true);
      toast("Vesper is downloaded to this device.");
    } else if (result === "manual") {
      toast(
        ios
          ? "Open Share, then Add to Home Screen."
          : "Use the browser menu and choose Add to Home Screen.",
      );
    }
  }

  async function onReminder(next: boolean) {
    if (!next) {
      setReminderOn(false);
      return;
    }
    const perm = await requestNotifyPermission();
    setNotify(perm);
    if (perm === "granted") {
      setReminderOn(true);
      toast("Evening reminder is on.");
      return;
    }
    if (perm === "unsupported") toast("This browser cannot send reminders.");
    else toast("Notifications were not allowed.");
  }

  function addWidget(kind: WidgetKind) {
    setWidgetEnabled(kind, true);
    void navigate({ to: "/widget/$kind", params: { kind }, search: { pin: true } });
  }

  const installLabel = installed ? "Downloaded" : "Download Vesper";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-fg">Download</p>
        <p className="text-sm text-muted">
          Save Vesper to your phone. The mark is a white V on black. Your phone will
          ask to add it.
        </p>
        <Button onClick={onInstall} disabled={installed}>
          {installLabel}
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-fg">Evening reminder</p>
          <p className="text-sm text-muted">
            Asks for notification permission. Nudges you if the day is still open.
          </p>
        </div>
        <Switch
          checked={reminderOn && notify === "granted"}
          onCheckedChange={onReminder}
          aria-label="Evening reminder"
        />
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-medium text-fg">Widgets</p>
          <p className="text-sm text-muted">
            Pin a glance, then allow Vesper on the home screen. Turn one off to hide it
            here.
          </p>
        </div>
        {WIDGET_KINDS.map((kind) => (
          <div key={kind} className="rounded-lg bg-bg p-3 shadow-[var(--shadow-border)]">
            <div className="pointer-events-none">
              <WidgetCard kind={kind} compact />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-sm text-muted">{WIDGET_META[kind].hint}</p>
              <div className="flex items-center gap-2">
                <Switch
                  checked={widgets[kind]}
                  onCheckedChange={(on) => setWidgetEnabled(kind, on)}
                  aria-label={`${WIDGET_META[kind].title} widget`}
                />
                <Button size="sm" variant="outline" onClick={() => addWidget(kind)}>
                  Add
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
