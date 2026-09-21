import { cn } from "@/lib/utils";
import { feelingLabel, feelingsFor, moodEmoji, moodLabel } from "@/lib/tracker/logic";
import type { Feeling, Mood } from "@/lib/tracker/types";

const MOODS: Mood[] = [1, 2, 3, 4, 5];

type Props = {
  mood?: Mood;
  feeling?: Feeling;
  locked?: boolean;
  onMood: (mood: Mood | undefined) => void;
  onFeeling: (feeling: Feeling | undefined) => void;
};

export function MoodPicker({ mood, feeling, locked, onMood, onFeeling }: Props) {
  const words = feelingsFor(mood);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium text-fg">How was the day</p>
          <p className="text-sm text-muted">{mood ? moodLabel(mood) : "Unmarked"}</p>
        </div>
        <div className="flex gap-2">
          {MOODS.map((option) => {
            const selected = mood === option;
            return (
              <button
                key={option}
                type="button"
                disabled={locked}
                aria-label={moodLabel(option)}
                aria-pressed={selected}
                onClick={() => onMood(selected ? undefined : option)}
                className={cn(
                  "flex h-12 flex-1 items-center justify-center rounded-md text-[1.35rem] leading-none transition-[background-color,box-shadow,transform] duration-[var(--motion-quick)] ease-[var(--ease-out)] active:scale-[0.96] disabled:opacity-50",
                  selected ? "bg-accent" : "bg-surface hover:bg-surface-2",
                )}
              >
                <span className="emoji-fallback" aria-hidden>
                  {moodEmoji(option)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {words.length > 0 ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-medium text-fg">A word</p>
            <p className="text-sm text-muted">{feeling ? feelingLabel(feeling) : "Optional"}</p>
          </div>
          <div className="flex gap-2">
            {words.map((word) => {
              const selected = feeling === word;
              return (
                <button
                  key={word}
                  type="button"
                  disabled={locked}
                  aria-pressed={selected}
                  onClick={() => onFeeling(selected ? undefined : word)}
                  className={cn(
                    "h-11 flex-1 rounded-md text-sm transition-[background-color,color,transform] duration-[var(--motion-quick)] ease-[var(--ease-out)] active:scale-[0.96] disabled:opacity-50",
                    selected
                      ? "bg-accent text-accent-fg"
                      : "bg-surface text-muted hover:text-fg",
                  )}
                >
                  {feelingLabel(word)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
