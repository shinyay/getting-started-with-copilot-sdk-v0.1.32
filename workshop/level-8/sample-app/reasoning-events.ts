/**
 * reasoning-events.ts — Observe the model's chain-of-thought
 *
 * Some models emit reasoning tokens before their response. These show
 * the model's "thinking process" — useful for debugging, transparency,
 * and understanding how the model arrives at its answer.
 *
 * Events:
 *   assistant.reasoning_delta — streaming reasoning chunks
 *   assistant.reasoning       — complete reasoning text
 *
 * Exercise covered: 2 (Reasoning events & chain-of-thought)
 *
 * Run: npx tsx reasoning-events.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";

const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  onPermissionRequest: approveAll,
});

// Subscribe to reasoning events (chain-of-thought)
session.on("assistant.reasoning_delta", (event) => {
  // Reasoning tokens appear BEFORE the main response
  process.stdout.write(`\x1b[2m${event.data.deltaContent}\x1b[0m`); // Dim text for reasoning
});

session.on("assistant.reasoning", (event) => {
  if (event.data.content) {
    console.log("\n\n[Reasoning complete]");
  }
});

// Subscribe to regular response events
session.on("assistant.message_delta", (event) => {
  process.stdout.write(event.data.deltaContent);
});

session.on("session.idle", () => console.log("\n"));

console.log("🧠 Reasoning Events — Watch the model think\n");
console.log("Note: Not all models emit reasoning tokens.");
console.log("If you see no [dim] reasoning text, the model may not support it.\n");

process.stdout.write("Response: ");
await session.sendAndWait({
  prompt: "A farmer has 17 sheep. All but 9 run away. How many sheep does the farmer have left? Think step by step.",
});

console.log("=== Event Types ===");
console.log("  assistant.reasoning_delta — streaming thinking (before response)");
console.log("  assistant.reasoning       — complete thinking text");
console.log("  assistant.message_delta   — streaming response (after thinking)");
console.log("  assistant.message         — complete response");

await client.stop();
process.exit(0);
