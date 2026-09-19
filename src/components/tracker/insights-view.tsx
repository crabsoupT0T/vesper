import { format, subDays } from "date-fns";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { lastNDays } from "@/lib/tracker/dates";
import {
  completionOf,
  longestStreak,
  moodCompletion,
  moodLabel,
  streakFor,
  strengthFor,
  weekdayPattern,
  weeklyTrend,
} from "@/lib/tracker/logic";
import { HABIT_ICON_MAP } from "@/lib/tracker/icons";
import { useTracker } from "@/lib/tracker/store";

function ChartTip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; dataKey?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const pct = payload.find((p) => p.dataKey === "pct");
  const mood = payload.find((p) => p.dataKey === "mood");
  if (pct && mood) {
    return (
      <div className="rounded-sm bg-fg px-2 py-1 text-xs text-accent-fg">
        <p className="tabular-nums">
          {label} · {pct.value}% kept
          {mood.value != null ? ` · mood ${mood.value}` : ""}
        </p>
      </div>
    );
  }
  if (mood) {
    return (
      <div className="rounded-sm bg-fg px-2 py-1 text-xs text-accent-fg">
        <p className="tabular-nums">
          {label} · {mood.value != null ? moodLabel(mood.value as 1 | 2 | 3 | 4 | 5) : "—"}
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-sm bg-fg px-2 py-1 text-xs text-accent-fg">
      <p className="tabular-nums">
        {label} · {payload[0].value}
        {payload[0].name === "mood" ? "" : "%"}
      </p>
    </div>
  );
}

