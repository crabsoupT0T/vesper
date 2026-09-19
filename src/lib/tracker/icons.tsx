import type { LucideIcon } from "lucide-react";
import {
  Bike,
  BookOpen,
  Brain,
  Coffee,
  Droplets,
  Dumbbell,
  Focus,
  Footprints,
  Heart,
  Leaf,
  Moon,
  Music,
  PenLine,
  Sun,
  Timer,
  Waves,
} from "lucide-react";
import type { HabitColor, HabitIconId } from "./types";

export const HABIT_ICON_MAP: Record<HabitIconId, LucideIcon> = {
  footprints: Footprints,
  book: BookOpen,
  droplets: Droplets,
  dumbbell: Dumbbell,
  moon: Moon,
  pen: PenLine,
  sun: Sun,
  heart: Heart,
  leaf: Leaf,
  music: Music,
  coffee: Coffee,
  brain: Brain,
  bike: Bike,
  timer: Timer,
  focus: Focus,
  waves: Waves,
};

export const HABIT_COLOR_CLASS: Record<HabitColor, string> = {
  stone: "text-habit-stone bg-habit-stone/15",
  sage: "text-habit-sage bg-habit-sage/15",
  slate: "text-habit-slate bg-habit-slate/15",
  clay: "text-habit-clay bg-habit-clay/15",
  mist: "text-habit-mist bg-habit-mist/15",
  ink: "text-habit-ink bg-habit-ink/15",
};

export const HABIT_COLOR_FILL: Record<HabitColor, string> = {
  stone: "bg-habit-stone",
  sage: "bg-habit-sage",
  slate: "bg-habit-slate",
  clay: "bg-habit-clay",
  mist: "bg-habit-mist",
  ink: "bg-habit-ink",
};

export const HABIT_COLOR_SWATCH: Record<HabitColor, string> = {
  stone: "bg-habit-stone",
  sage: "bg-habit-sage",
  slate: "bg-habit-slate",
  clay: "bg-habit-clay",
  mist: "bg-habit-mist",
  ink: "bg-habit-ink",
};
