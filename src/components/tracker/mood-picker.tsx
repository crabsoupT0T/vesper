import { Cloud, CloudFog, CloudRain, Sun, Sunrise } from "lucide-react";
import { cn } from "@/lib/utils";
import { feelingLabel, feelingsFor, moodLabel } from "@/lib/tracker/logic";
import type { Feeling, Mood } from "@/lib/tracker/types";

const MOODS: { value: Mood; Icon: typeof Sun }[] = [
  { value: 1, Icon: CloudRain },
  { value: 2, Icon: CloudFog },
  { value: 3, Icon: Cloud },
  { value: 4, Icon: Sun },
  { value: 5, Icon: Sunrise },
];

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
      <ScaleRow
        label="How was the day"
        valueLabel={mood ? moodLabel(mood) : "Unmarked"}
        options={MOODS}
        value={mood}
        locked={locked}
        onChange={onMood}
      />
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

function ScaleRow({
  label,
  valueLabel,
  options,
  value,
  locked,
  onChange,
}: {
  label: string;
  valueLabel: string;
  options: { value: Mood; Icon: typeof Sun }[];
  value?: Mood;
  locked?: boolean;
  onChange: (value: Mood | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium text-fg">{label}</p>
        <p className="text-sm text-muted">{valueLabel}</p>
      </div>
      <div className="flex gap-2">
        {options.map(({ value: option, Icon }) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              disabled={locked}
              aria-label={moodLabel(option)}
              aria-pressed={selected}
              onClick={() => onChange(selected ? undefined : option)}
              className={cn(
                "flex h-12 flex-1 items-center justify-center rounded-md transition-[background-color,color,box-shadow,transform] duration-[var(--motion-quick)] ease-[var(--ease-out)] active:scale-[0.96] disabled:opacity-50",
                selected
                  ? "bg-accent text-accent-fg"
                  : "bg-surface text-muted hover:text-fg",
              )}
            >
              <Icon className="size-4" strokeWidth={1.75} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
