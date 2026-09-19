import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { HABIT_COLOR_SWATCH, HABIT_ICON_MAP } from "@/lib/tracker/icons";
import { HABIT_TEMPLATES } from "@/lib/tracker/templates";
import {
  HABIT_COLORS,
  HABIT_ICON_IDS,
  PARTS_OF_DAY,
  type Frequency,
  type Habit,
  type HabitColor,
  type HabitDraft,
  type HabitIconId,
  type HabitKind,
  type PartOfDay,
  type Polarity,
} from "@/lib/tracker/types";

const WEEK_DAYS = [
  { label: "M", value: 1 },
  { label: "T", value: 2 },
  { label: "W", value: 3 },
  { label: "T", value: 4 },
  { label: "F", value: 5 },
  { label: "S", value: 6 },
  { label: "S", value: 0 },
];

const PART_LABEL: Record<PartOfDay, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  any: "Anytime",
};

type WhenKind = "daily" | "weekly" | "times";

type Draft = {
  name: string;
  icon: HabitIconId;
  color: HabitColor;
  when: WhenKind;
  days: number[];
  times: number;
  partOfDay: PartOfDay;
  kind: HabitKind;
  target: number;
  unit: string;
  polarity: Polarity;
};

function fromHabit(habit?: Habit): Draft {
  if (!habit) {
    return {
      name: "",
      icon: "footprints",
      color: "sage",
      when: "daily",
      days: [1, 2, 3, 4, 5],
      times: 3,
      partOfDay: "any",
      kind: "check",
      target: 8,
      unit: "",
      polarity: "keep",
    };
  }
  return {
    name: habit.name,
    icon: habit.icon,
    color: habit.color,
    when:
      habit.frequency.kind === "times"
        ? "times"
        : habit.frequency.kind === "weekly"
          ? "weekly"
          : "daily",
    days: habit.frequency.kind === "weekly" ? habit.frequency.days : [1, 2, 3, 4, 5],
    times: habit.frequency.kind === "times" ? habit.frequency.count : 3,
    partOfDay: habit.partOfDay ?? "any",
    kind: habit.kind ?? "check",
    target: habit.target ?? 8,
    unit: habit.unit ?? "",
    polarity: habit.polarity ?? "keep",
  };
}

function toFrequency(draft: Draft): Frequency {
  if (draft.when === "times") return { kind: "times", count: draft.times };
  if (draft.when === "weekly") {
    return { kind: "weekly", days: draft.days.length ? draft.days : [1, 2, 3, 4, 5] };
  }
  return { kind: "daily" };
}

function toDraft(input: HabitDraft): Draft {
  return {
    name: input.name,
    icon: input.icon,
    color: input.color,
    when:
      input.frequency.kind === "times"
        ? "times"
        : input.frequency.kind === "weekly"
          ? "weekly"
          : "daily",
    days: input.frequency.kind === "weekly" ? input.frequency.days : [1, 2, 3, 4, 5],
    times: input.frequency.kind === "times" ? input.frequency.count : 3,
    partOfDay: input.partOfDay,
    kind: input.kind,
    target: input.target,
    unit: input.unit,
    polarity: input.polarity,
  };
}

type Props = {
  habit?: Habit;
  onSubmit: (value: HabitDraft) => void;
  submitLabel: string;
  showTemplates?: boolean;
};

