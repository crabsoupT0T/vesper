import { useEffect, useState } from "react";
import { installApp, isIosDevice, isStandalone, listenForInstallPrompt } from "@/lib/pwa";
import { useTracker } from "@/lib/tracker/store";

export function InstallHint() {
  const hide = useTracker((s) => s.hideInstallHint);
  const setHide = useTracker((s) => s.setHideInstallHint);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    listenForInstallPrompt();
    setVisible(!hide && !isStandalone());
  }, [hide]);

  if (!visible) return null;

  return (
    <div className="rise flex items-center justify-between gap-3 rounded-md bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
      <p className="text-sm text-muted">Download Vesper to your home screen.</p>
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          className="text-sm text-fg underline-offset-4 hover:underline"
          onClick={() => {
            void installApp();
            if (!isIosDevice()) setHide(true);
          }}
        >
          Download
        </button>
        <button
          type="button"
          className="text-sm text-subtle hover:text-muted"
          onClick={() => setHide(true)}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
