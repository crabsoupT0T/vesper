import { cn } from "@/lib/utils";

type Props = {
  ratio: number;
  size?: number;
  label?: string;
};

export function CompletionRing({ ratio, size = 72, label }: Props) {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, ratio));
  const offset = circ * (1 - clamped);
  const pct = Math.round(clamped * 100);

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-label={label ?? `${pct} percent complete`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-surface-2"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className={cn(
            "text-accent transition-[stroke-dashoffset] duration-[var(--motion-slow)] ease-[var(--ease-smooth-out)]",
          )}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-sans text-sm font-medium tabular-nums text-fg">
        {pct}
      </span>
    </div>
  );
}
