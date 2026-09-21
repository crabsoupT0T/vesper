import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  Link,
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { TrackerApp } from "@/components/tracker/tracker-app";
import { WidgetCard } from "@/components/tracker/widget-card";
import { Button } from "@/components/ui/button";
import { WIDGET_KINDS, type WidgetKind } from "@/lib/pwa";
import "./styles.css";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: TrackerApp,
});

const widgetRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/widget/$kind",
  validateSearch: (search: Record<string, unknown>): { pin?: boolean } => ({
    pin: search.pin === true || search.pin === "true" || search.pin === "1",
  }),
  component: ApkWidgetPage,
});

function ApkWidgetPage() {
  const { kind } = widgetRoute.useParams();
  const widget = (WIDGET_KINDS.includes(kind as WidgetKind) ? kind : "today") as WidgetKind;
  return (
    <div className="flex min-h-dvh flex-col bg-bg px-5 py-8 text-fg">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6">
        <WidgetCard kind={widget} />
        <Button variant="ghost" asChild>
          <Link to="/">Back to Vesper</Link>
        </Button>
      </div>
    </div>
  );
}

const router = createRouter({
  routeTree: rootRoute.addChildren([indexRoute, widgetRoute]),
  history: createMemoryHistory({ initialEntries: ["/"] }),
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
