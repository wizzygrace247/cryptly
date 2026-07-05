import Groq from "groq-sdk";
import { buildComparePrompt } from "~/lib/ai/promptBuilder";
import type { TokenMetrics } from "~/types/tokens";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function action({ request }: { request: Request }) {
  try {
    const { tokenA, tokenB } = (await request.json()) as {
      tokenA: TokenMetrics;
      tokenB: TokenMetrics;
    };

    if (!tokenA || !tokenB) {
      return new Response("Missing tokenA or tokenB", { status: 400 });
    }

    const prompt = buildComparePrompt(tokenA, tokenB);

    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are Cryptly, a crypto risk analysis agent. Compare tokens objectively using only the data provided. Be concise and direct. Never recommend buying — frame as risk/reward analysis only.",
        },
        { role: "user", content: prompt },
      ],
      stream: true,
      temperature: 0.3,
      max_tokens: 400,
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
    console.error("Compare API error:", err);
    return new Response(err?.message ?? "Compare failed", { status: 500 });
  }
}