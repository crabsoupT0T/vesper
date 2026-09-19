import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { HomeScreenSettings } from "@/components/tracker/home-screen-settings";
import { snapshotToCsv } from "@/lib/tracker/logic";
import { useTracker } from "@/lib/tracker/store";
import type { TrackerSnapshot } from "@/lib/tracker/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function download(filename: string, contents: string, type: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function SettingsSheet({ open, onOpenChange }: Props) {
  const profileName = useTracker((s) => s.profileName);
  const setProfileName = useTracker((s) => s.setProfileName);
  const exportSnapshot = useTracker((s) => s.exportSnapshot);
  const importSnapshot = useTracker((s) => s.importSnapshot);
  const resetDemo = useTracker((s) => s.resetDemo);
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [name, setName] = useState(profileName);

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(next) => {
          if (next) setName(useTracker.getState().profileName);
          onOpenChange(next);
        }}
      >
        <SheetContent side="bottom" className="mx-auto h-fit w-full max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Your tracker</SheetTitle>
            <SheetDescription>
              Vesper lives on this device. Give it a name, or take your data with you.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 flex flex-col gap-6">
            <HomeScreenSettings />

            <div className="flex flex-col gap-2">
              <Label htmlFor="profile-name">What should we call you</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setProfileName(name.trim())}
                placeholder="Optional"
                maxLength={32}
              />
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-fg">Data</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    download(
                      "vesper-tracker.json",
                      JSON.stringify(exportSnapshot(), null, 2),
                      "application/json",
                    );
                    toast("Saved a copy of your tracker.");
                  }}
                >
                  Export
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    const snap = exportSnapshot();
                    download(
                      "vesper-tracker.csv",
                      snapshotToCsv(snap.habits, snap.logs),
                      "text/csv",
                    );
                    toast("Saved a spreadsheet of your days.");
                  }}
                >
                  CSV
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => fileRef.current?.click()}
                >
                  Import
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    try {
                      const text = await file.text();
                      const parsed = JSON.parse(text) as TrackerSnapshot;
                      if (parsed.version !== 1 || !Array.isArray(parsed.habits)) {
                        throw new Error("unrecognized");
                      }
                      importSnapshot(parsed);
                      setName(parsed.profileName ?? "");
                      toast("Imported.");
                    } catch {
                      toast("That file could not be read.");
                    }
                  }}
                />
              </div>
            </div>

            <Button variant="ghost" className="text-destructive" onClick={() => setConfirmReset(true)}>
              Reset to sample days
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start over?</AlertDialogTitle>
            <AlertDialogDescription>
              This replaces your habits and history with the sample week. Export first if
              you want a copy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep mine</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                resetDemo();
                setName("");
                setConfirmReset(false);
                toast("Sample days restored.");
              }}
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
