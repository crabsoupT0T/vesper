const METEORS = [
  { top: "8%", len: "7.5rem", dur: "22s", delay: "-2s", shift: "10vh" },
  { top: "22%", len: "5.5rem", dur: "28s", delay: "-11s", shift: "14vh" },
  { top: "38%", len: "9rem", dur: "26s", delay: "-18s", shift: "8vh" },
  { top: "14%", len: "4.5rem", dur: "32s", delay: "-7s", shift: "16vh" },
  { top: "48%", len: "6.5rem", dur: "24s", delay: "-15s", shift: "12vh" },
  { top: "30%", len: "8rem", dur: "30s", delay: "-24s", shift: "9vh" },
] as const;

export function MeteorShower() {
  return (
    <div className="meteor-field" aria-hidden>
      {METEORS.map((meteor, i) => (
        <span
          key={i}
          className="meteor"
          style={{
            top: meteor.top,
            width: meteor.len,
            animationDuration: meteor.dur,
            animationDelay: meteor.delay,
            ["--meteor-drop" as string]: meteor.shift,
          }}
        />
      ))}
    </div>
  );
}
