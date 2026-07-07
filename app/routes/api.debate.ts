import Groq from "groq-sdk";
import {
  buildBullPrompt,
  buildBearPrompt,
  buildSecurityPrompt,
  buildJudgePrompt,
} from "~/lib/ai/debatePrompts";
import type { TokenMetrics } from "~/types/tokens";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPTS: Record<string, string> = {
  bull: "You are a rigorous, honest bull-case analyst. You never fabricate data. If the data is weak, your case is appropriately weak.",
  bear: "You are a rigorous, honest bear-case analyst. You never fabricate data. You are direct about real risks.",
  security: "You are a contract security auditor. You analyze only technical/holder risk signals, not price action.",
  judge: "You are a neutral judge synthesizing three analyst arguments into a final, balanced verdict. You never give financial advice, only risk analysis.",
};

export async function action({ request }: { request: Request }) {
  try {
   const body = await request.json();
const { role, metrics, bullText, bearText, securityText, newsContext } = body as {
  role: "bull" | "bear" | "security" | "judge";
  metrics: TokenMetrics;
  bullText?: string;
  bearText?: string;
  securityText?: string;
  newsContext?: string;
};

let prompt: string;
switch (role) {
  case "bull":
    prompt = buildBullPrompt(metrics, newsContext);
    break;
  case "bear":
    prompt = buildBearPrompt(metrics, newsContext);
    break;
  case "security":
    prompt = buildSecurityPrompt(metrics);
    break;
  case "judge":
    prompt = buildJudgePrompt(
      metrics,
      bullText ?? "",
      bearText ?? "",
      securityText ?? "",
      newsContext
    );
    break;
  default:
    return new Response("Invalid role", { status: 400 });
}

    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPTS[role] },
        { role: "user", content: prompt },
      ],
      stream: true,
      temperature: role === "judge" ? 0.3 : 0.5,
      max_tokens: 350,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) controller.enqueue(encoder.encode(text));
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err: any) {
    console.error("Debate council error:", err);
    return new Response(err?.message ?? "Debate failed", { status: 500 });
  }
}