import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function action({ request }: { request: Request }) {
  try {
    const { prompt } = await request.json();

    if (!process.env.GROQ_API_KEY) {
      return new Response("GROQ_API_KEY is not set", { status: 500 });
    }

    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are Cryptly, a crypto risk analysis agent. Given token metrics, explain the risk score clearly in 4 bullet points. Name specific numbers. Frame as analysis, not financial advice.",
        },
        { role: "user", content: prompt },
      ],
      stream: true,
      temperature: 0.4,
      max_tokens: 500,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) controller.enqueue(encoder.encode(text));
          }
        } catch (streamErr) {
          console.error("Stream error:", streamErr);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err: any) {
    console.error("Groq API error:", err);
    return new Response(err?.message ?? "Groq API call failed", { status: 500 });
  }
}