import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Gavel,
  Loader2,
  Play,
  Newspaper,
  Globe,
} from "lucide-react";
import type { TokenMetrics } from "~/types/tokens";

interface Props {
  token: TokenMetrics;
}

async function streamRole(
  role: string,
  body: any,
  onToken: (chunk: string) => void
): Promise<string> {
  const res = await fetch("/api/debate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, ...body }),
  });
  if (!res.body) throw new Error("No stream");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    full += chunk;
    onToken(chunk);
  }
  return full;
}

type AgentKey = "bull" | "bear" | "security" | "judge";
type AgentStatus = "idle" | "running" | "done";

const AGENT_META: Record<AgentKey, { label: string; icon: any; color: string }> = {
  bull: { label: "Bull Agent", icon: TrendingUp, color: "var(--green)" },
  bear: { label: "Bear Agent", icon: TrendingDown, color: "var(--red)" },
  security: { label: "Security Agent", icon: ShieldCheck, color: "var(--orange)" },
  judge: { label: "Judge Agent", icon: Gavel, color: "var(--accent)" },
};

function AgentPanel({
  agentKey,
  text,
  status,
}: {
  agentKey: AgentKey;
  text: string;
  status: AgentStatus;
}) {
  const meta = AGENT_META[agentKey];
  const Icon = meta.icon;

  return (
    <div
      className="rounded-md border p-4"
      style={{
        borderColor: status === "done" ? meta.color : "var(--border)",
        background: "var(--bg-card)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4" style={{ color: meta.color }} />
        <h4 className="text-sm font-semibold" style={{ color: meta.color }}>
          {meta.label}
        </h4>
        {status === "running" && (
          <Loader2 className="w-3 h-3 animate-spin ml-auto" style={{ color: "var(--text-muted)" }} />
        )}
      </div>
      {text ? (
        <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>
          {text}
          {status === "running" && (
            <span className="animate-pulse" style={{ color: meta.color }}>▊</span>
          )}
        </p>
      ) : (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {status === "idle" ? "Waiting to run..." : "Thinking..."}
        </p>
      )}
    </div>
  );
}

export default function DebateCouncil({ token }: Props) {
  const [texts, setTexts] = useState<Record<AgentKey, string>>({
    bull: "",
    bear: "",
    security: "",
    judge: "",
  });
  const [status, setStatus] = useState<Record<AgentKey, AgentStatus>>({
    bull: "idle",
    bear: "idle",
    security: "idle",
    judge: "idle",
  });
  const [running, setRunning] = useState(false);

  const [newsSummary, setNewsSummary] = useState("");
  const [newsSearched, setNewsSearched] = useState(false);
  const [newsStatus, setNewsStatus] = useState<AgentStatus>("idle");

  const run = async () => {
    setRunning(true);
    setTexts({ bull: "", bear: "", security: "", judge: "" });
    setStatus({ bull: "idle", bear: "idle", security: "idle", judge: "idle" });
    setNewsSummary("");
    setNewsStatus("running");

    let newsContext = "";
    try {
      const res = await fetch("/api/sentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: token.name,
          symbol: token.symbol,
          chain: token.chain,
        }),
      });
      const data = await res.json();
      newsContext = data.summary ?? "";
      setNewsSummary(newsContext);
      setNewsSearched(data.searchedWeb ?? false);
    } catch (err) {
      console.warn("Sentiment scan failed, proceeding without news context:", err);
    } finally {
      setNewsStatus("done");
    }

    setStatus({ bull: "running", bear: "running", security: "running", judge: "idle" });

    try {
      const [bullFull, bearFull, securityFull] = await Promise.all([
        streamRole("bull", { metrics: token, newsContext }, (c) =>
          setTexts((s) => ({ ...s, bull: s.bull + c }))
        ),
        streamRole("bear", { metrics: token, newsContext }, (c) =>
          setTexts((s) => ({ ...s, bear: s.bear + c }))
        ),
        streamRole("security", { metrics: token }, (c) =>
          setTexts((s) => ({ ...s, security: s.security + c }))
        ),
      ]);

      setStatus((s) => ({ ...s, bull: "done", bear: "done", security: "done", judge: "running" }));

      await streamRole(
        "judge",
        {
          metrics: token,
          bullText: bullFull,
          bearText: bearFull,
          securityText: securityFull,
          newsContext,
        },
        (c) => setTexts((s) => ({ ...s, judge: s.judge + c }))
      );

      setStatus((s) => ({ ...s, judge: "done" }));
    } catch (err) {
      console.error("Debate council failed:", err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div
      className="rounded-md border p-6"
      style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}
    >
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Gavel className="w-4 h-4" style={{ color: "var(--accent)" }} />
            Debate Council
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Live news scan + Bull, Bear, Security agents argue, a Judge synthesizes the verdict
          </p>
        </div>
        <button
          onClick={run}
          disabled={running}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
          style={{ background: "var(--accent)", color: "#0A0B0A" }}
        >
          {running ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Running...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" /> Run Council
            </>
          )}
        </button>
      </div>

      {/* sentiment scan panel */}
      {(newsStatus === "running" || newsSummary) && (
        <div
          className="rounded-md border p-4 mb-3"
          style={{ borderColor: "var(--border)", background: "var(--bg-primary)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Newspaper className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <h4 className="text-sm font-semibold">Market News & Sentiment Scan</h4>
            {newsStatus === "running" && (
              <Loader2 className="w-3 h-3 animate-spin ml-auto" style={{ color: "var(--text-muted)" }} />
            )}
            {newsStatus === "done" && (
              <span
                className="flex items-center gap-1 text-xs ml-auto px-2 py-0.5 rounded-full"
                style={{
                  background: newsSearched ? "var(--green-glow)" : "var(--border)",
                  color: newsSearched ? "var(--green)" : "var(--text-muted)",
                }}
              >
                <Globe className="w-3 h-3" />
                {newsSearched ? "Live web search" : "No search performed"}
              </span>
            )}
          </div>
          {newsSummary ? (
            <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>
              {newsSummary}
            </p>
          ) : (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Searching the web for recent news...
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <AgentPanel agentKey="bull" text={texts.bull} status={status.bull} />
        <AgentPanel agentKey="bear" text={texts.bear} status={status.bear} />
        <AgentPanel agentKey="security" text={texts.security} status={status.security} />
      </div>

      {status.judge !== "idle" && (
        <div
          className="rounded-md border-2 p-4"
          style={{ borderColor: "var(--accent)", background: "var(--accent-glow)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Gavel className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <h4 className="text-sm font-bold" style={{ color: "var(--accent)" }}>
              Final Verdict
            </h4>
            {status.judge === "running" && (
              <Loader2 className="w-3 h-3 animate-spin ml-auto" style={{ color: "var(--accent)" }} />
            )}
          </div>
          <p
            className="text-sm leading-relaxed whitespace-pre-wrap font-data"
            style={{ color: "var(--text-primary)" }}
          >
            {texts.judge}
            {status.judge === "running" && (
              <span className="animate-pulse" style={{ color: "var(--accent)" }}>▊</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}