export function InsightsView() {
  const habits = useTracker((s) => s.habits);
  const logs = useTracker((s) => s.logs);
  const active = habits.filter((h) => !h.archived);
  const today = new Date();

  const weekDays = lastNDays(7, today);
  const thisWeek = weekDays.reduce(
    (acc, d) => {
      const c = completionOf(habits, logs, d);
      return { due: acc.due + c.due, done: acc.done + c.done };
    },
    { due: 0, done: 0 },
  );

  const lastWeekDays = lastNDays(7, subDays(today, 7));
  const lastWeek = lastWeekDays.reduce(
    (acc, d) => {
      const c = completionOf(habits, logs, d);
      return { due: acc.due + c.due, done: acc.done + c.done };
    },
    { due: 0, done: 0 },
  );

  const thisPct = thisWeek.due ? Math.round((thisWeek.done / thisWeek.due) * 100) : 0;
  const lastPct = lastWeek.due ? Math.round((lastWeek.done / lastWeek.due) * 100) : 0;
  const delta = thisPct - lastPct;

  const moodDays = lastNDays(30, today)
    .map((d) => logs[format(d, "yyyy-MM-dd")])
    .filter((log) => log?.mood);
  const avgMood = moodDays.length
    ? moodDays.reduce((a, b) => a + (b.mood ?? 0), 0) / moodDays.length
    : 0;

  const barData = lastNDays(14, today).map((d) => {
    const c = completionOf(habits, logs, d);
    return {
      label: format(d, "d"),
      pct: c.due ? Math.round(c.ratio * 100) : 0,
    };
  });

  const moodData = lastNDays(30, today).map((d) => {
    const log = logs[format(d, "yyyy-MM-dd")];
    return {
      label: format(d, "d"),
      mood: log?.mood ?? null,
    };
  });

  const best = active
    .map((h) => ({ habit: h, streak: longestStreak(h, logs, today) }))
    .sort((a, b) => b.streak - a.streak)[0];

  const weekdays = weekdayPattern(habits, logs, today);
  const trend = weeklyTrend(habits, logs, today);
  const moods = moodCompletion(habits, logs, today);
  const bestDay = [...weekdays].sort((a, b) => b.pct - a.pct)[0];
  const moodLink = moods.filter((m) => m.days >= 2);

  return (
    <div className="flex flex-col gap-8">
      <header className="rise">
        <p className="text-sm text-muted">The shape of it</p>
        <h1 className="mt-1 font-display text-4xl font-medium tracking-tight text-fg">
          Insights
        </h1>
      </header>

      <section className="rise rise-2 grid grid-cols-2 gap-3">
        <Stat
          label="This week"
          value={`${thisPct}%`}
          hint={
            delta === 0
              ? "Even with last week"
              : delta > 0
                ? `Up ${delta} from last week`
                : `Down ${Math.abs(delta)} from last week`
          }
        />
        <Stat
          label="Average mood"
          value={avgMood ? avgMood.toFixed(1) : "—"}
          hint={
            avgMood
              ? `${moodLabel(Math.round(avgMood) as 1 | 2 | 3 | 4 | 5)}`
              : "Log a few days"
          }
        />
        <Stat
          label="Active habits"
          value={`${active.length}`}
          hint={`${habits.filter((h) => h.archived).length} archived`}
        />
        <Stat
          label="Longest run"
          value={best ? `${best.streak}` : "0"}
          hint={best ? best.habit.name : "Mark a day to begin"}
        />
      </section>

      <section className="rise rise-3 rounded-xl bg-surface p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium text-fg">Twelve weeks</h2>
            <p className="mt-1 text-sm text-muted">Marks kept, with mood on top.</p>
          </div>
          <p className="flex items-center gap-3 text-xs text-subtle">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-accent" />
              Marks
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-habit-sage" />
              Mood
            </span>
          </p>
        </div>
        <div className="mt-4 h-52">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--color-subtle)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={1}
              />
              <YAxis yAxisId="pct" hide domain={[0, 100]} />
              <YAxis yAxisId="mood" orientation="right" hide domain={[1, 5]} />
              <Tooltip
                content={<ChartTip />}
                cursor={{ stroke: "var(--color-border)" }}
              />
              <Area
                yAxisId="pct"
                type="monotone"
                dataKey="pct"
                name="kept"
                fill="var(--color-accent)"
                stroke="var(--color-accent)"
                fillOpacity={0.18}
                strokeWidth={1.75}
              />
              <Line
                yAxisId="mood"
                type="monotone"
                dataKey="mood"
                name="mood"
                stroke="var(--color-habit-sage)"
                strokeWidth={1.75}
                dot={false}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl bg-surface p-5">
        <h2 className="text-sm font-medium text-fg">Fourteen days</h2>
        <p className="mt-1 text-sm text-muted">Share of marks kept, by day.</p>
        <div className="mt-4 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} barCategoryGap="28%">
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--color-subtle)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide domain={[0, 100]} />
              <Tooltip content={<ChartTip />} cursor={{ fill: "var(--color-surface-2)" }} />
              <Bar dataKey="pct" name="kept" fill="var(--color-accent)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl bg-surface p-5">
        <h2 className="text-sm font-medium text-fg">By weekday</h2>
        <p className="mt-1 text-sm text-muted">
          Twelve weeks. {bestDay ? `${bestDay.label} holds best.` : "Need a little more history."}
        </p>
        <ul className="mt-4 flex items-end gap-2">
          {weekdays.map((day) => (
            <li key={day.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <span className="text-xs tabular-nums text-muted">{day.pct}</span>
              <span className="flex h-24 w-full flex-col justify-end overflow-hidden rounded-sm bg-surface-2">
                <span
                  className="w-full rounded-sm bg-accent"
                  style={{ height: `${Math.max(day.pct, 2)}%` }}
                />
              </span>
              <span className="text-xs text-subtle">{day.label[0]}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl bg-surface p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium text-fg">Mood, thirty days</h2>
            <p className="mt-1 text-sm text-muted">How the days felt.</p>
          </div>
        </div>
        <div className="mt-4 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={moodData}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--color-subtle)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis hide domain={[1, 5]} />
              <Tooltip content={<ChartTip />} />
              <Line
                type="monotone"
                dataKey="mood"
                name="mood"
                stroke="var(--color-accent)"
                strokeWidth={1.75}
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {moodLink.some((m) => m.days > 0) ? (
          <ul className="mt-5 flex flex-col gap-2">
            {moodLink.map((row) => (
              <li key={row.mood} className="flex items-center gap-3 text-sm">
                <span className="w-16 text-muted">{row.label}</span>
                <span className="h-1 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <span className="block h-full bg-accent" style={{ width: `${row.pct}%` }} />
                </span>
                <span className="w-10 text-right tabular-nums text-fg">{row.pct}%</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="rounded-xl bg-surface p-2">
        <h2 className="px-3 pt-3 text-sm font-medium text-fg">Strength</h2>
        <p className="px-3 pt-1 text-sm text-muted">
          Last thirty due days, skipping rest. Streaks still sit beside it.
        </p>
        <ul className="mt-2">
          {active.map((habit) => {
            const Icon = HABIT_ICON_MAP[habit.icon];
            const current = streakFor(habit, logs, today);
            const bestRun = longestStreak(habit, logs, today);
            const strength = strengthFor(habit, logs, today);
            return (
              <li key={habit.id} className="flex items-center gap-3 rounded-lg px-3 py-3">
                <span className="flex size-9 items-center justify-center rounded-md bg-surface-2 text-muted">
                  <Icon className="size-4" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-fg">{habit.name}</span>
                  <span className="mt-1 block h-1 overflow-hidden rounded-full bg-surface-2">
                    <span
                      className="block h-full bg-accent"
                      style={{ width: `${strength}%` }}
                    />
                  </span>
                </span>
                <span className="text-right">
                  <span className="block text-sm font-medium tabular-nums text-fg">
                    {strength}%
                  </span>
                  <span className="block text-xs tabular-nums text-subtle">
                    {current} / best {bestRun}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl bg-surface p-4">
      <p className="text-xs tracking-wide text-subtle uppercase">{label}</p>
      <p className="mt-2 font-display text-3xl font-medium tracking-tight text-fg tabular-nums">
        {value}
      </p>
      <p className="mt-1 truncate text-xs text-muted">{hint}</p>
    </div>
  );
}
