import { useState } from "react";
import { ChevronDown, ChevronUp, MoreHorizontal, Plus } from "lucide-react";
import { HabitForm } from "@/components/tracker/habit-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HABIT_COLOR_CLASS, HABIT_ICON_MAP } from "@/lib/tracker/icons";
import { streakFor, strengthFor } from "@/lib/tracker/logic";
import { useTracker } from "@/lib/tracker/store";
import type { Habit } from "@/lib/tracker/types";
import { cn } from "@/lib/utils";

function frequencyLabel(habit: Habit): string {
  const part = { morning: "Morning", afternoon: "Afternoon", evening: "Evening", any: "Anytime" }[
    habit.partOfDay ?? "any"
  ];
  const freq =
    habit.frequency.kind === "daily"
      ? "Every day"
      : habit.frequency.kind === "times"
        ? `${habit.frequency.count}× a week`
        : [1, 2, 3, 4, 5, 6, 0]
            .filter((d) => habit.frequency.kind === "weekly" && habit.frequency.days.includes(d))
            .map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d])
            .join(" · ");
  const count =
    habit.kind === "count"
      ? ` · ${habit.polarity === "avoid" ? "≤" : ""}${habit.target} ${habit.unit || ""}`.trim()
      : "";
  const aim = habit.polarity === "avoid" ? " · Avoid" : "";
  const pause = habit.paused ? " · Paused" : "";
  return `${part} · ${freq}${count}${aim}${pause}`;
}

export function HabitsView() {
  const habits = useTracker((s) => s.habits);
  const logs = useTracker((s) => s.logs);
  const addHabit = useTracker((s) => s.addHabit);
  const updateHabit = useTracker((s) => s.updateHabit);
  const archiveHabit = useTracker((s) => s.archiveHabit);
  const restoreHabit = useTracker((s) => s.restoreHabit);
  const deleteHabit = useTracker((s) => s.deleteHabit);
  const setPaused = useTracker((s) => s.setPaused);
  const moveHabit = useTracker((s) => s.moveHabit);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Habit | null>(null);

  const active = habits.filter((h) => !h.archived).sort((a, b) => a.order - b.order);
  const archived = habits.filter((h) => h.archived);

  return (
    <div className="flex flex-col gap-8">
      <header className="rise flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Your own</p>
          <h1 className="mt-1 font-display text-4xl font-medium tracking-tight text-fg">
            Habits
          </h1>
          {active.length >= 12 ? (
            <p className="mt-2 text-sm text-subtle">A short list is easier to keep.</p>
          ) : null}
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          Add
        </Button>
      </header>

      <section className="rise rise-2">
        {active.length === 0 ? (
          <div className="rounded-xl bg-surface px-4 py-12 text-center">
            <p className="text-sm text-muted">No active habits.</p>
            <Button className="mt-4" onClick={() => setCreating(true)}>
              Add a habit
            </Button>
          </div>
        ) : (
          <ul className="rounded-xl bg-surface p-2">
            {active.map((habit, index) => {
              const Icon = HABIT_ICON_MAP[habit.icon];
              const streak = streakFor(habit, logs);
              const strength = strengthFor(habit, logs);
              return (
                <li
                  key={habit.id}
                  className={cn(
                    "flex min-h-14 items-center gap-3 rounded-lg px-3 py-2",
                    habit.paused && "opacity-60",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-md",
                      HABIT_COLOR_CLASS[habit.color],
                    )}
                  >
                    <Icon className="size-4" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-fg">
                      {habit.name}
                    </span>
                    <span className="block truncate text-xs text-subtle">
                      {frequencyLabel(habit)}
                      {streak > 0 ? ` · ${streak}d` : ""}
                      {` · ${strength}%`}
                    </span>
                  </span>
                  <div className="flex shrink-0 flex-col">
                    <button
                      type="button"
                      aria-label="Move up"
                      disabled={index === 0}
                      onClick={() => moveHabit(habit.id, -1)}
                      className="flex size-7 items-center justify-center text-subtle hover:text-fg disabled:opacity-20"
                    >
                      <ChevronUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Move down"
                      disabled={index === active.length - 1}
                      onClick={() => moveHabit(habit.id, 1)}
                      className="flex size-7 items-center justify-center text-subtle hover:text-fg disabled:opacity-20"
                    >
                      <ChevronDown className="size-3.5" />
                    </button>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label="Habit actions">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setEditing(habit)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setPaused(habit.id, !habit.paused)}>
                        {habit.paused ? "Resume" : "Pause"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => archiveHabit(habit.id)}>
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => setPendingDelete(habit)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {archived.length > 0 ? (
        <section>
          <h2 className="mb-2 px-1 text-sm font-medium text-muted">Archived</h2>
          <ul className="rounded-xl bg-surface p-2">
            {archived.map((habit) => {
              const Icon = HABIT_ICON_MAP[habit.icon];
              return (
                <li
                  key={habit.id}
                  className="flex min-h-12 items-center gap-3 rounded-lg px-3 py-2"
                >
                  <span className="flex size-9 items-center justify-center rounded-md bg-surface-2 text-subtle">
                    <Icon className="size-4" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-muted">
                    {habit.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => restoreHabit(habit.id)}
                  >
                    Restore
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setPendingDelete(habit)}
                  >
                    Delete
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New habit</DialogTitle>
            <DialogDescription>Something you want to keep — or leave alone.</DialogDescription>
          </DialogHeader>
          <HabitForm
            showTemplates
            submitLabel="Add habit"
            onSubmit={(value) => {
              addHabit(value);
              setCreating(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit habit</DialogTitle>
            <DialogDescription>Adjust the name, mark, or days.</DialogDescription>
          </DialogHeader>
          {editing ? (
            <HabitForm
              key={editing.id}
              habit={editing}
              submitLabel="Save"
              onSubmit={(value) => {
                updateHabit(editing.id, value);
                setEditing(null);
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this habit?</AlertDialogTitle>
            <AlertDialogDescription>
              Marks for {pendingDelete?.name} will be removed from the record. This cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-fg hover:opacity-90"
              onClick={() => {
                if (pendingDelete) deleteHabit(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
