export const HABIT_COLORS = [
  "stone",
  "sage",
  "slate",
  "clay",
  "mist",
  "ink",
] as const;

export type HabitColor = (typeof HABIT_COLORS)[number];

export const HABIT_ICON_IDS = [
  "footprints",
  "book",
  "droplets",
  "dumbbell",
  "moon",
  "pen",
  "sun",
  "heart",
  "leaf",
  "music",
  "coffee",
  "brain",
  "bike",
  "timer",
  "focus",
  "waves",
] as const;

export type HabitIconId = (typeof HABIT_ICON_IDS)[number];

export const PARTS_OF_DAY = ["morning", "afternoon", "evening", "any"] as const;
export type PartOfDay = (typeof PARTS_OF_DAY)[number];

export type HabitKind = "check" | "count";
export type Polarity = "keep" | "avoid";

export type Frequency =
  | { kind: "daily" }
  | { kind: "weekly"; days: number[] }
  | { kind: "times"; count: number };

export type Habit = {
  id: string;
  name: string;
  icon: HabitIconId;
  color: HabitColor;
  frequency: Frequency;
  archived: boolean;
  createdAt: string;
  order: number;
  partOfDay: PartOfDay;
  kind: HabitKind;
  target: number;
  unit: string;
  polarity: Polarity;
  paused: boolean;
};

export type Mood = 1 | 2 | 3 | 4 | 5;

export const FACTORS = ["sleep", "people", "work", "move", "rest", "out"] as const;
export type Factor = (typeof FACTORS)[number];

export const FEELINGS = [
  "glad",
  "open",
  "alive",
  "calm",
  "soft",
  "content",
  "tense",
  "restless",
  "sharp",
  "heavy",
  "flat",
  "tired",
  "steady",
  "mixed",
  "okay",
] as const;
export type Feeling = (typeof FEELINGS)[number];

export type DayTask = {
  id: string;
  title: string;
  done: boolean;
  important: boolean;
};

export type DayLog = {
  date: string;
  mood?: Mood;
  energy?: Mood;
  feeling?: Feeling;
  factors: Factor[];
  note: string;
  completed: Record<string, true>;
  values: Record<string, number>;
  skipped: Record<string, true>;
  tasks: DayTask[];
};

export type TrackerSnapshot = {
  version: 1;
  initialized: boolean;
  profileName: string;
  habits: Habit[];
  logs: Record<string, DayLog>;
};

export type HabitDraft = {
  name: string;
  icon: HabitIconId;
  color: HabitColor;
  frequency: Frequency;
  partOfDay: PartOfDay;
  kind: HabitKind;
  target: number;
  unit: string;
  polarity: Polarity;
};
