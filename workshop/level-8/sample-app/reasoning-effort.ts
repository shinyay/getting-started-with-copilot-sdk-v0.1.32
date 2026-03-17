/**
 * reasoning-effort.ts — Control reasoning depth (cost vs quality tradeoff)
 *
 * Models that support reasoning effort let you control how much
 * "thinking" the model does before responding. Higher effort = better
 * quality but more tokens (and cost).
 *
 * Exercise covered: 3 (reasoningEffort configuration)
 *
 * Run: npx tsx reasoning-effort.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";

const client = new CopilotClient();

const prompt = "What are the three most important principles of software architecture? List them with one-sentence explanations.";

console.log("⚙️  Reasoning Effort — Cost vs Quality Tradeoff\n");
console.log(`Prompt: "${prompt}"\n`);

// Note: reasoningEffort support depends on the model.
// Some models may ignore this setting.

const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  onPermissionRequest: approveAll,
  // reasoningEffort: "high",  // Uncomment to test different levels
});

let tokenCount = 0;
session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("assistant.usage", (e) => {
  tokenCount = e.data.inputTokens + e.data.outputTokens;
});
session.on("session.idle", () => {
  console.log(`\n  📊 Tokens used: ${tokenCount}\n`);
});

process.stdout.write("Response: ");
await session.sendAndWait({ prompt });

console.log("=== reasoningEffort Options ===");
console.log("  The reasoningEffort field controls thinking depth (model-dependent):\n");
console.log("  ┌────────────┬───────────────┬──────────────┐");
console.log("  │ Effort     │ Quality       │ Token Cost   │");
console.log("  ├────────────┼───────────────┼──────────────┤");
console.log("  │ low        │ Fast, concise │ Lower        │");
console.log("  │ medium     │ Balanced      │ Moderate     │");
console.log("  │ high       │ Thorough      │ Higher       │");
console.log("  └────────────┴───────────────┴──────────────┘\n");
console.log("  Usage: createSession({ reasoningEffort: 'high' })");
console.log("  Note: Not all models support this setting.");

await client.stop();
process.exit(0);
