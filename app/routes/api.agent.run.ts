import { runAgentCycle } from "~/lib/agent/agentLoop";

// Called by Vercel Cron every 5 minutes
// Also callable manually for testing: POST /api/agent/run
export async function action({ request }: { request: Request }) {
  // verify cron secret in production so random people can't spam it
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const result = await runAgentCycle();
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Agent run failed:", err);
    return new Response(err.message ?? "Agent cycle failed", { status: 500 });
  }
}

// GET for Vercel Cron (cron sends GET requests)
export async function loader({ request }: { request: Request }) {
  return action({ request });
}