export function HabitForm({ habit, onSubmit, submitLabel, showTemplates }: Props) {
  const [draft, setDraft] = useState<Draft>(() => fromHabit(habit));

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!draft.name.trim()) return;
        onSubmit({
          name: draft.name,
          icon: draft.icon,
          color: draft.color,
          frequency: toFrequency(draft),
          partOfDay: draft.partOfDay,
          kind: draft.kind,
          target: draft.kind === "count" ? Math.max(1, Number(draft.target) || 1) : 1,
          unit: draft.unit,
          polarity: draft.polarity,
        });
      }}
    >
      {showTemplates ? (
        <div className="flex flex-col gap-2">
          <Label>Start from</Label>
          <div className="flex flex-wrap gap-1.5">
            {HABIT_TEMPLATES.map((tpl) => (
              <button
                key={tpl.name}
                type="button"
                onClick={() => setDraft(toDraft(tpl))}
                className="h-9 rounded-md bg-surface-2 px-3 text-xs font-medium text-muted hover:text-fg"
              >
                {tpl.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="habit-name">Name</Label>
        <Input
          id="habit-name"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="Morning walk"
          autoFocus
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Mark</Label>
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-8">
          {HABIT_ICON_IDS.map((id) => {
            const Icon = HABIT_ICON_MAP[id];
            const selected = draft.icon === id;
            return (
              <button
                key={id}
                type="button"
                aria-label={id}
                aria-pressed={selected}
                onClick={() => setDraft({ ...draft, icon: id })}
                className={cn(
                  "flex size-10 items-center justify-center rounded-sm transition-colors duration-[var(--motion-quick)]",
                  selected ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted hover:text-fg",
                )}
              >
                <Icon className="size-4" strokeWidth={1.75} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Color</Label>
        <div className="flex gap-2">
          {HABIT_COLORS.map((color) => {
            const selected = draft.color === color;
            return (
              <button
                key={color}
                type="button"
                aria-label={color}
                aria-pressed={selected}
                onClick={() => setDraft({ ...draft, color })}
                className={cn(
                  "size-8 rounded-full transition-transform duration-[var(--motion-quick)]",
                  HABIT_COLOR_SWATCH[color],
                  selected
                    ? "scale-110 ring-2 ring-fg ring-offset-2 ring-offset-surface"
                    : "opacity-70 hover:opacity-100",
                )}
              />
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Time of day</Label>
        <div className="grid grid-cols-4 gap-1.5">
          {PARTS_OF_DAY.map((part) => (
            <button
              key={part}
              type="button"
              onClick={() => setDraft({ ...draft, partOfDay: part })}
              className={cn(
                "h-10 rounded-md text-xs font-medium transition-colors duration-[var(--motion-quick)]",
                draft.partOfDay === part
                  ? "bg-accent text-accent-fg"
                  : "bg-surface-2 text-muted",
              )}
            >
              {PART_LABEL[part]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Aim</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDraft({ ...draft, polarity: "keep" })}
            className={cn(
              "h-10 flex-1 rounded-md text-sm font-medium",
              draft.polarity === "keep" ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted",
            )}
          >
            Keep
          </button>
          <button
            type="button"
            onClick={() => setDraft({ ...draft, polarity: "avoid" })}
            className={cn(
              "h-10 flex-1 rounded-md text-sm font-medium",
              draft.polarity === "avoid" ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted",
            )}
          >
            Avoid
          </button>
        </div>
        <p className="text-xs text-subtle">
          {draft.polarity === "avoid"
            ? draft.kind === "count"
              ? "Stay at or under the limit."
              : "Mark the day when you held the line."
            : "Mark the day when you did the thing."}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Track as</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDraft({ ...draft, kind: "check" })}
            className={cn(
              "h-10 flex-1 rounded-md text-sm font-medium",
              draft.kind === "check" ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted",
            )}
          >
            Check
          </button>
          <button
            type="button"
            onClick={() => setDraft({ ...draft, kind: "count" })}
            className={cn(
              "h-10 flex-1 rounded-md text-sm font-medium",
              draft.kind === "count" ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted",
            )}
          >
            Count
          </button>
        </div>
        {draft.kind === "count" ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="habit-target">
                {draft.polarity === "avoid" ? "Limit" : "Target"}
              </Label>
              <Input
                id="habit-target"
                type="number"
                min={1}
                value={draft.target}
                onChange={(e) => setDraft({ ...draft, target: Number(e.target.value) })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="habit-unit">Unit</Label>
              <Input
                id="habit-unit"
                value={draft.unit}
                onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                placeholder="pages"
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label>When</Label>
        <div className="grid grid-cols-3 gap-1.5">
          {(
            [
              ["daily", "Every day"],
              ["weekly", "Days"],
              ["times", "N / week"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setDraft({ ...draft, when: value })}
              className={cn(
                "h-10 rounded-md text-sm font-medium transition-colors duration-[var(--motion-quick)]",
                draft.when === value ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {draft.when === "weekly" ? (
          <div className="mt-1 flex gap-1.5">
            {WEEK_DAYS.map((day, i) => {
              const on = draft.days.includes(day.value);
              return (
                <button
                  key={`${day.value}-${i}`}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    const days = on
                      ? draft.days.filter((d) => d !== day.value)
                      : [...draft.days, day.value];
                    setDraft({ ...draft, days });
                  }}
                  className={cn(
                    "h-10 flex-1 rounded-md text-xs font-medium tabular-nums transition-colors duration-[var(--motion-quick)]",
                    on ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted",
                  )}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        ) : null}
        {draft.when === "times" ? (
          <div className="mt-1 flex gap-1.5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setDraft({ ...draft, times: n })}
                className={cn(
                  "h-10 flex-1 rounded-md text-xs font-medium tabular-nums",
                  draft.times === n ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <Button type="submit" className="mt-1 w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
