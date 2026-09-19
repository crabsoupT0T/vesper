import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { WidgetCard } from "@/components/tracker/widget-card";
import { Button } from "@/components/ui/button";
import {
  WIDGET_KINDS,
  WIDGET_META,
  installApp,
  isIosDevice,
  isStandalone,
  type WidgetKind,
} from "@/lib/pwa";

export const Route = createFileRoute("/widget/$kind")({
  validateSearch: (search: Record<string, unknown>): { pin?: boolean } => ({
    pin:
      search.pin === "1" ||
      search.pin === 1 ||
      search.pin === "true" ||
      search.pin === true,
  }),
  beforeLoad: ({ params }) => {
    if (!WIDGET_KINDS.includes(params.kind as WidgetKind)) {
      throw redirect({ to: "/" });
    }
  },
  component: WidgetPage,
});

function WidgetPage() {
  const { kind } = Route.useParams();
  const { pin } = Route.useSearch();
  const widget = kind as WidgetKind;
  const [status, setStatus] = useState("");
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setIos(isIosDevice());
    setInstalled(isStandalone());
  }, []);

  async function addToHome() {
    const result = await installApp();
    if (result === "installed") {
      setInstalled(true);
      setStatus("Vesper is on your home screen.");
    } else if (result === "ios") setStatus("Follow the steps to add it.");
    else if (result === "manual") {
      setStatus(
        ios
          ? "Share, then Add to Home Screen."
          : "Use your browser menu and choose Add to Home Screen.",
      );
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg px-5 py-8 text-fg">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6">
        <WidgetCard kind={widget} />
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">
            {WIDGET_META[widget].hint}. Download Vesper to pin this glance — white V on
            black.
          </p>
          {!installed ? (
            <Button onClick={addToHome}>Download Vesper</Button>
          ) : (
            <p className="text-sm text-fg">Vesper is already downloaded on this device.</p>
          )}
          {status ? <p className="text-sm text-subtle">{status}</p> : null}
          {pin && !installed ? (
            <p className="text-sm text-subtle">
              {ios
                ? "On iPhone: tap Share, then Add to Home Screen. That is the permission."
                : "Your browser will ask to install Vesper. Accept to add the app and this glance."}
            </p>
          ) : null}
          <Button variant="ghost" asChild>
            <Link to="/">Open Vesper</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
