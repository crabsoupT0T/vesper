export const WIDGET_KINDS = ["today", "streak", "mood"] as const;
export type WidgetKind = (typeof WIDGET_KINDS)[number];

export const WIDGET_META: Record<WidgetKind, { title: string; hint: string }> = {
  today: { title: "Today", hint: "Completion for this day" },
  streak: { title: "Streak", hint: "Longest run still going" },
  mood: { title: "Mood", hint: "How the day was marked" },
};

type DeferredInstall = {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferredInstall: DeferredInstall | null = null;
let listening = false;

export function listenForInstallPrompt() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstall = event as unknown as DeferredInstall;
    window.dispatchEvent(new Event("vesper-install-ready"));
  });
  window.addEventListener("appinstalled", () => {
    deferredInstall = null;
    window.dispatchEvent(new Event("vesper-installed"));
  });
}

export function canPromptInstall() {
  return deferredInstall != null;
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true
  );
}

export function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const iPadOs = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iOS || iPadOs;
}

export async function installApp(): Promise<"installed" | "prompted" | "ios" | "manual"> {
  if (isStandalone()) return "installed";
  if (deferredInstall) {
    await deferredInstall.prompt();
    const { outcome } = await deferredInstall.userChoice;
    deferredInstall = null;
    return outcome === "accepted" ? "installed" : "prompted";
  }
  if (isIosDevice()) {
    window.location.assign("/?install=1&platform=ios");
    return "ios";
  }
  return "manual";
}

export function widgetPath(kind: WidgetKind) {
  return `/widget/${kind}`;
}

export function widgetUrl(kind: WidgetKind) {
  if (typeof window === "undefined") return widgetPath(kind);
  return `${window.location.origin}${widgetPath(kind)}`;
}

export async function registerVesperWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
  } catch {
    return null;
  }
}

export async function requestNotifyPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  const perm = await Notification.requestPermission();
  if (perm === "granted") await registerVesperWorker();
  return perm;
}

export function notifyPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function showNudge(title: string, body: string, url = "/") {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  const ready = "serviceWorker" in navigator ? await navigator.serviceWorker.ready.catch(() => null) : null;
  if (ready) {
    await ready.showNotification(title, {
      body,
      icon: "/__grok/icon-180.png",
      data: { url },
    });
    return;
  }
  new Notification(title, { body, icon: "/__grok/icon-180.png" });
}
