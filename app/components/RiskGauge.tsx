import { scoreToColor } from "~/lib/utils";

interface Props {
  score: number;
  label: string;
}

export default function RiskGauge({ score, label }: Props) {
  const color = scoreToColor(score);
  const angle = -135 + (score / 100) * 270;
  const rad = (angle * Math.PI) / 180;
  const needleX = 150 + 85 * Math.cos(rad);
  const needleY = 150 + 85 * Math.sin(rad);

  return (
    <div
      className="scan-corners p-6 flex flex-col items-center justify-center border h-full"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <h3
        className="text-xs font-medium mb-2 tracking-widest uppercase"
        style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
      >
        Risk Scan
      </h3>

      <div className="scan-line w-full max-w-xs">
        <svg viewBox="0 0 300 190" className="w-full">
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00D66F" />
              <stop offset="40%" stopColor="#FFB000" />
              <stop offset="100%" stopColor="#FF3B3B" />
            </linearGradient>
          </defs>

          <path
            d="M 30 155 A 122 122 0 0 1 270 155"
            fill="none"
            stroke="#26302B"
            strokeWidth="16"
            strokeLinecap="round"
          />
          <path
            d="M 30 155 A 122 122 0 0 1 270 155"
            fill="none"
            stroke="url(#gaugeGrad)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 383} 383`}
          />
          <line
            x1="150" y1="155" x2={needleX} y2={needleY}
            stroke="#E8E6E1" strokeWidth="2" strokeLinecap="round"
          />
          <circle cx="150" cy="155" r="4" fill="#E8E6E1" />
          <text x="22" y="178" fill="#6b756e" fontSize="10" fontFamily="monospace">00</text>
          <text x="255" y="178" fill="#6b756e" fontSize="10" fontFamily="monospace">100</text>
        </svg>
      </div>

      <div
        className="text-5xl font-bold -mt-2 font-data"
        style={{ color }}
      >
        {score}
        <span className="text-xl font-normal" style={{ color: "var(--text-muted)" }}>
          /100
        </span>
      </div>
      <div
        className="mt-2 text-xs font-semibold tracking-wider uppercase"
        style={{ color, fontFamily: "var(--font-mono)" }}
      >
        {label}
      </div>
    </div>
  );
}