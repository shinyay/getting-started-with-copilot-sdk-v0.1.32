/**
 * stream-basic.ts — Your first streaming response
 *
 * Streaming lets you see tokens arrive one by one instead of waiting
 * for the full response. This is the same experience as ChatGPT's
 * progressive text display.
 *
 * Two key concepts:
 * 1. streaming: true — enables delta events in the session
 * 2. session.on("assistant.message_delta", ...) — fires for each token chunk
 *
 * Exercises covered: 1 (Enable streaming), 2 (Subscribe to deltas), 5 (Build a printer)
 *
 * Run: npx tsx stream-basic.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";

const client = new CopilotClient();

// Enable streaming — without this, no delta events fire
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  onPermissionRequest: approveAll,
});

// IMPORTANT: Subscribe to events BEFORE sending a message.
// If you subscribe after send, you'll miss the first tokens.

// "assistant.message_delta" fires for each chunk of text
session.on("assistant.message_delta", (event) => {
  // Use process.stdout.write (NOT console.log) to avoid extra newlines
  // Each delta is just a few characters — you want them on the same line
  process.stdout.write(event.data.deltaContent);
});

// "session.idle" fires when the model is completely done
session.on("session.idle", () => {
  console.log(); // Print a newline to end the streaming output
});

// Now send the prompt — deltas will print as they arrive
console.log("📖 Streaming a fairy tale...\n");
await session.sendAndWait({
  prompt: "Tell me a very short fairy tale (3-4 sentences).",
});

await client.stop();
process.exit(0);
