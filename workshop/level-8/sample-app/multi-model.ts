/**
 * multi-model.ts — Compare responses from multiple models
 *
 * Create parallel sessions with different models, send the same prompt,
 * and compare quality, speed, and token usage side by side.
 *
 * Exercise covered: 9 (Multi-model comparison framework)
 *
 * Run: npx tsx multi-model.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";

const client = new CopilotClient();

const models = ["gpt-4.1", "gpt-4.1-mini"];
const prompt = "Explain the difference between REST and GraphQL in exactly 3 bullet points.";

console.log("📊 Multi-Model Comparison\n");
console.log(`Prompt: "${prompt}"\n`);
console.log(`Models: ${models.join(", ")}\n`);
console.log("Sending to all models in parallel...\n");

// Create sessions for each model
const sessions = await Promise.all(
  models.map((model) => client.createSession({ model, onPermissionRequest: approveAll })),
);

// Track usage per session
const usage: Record<string, { tokens: number; elapsed: number }> = {};

// Send to all in parallel
const start = Date.now();
const responses = await Promise.all(
  sessions.map(async (session, i) => {
    const model = models[i];
    const t0 = Date.now();

    let tokens = 0;
    session.on("assistant.usage", (e) => {
      tokens = e.data.inputTokens + e.data.outputTokens;
    });

    const response = await session.sendAndWait({ prompt });
    usage[model] = { tokens, elapsed: Date.now() - t0 };
    return response;
  }),
);
const totalElapsed = Date.now() - start;

// Display results side by side
for (let i = 0; i < models.length; i++) {
  const model = models[i];
  const u = usage[model];
  console.log(`=== ${model} ===`);
  console.log(`  ${responses[i]?.data.content}\n`);
  console.log(`  ⏱️  ${u.elapsed}ms | 📊 ${u.tokens} tokens\n`);
}

console.log(`All models completed in ${totalElapsed}ms (parallel)\n`);
console.log("=== Comparison ===");
console.log("  ┌──────────────────┬──────────┬────────────┐");
console.log("  │ Model            │ Time     │ Tokens     │");
console.log("  ├──────────────────┼──────────┼────────────┤");
for (const model of models) {
  const u = usage[model];
  console.log(`  │ ${model.padEnd(16)} │ ${String(u.elapsed + "ms").padEnd(8)} │ ${String(u.tokens).padEnd(10)} │`);
}
console.log("  └──────────────────┴──────────┴────────────┘");

await client.stop();
process.exit(0);
