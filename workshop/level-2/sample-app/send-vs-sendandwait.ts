/**
 * send-vs-sendandwait.ts — Compare the two message-sending patterns
 *
 * The SDK offers two ways to send messages:
 *
 * 1. sendAndWait(options)  — Blocks until the response is complete.
 *    Returns the full response object. Simple and synchronous-feeling.
 *
 * 2. send(options)         — Returns immediately (fire-and-forget).
 *    You must use event listeners to capture the response.
 *
 * Key insight: sendAndWait still fires events if streaming is enabled.
 * The difference is whether you block on the result or not.
 *
 * Exercise covered: 6 (Compare sendAndWait vs send)
 *
 * Run: npx tsx send-vs-sendandwait.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";

const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  onPermissionRequest: approveAll,
});

// ====================================================
// Pattern 1: sendAndWait — blocking, returns response
// ====================================================
console.log("=== Pattern 1: sendAndWait (blocking) ===\n");

// Even with streaming: true, sendAndWait waits for the full response.
// Delta events still fire, but the await blocks until session.idle.
const response = await session.sendAndWait({
  prompt: "What is the speed of light? One sentence.",
});
console.log("Result:", response?.data.content);

// ====================================================
// Pattern 2: send — fire-and-forget, use events
// ====================================================
console.log("\n=== Pattern 2: send (event-driven) ===\n");

// Collect the response via events instead of the return value
let collected = "";

session.on("assistant.message_delta", (event) => {
  collected += event.data.deltaContent;
  process.stdout.write(event.data.deltaContent);
});

// Use a promise to know when the response is complete
const done = new Promise<void>((resolve) => {
  session.on("session.idle", () => {
    console.log(); // newline after streaming
    resolve();
  });
});

// send() returns immediately — it does NOT wait for the response
session.send({
  prompt: "What is the speed of sound? One sentence.",
});

// Wait for the idle event manually
await done;
console.log("\nCollected via events:", collected);

// ====================================================
// When to use each pattern
// ====================================================
console.log("\n=== Decision Guide ===");
console.log("sendAndWait → Scripts, simple Q&A, no real-time UX needed");
console.log("send+events → Interactive apps, progress indicators, streaming UX");

await client.stop();
process.exit(0);
