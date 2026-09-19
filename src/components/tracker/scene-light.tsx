import { useEffect, useState } from "react";
import { lightPhase, type LightPhase } from "@/lib/tracker/lighting";

export function useSceneLighting() {
  const [phase, setPhase] = useState<LightPhase>("vesper");

  useEffect(() => {
    const tick = () => setPhase(lightPhase());
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  return { phase };
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Star = { x: number; y: number; r: number; o: number; spark: boolean };

const STARS: Star[] = (() => {
  const rand = mulberry32(0x9e3779b9);
  const snap = (n: number) => Math.round(n * 100) / 100;
  return Array.from({ length: 118 }, () => {
    const x = snap(rand() * 1000);
    const y = snap(Math.pow(rand(), 1.18) * 600);
    const r = snap(0.45 + rand() * 1.65);
    const o = snap(0.32 + rand() * 0.68);
    const spark = rand() > 0.88;
    return { x, y, r, o, spark };
  });
})();

function Starfield() {
  return (
    <svg
      className="scene-stars"
      viewBox="0 0 1000 640"
      preserveAspectRatio="xMidYMin slice"
      aria-hidden
    >
      {STARS.map((star, i) =>
        star.spark ? (
          <path
            key={i}
            className="scene-star-spark"
            d="M0 -4.2 L.85 -1.05 4.2 0 1.05 .85 0 4.2 -.85 1.05 -4.2 0 -1.05 -.85Z"
            transform={`translate(${star.x} ${star.y}) scale(${Math.round((0.35 + star.r * 0.28) * 100) / 100})`}
            opacity={star.o}
          />
        ) : (
          <circle
            key={i}
            className={i % 7 === 0 ? "scene-star scene-star-twinkle" : "scene-star"}
            cx={star.x}
            cy={star.y}
            r={star.r}
            opacity={star.o}
            style={{ animationDelay: `${(i % 11) * -0.9}s` }}
          />
        ),
      )}
    </svg>
  );
}

export function NightSky() {
  return (
    <div className="scene-sky" aria-hidden>
      <Starfield />
    </div>
  );
}
