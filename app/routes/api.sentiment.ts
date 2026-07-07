import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// NOTE: groq/compound is currently a Groq preview system.
// Verify model availability at console.groq.com/docs/compound before demo.
export async function action({ request }: { request: Request }) {
  try {
    const { name, symbol, chain } = await request.json();

    const completion = await groq.chat.completions.create({
      model: "groq/compound",
      messages: [
        {
          role: "system",
          content:
            "You are a crypto market news researcher. Search for real, current information only. Never invent news, dates, or figures. If nothing relevant is found for this specific token, say so plainly.",
        },
        {
          role: "user",
          content: `Search for the most recent news, announcements, and community sentiment about "${name}" (${symbol}), a cryptocurrency token on ${chain}.

Look specifically for: partnership announcements, planned or completed token burns, exchange listings/delistings, security incidents or hacks, notable bullish or bearish community sentiment, and any regulatory or legal news.

Summarize findings in 4-5 bullet points. If no relevant recent news exists for this specific token (common for small/micro-cap tokens), say so plainly instead of inventing information.`,
        },
      ],
      compound_custom: {
        tools: { enabled_tools: ["web_search"] },
      },
    } as any);

    const message = completion.choices[0]?.message;
    const summary = message?.content ?? "No sentiment data available.";
    const executedTools = (message as any)?.executed_tools ?? [];

    return Response.json({
      summary,
      searchedWeb: executedTools.length > 0,
    });
  } catch (err: any) {
    console.error("Sentiment scan error:", err);
    return new Response(err?.message ?? "Sentiment scan failed", {
      status: 500,
    });
  }
}