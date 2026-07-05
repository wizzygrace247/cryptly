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
      className="rounded-2xl p-6 flex flex-col items-center justify-center border h-full"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <h3
        className="text-sm font-medium mb-2"
        style={{ color: "var(--text-muted)" }}
      >
        Risk Level
      </h3>

      <svg viewBox="0 0 300 190" className="w-full max-w-xs">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="40%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>

        {/* background track */}
        <path
          d="M 30 155 A 122 122 0 0 1 270 155"
          fill="none"
          stroke="#1e2340"
          strokeWidth="18"
          strokeLinecap="round"
        />

        {/* filled arc */}
        <path
          d="M 30 155 A 122 122 0 0 1 270 155"
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 383} 383`}
        />

        {/* needle */}
        <line
          x1="150"
          y1="155"
          x2={needleX}
          y2={needleY}
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.9"
        />
        <circle cx="150" cy="155" r="5" fill="white" opacity="0.9" />

        {/* end labels */}
        <text x="22" y="178" fill="#6b7280" fontSize="11">
          0
        </text>
        <text x="258" y="178" fill="#6b7280" fontSize="11">
          100
        </text>
      </svg>

      <div className="text-5xl font-bold -mt-2" style={{ color }}>
        {score}
        <span
          className="text-xl font-normal"
          style={{ color: "var(--text-muted)" }}
        >
          /100
        </span>
      </div>
      <div className="mt-2 text-sm font-semibold" style={{ color }}>
        {label}
      </div>
    </div>
  );
}