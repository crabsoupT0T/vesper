function Leaf({ x, y, s, r }: { x: number; y: number; s: number; r: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <path
        className="sapling-blade-shade"
        d="M0.6 0.8 C5.6 2.6 8.2 9.2 6.2 16.8 C4.8 22.2 1.8 25.6 0 26.2 C-1.6 25.6 -4.4 22.2 -5.6 16.6 C-7.4 9.2 -4.8 2.4 -0.6 0.8Z"
      />
      <path
        className="sapling-blade"
        d="M0 0 C4 1.4 7.2 7.4 5.4 15.6 C4.2 21 1.6 24.4 0 25 C-1.6 24.4 -4.2 21 -5.4 15.6 C-7.2 7.4 -4 1.4 0 0Z"
      />
      <path
        className="sapling-blade-shine"
        d="M-0.7 2.4 C2.4 4.2 4.2 9.6 3.2 15.2 C2.4 18.8 0.9 21.2 0.1 21.4 C-1.2 17.4 -1.8 8.6 -0.7 2.4Z"
      />
    </g>
  );
}

export function Sapling() {
  return (
    <div className="sapling-mark" aria-hidden>
      <svg
        className="sapling-glyph"
        viewBox="0 0 96 132"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          className="sapling-root"
          d="M48 122 C38 124 28 124 20 121 M48 122 C58 124 68 124 76 121"
        />
        <path className="sapling-stem" d="M48 122 L48 28" />
        <path className="sapling-stem" d="M48 86 C36 80 28 70 22 56" />
        <path className="sapling-stem" d="M48 78 C60 72 68 60 74 48" />
        <path className="sapling-stem" d="M48 52 C38 46 32 38 26 28" />
        <path className="sapling-stem" d="M48 48 C58 42 64 34 70 24" />
        <Leaf x={48} y={10} s={0.9} r={0} />
        <Leaf x={26} y={28} s={0.78} r={-42} />
        <Leaf x={70} y={24} s={0.78} r={42} />
        <Leaf x={22} y={56} s={0.8} r={-38} />
        <Leaf x={74} y={48} s={0.8} r={38} />
      </svg>
    </div>
  );
}
