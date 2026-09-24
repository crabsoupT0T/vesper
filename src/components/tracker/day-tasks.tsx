import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Check, Star, X } from "lucide-react";
import { logFor } from "@/lib/tracker/logic";
import { useTracker } from "@/lib/tracker/store";
import type { DayLog, DayTask } from "@/lib/tracker/types";
import { cn } from "@/lib/utils";

type Props = {
  dateKey: string;
  locked: boolean;
  showLeftovers: boolean;
};

export function DayTasks({ dateKey, locked, showLeftovers }: Props) {
  const logs = useTracker((s) => s.logs);
  const addTask = useTracker((s) => s.addTask);
  const toggleTask = useTracker((s) => s.toggleTask);
  const toggleTaskImportant = useTracker((s) => s.toggleTaskImportant);
  const deleteTask = useTracker((s) => s.deleteTask);
  const [draft, setDraft] = useState("");

  const tasks = [...logFor(logs, dateKey).tasks].sort(
    (a, b) => Number(b.important) - Number(a.important),
  );
  const leftovers = showLeftovers ? openBefore(logs, dateKey) : [];

  function submit() {
    addTask(draft, dateKey);
    setDraft("");
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-sm font-medium text-fg">To do</h2>
        <p className="text-xs text-subtle">For this day, not a habit</p>
      </div>
      {leftovers.length > 0 ? (
        <ul className="rounded-xl bg-surface p-2">
          <li className="px-3 pt-1 pb-2 text-xs tracking-wide text-subtle uppercase">
            Still open
          </li>
          {leftovers.map(({ date, task }) => (
            <TaskLine
              key={`${date}:${task.id}`}
              task={task}
              meta={format(parseISO(date), "d MMM")}
              locked={false}
              onToggle={() => toggleTask(task.id, date)}
              onImportant={() => toggleTaskImportant(task.id, date)}
              onDelete={() => deleteTask(task.id, date)}
            />
          ))}
        </ul>
      ) : null}
      {tasks.length > 0 ? (
        <ul className="rounded-xl bg-surface p-2">
          {tasks.map((task) => (
            <TaskLine
              key={task.id}
              task={task}
              locked={locked}
              onToggle={() => toggleTask(task.id, dateKey)}
              onImportant={() => toggleTaskImportant(task.id, dateKey)}
              onDelete={() => deleteTask(task.id, dateKey)}
            />
          ))}
        </ul>
      ) : leftovers.length === 0 ? (
        <p className="px-1 text-sm text-muted">Nothing extra today.</p>
      ) : null}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!locked) submit();
        }}
      >
        <input
          value={draft}
          disabled={locked}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add something for this day"
          className="h-11 min-w-0 flex-1 rounded-md bg-surface px-3 text-sm text-fg outline-none placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={locked || !draft.trim()}
          className="h-11 shrink-0 rounded-md bg-accent px-4 text-sm font-medium text-accent-fg disabled:opacity-40"
        >
          Add
        </button>
      </form>
    </section>
  );
}

function openBefore(logs: Record<string, DayLog>, today: string) {
  const rows: { date: string; task: DayTask }[] = [];
  for (const date of Object.keys(logs).sort()) {
    if (date >= today) continue;
    for (const task of logFor(logs, date).tasks) {
      if (!task.done) rows.push({ date, task });
    }
  }
  return rows.slice(-20);
}

function TaskLine({
  task,
  meta,
  locked,
  onToggle,
  onImportant,
  onDelete,
}: {
  task: DayTask;
  meta?: string;
  locked: boolean;
  onToggle: () => void;
  onImportant: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex min-h-12 items-center gap-2 px-2">
      <button
        type="button"
        disabled={locked}
        aria-label={task.done ? "Undo" : "Done"}
        onClick={onToggle}
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-sm",
          task.done ? "bg-accent text-accent-fg" : "text-transparent shadow-[var(--shadow-border)]",
        )}
      >
        <Check className={cn("size-3.5", task.done ? "opacity-100" : "opacity-0")} strokeWidth={2.5} />
      </button>
      <span className={cn("min-w-0 flex-1 truncate text-sm", task.done ? "text-muted" : "text-fg")}>
        {task.title}
        {meta ? <span className="ml-2 text-xs text-subtle">{meta}</span> : null}
      </span>
      <button
        type="button"
        disabled={locked}
        aria-label={task.important ? "Unmark important" : "Mark important"}
        aria-pressed={task.important}
        onClick={onImportant}
        className={cn("flex size-9 items-center justify-center", task.important ? "text-fg" : "text-subtle")}
      >
        <Star className="size-3.5" fill={task.important ? "currentColor" : "none"} />
      </button>
      <button
        type="button"
        disabled={locked}
        aria-label="Delete"
        onClick={onDelete}
        className="flex size-9 items-center justify-center text-subtle hover:text-fg"
      >
        <X className="size-3.5" />
      </button>
    </li>
  );
}
