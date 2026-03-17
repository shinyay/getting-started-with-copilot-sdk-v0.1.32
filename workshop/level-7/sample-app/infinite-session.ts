/**
 * infinite-session.ts — Auto-compaction for long conversations
 *
 * When conversations exceed the model's context window, infinite sessions
 * automatically compact older messages to make room for new ones.
 *
 * Exercise covered: 7 (Infinite sessions)
 *
 * Run: npx tsx infinite-session.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";

const client = new CopilotClient();

console.log("♾️  Infinite Sessions — Auto-Context Compaction\n");

const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  onPermissionRequest: approveAll,
  infiniteSessions: {
    enabled: true,
    backgroundCompactionThreshold: 0.80,   // Start compacting at 80% context usage
    bufferExhaustionThreshold: 0.95,        // Block new messages at 95% until compacted
  },
});

session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("assistant.usage", (e) => {
  const total = e.data.inputTokens + e.data.outputTokens;
  console.log(`\n  📊 Tokens this turn: ${total} (input: ${e.data.inputTokens}, output: ${e.data.outputTokens})`);
});
session.on("session.idle", () => console.log());

// Send several prompts to accumulate context
const prompts = [
  "Explain what a binary tree is. Keep it to 2 sentences.",
  "Now explain a hash table. 2 sentences.",
  "Compare the two data structures. When should I use each one?",
];

for (let i = 0; i < prompts.length; i++) {
  console.log(`\n--- Prompt ${i + 1}/${prompts.length} ---\n`);
  process.stdout.write("Assistant: ");
  await session.sendAndWait({ prompt: prompts[i] });
}

console.log("\n=== Infinite Session Config ===");
console.log("  backgroundCompactionThreshold: 0.80 → compact at 80% context usage");
console.log("  bufferExhaustionThreshold: 0.95 → block at 95% until compaction done");
console.log("\nWith many more prompts, you'd see input tokens stabilize as old context is compacted.");

await client.stop();
process.exit(0);
