/**
 * stream-events.ts — Observe ALL streaming event types and their ordering
 *
 * The SDK fires several event types during a streaming response.
 * This script subscribes to all of them simultaneously and logs
 * the exact order they fire in, so you can build a mental model
 * of the event lifecycle.
 *
 * Event ordering:
 *   1. assistant.message_delta  (N times — one per token chunk)
 *   2. assistant.message        (once — the complete response text)
 *   3. assistant.usage          (once — token counts for this response)
 *   4. session.idle             (once — the agent loop is finished)
 *
 * Exercises covered: 3 (Complete message), 4 (Detect completion), 7 (Track all events)
 *
 * Run: npx tsx stream-events.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";

const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  onPermissionRequest: approveAll,
});

let deltaCount = 0;
const startTime = Date.now();

// Delta events — fire for each token chunk
session.on("assistant.message_delta", (event) => {
  deltaCount++;
  if (deltaCount <= 3) {
    // Show the first 3 deltas with timestamps to illustrate progressive arrival
    const elapsed = Date.now() - startTime;
    console.log(`  [DELTA #${deltaCount}] +${elapsed}ms: "${event.data.deltaContent}"`);
  } else if (deltaCount === 4) {
    console.log(`  [DELTA #4...] (remaining deltas streaming silently)`);
  }
});

// Complete message — fires ONCE with the full assembled text
session.on("assistant.message", (event) => {
  const elapsed = Date.now() - startTime;
  console.log(`\n  [COMPLETE] +${elapsed}ms: Full response received`);
  console.log(`  Content (first 80 chars): "${event.data.content?.slice(0, 80)}..."`);
});

// Usage — fires ONCE with token counts for this response
session.on("assistant.usage", (event) => {
  const elapsed = Date.now() - startTime;
  console.log(`  [USAGE] +${elapsed}ms: ${event.data.inputTokens} input + ${event.data.outputTokens} output tokens`);
});

// Idle — fires ONCE when the agent loop is completely finished
session.on("session.idle", () => {
  const elapsed = Date.now() - startTime;
  console.log(`  [IDLE] +${elapsed}ms: Agent loop finished`);
  console.log(`\n📊 Summary: ${deltaCount} delta events fired`);
});

console.log("🔍 Watching all event types...\n");
await session.sendAndWait({
  prompt: "Tell me a short joke.",
});

await client.stop();
process.exit(0);
