/**
 * typing-indicator.ts — Show a spinner while waiting, then stream the response
 *
 * Real applications need UX feedback while the model is "thinking."
 * This script shows a spinner animation until the first token arrives,
 * then switches to streaming the response text.
 *
 * Technique: setInterval cycles spinner frames, first delta clears it.
 *
 * Exercise covered: 9 (Build a typing indicator)
 *
 * Run: npx tsx typing-indicator.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";

const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  onPermissionRequest: approveAll,
});

const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
let spinnerIndex = 0;
let firstDeltaReceived = false;

// Start the spinner animation
const spinner = setInterval(() => {
  if (!firstDeltaReceived) {
    const frame = spinnerFrames[spinnerIndex % spinnerFrames.length];
    process.stdout.write(`\r${frame} thinking...`);
    spinnerIndex++;
  }
}, 80);

// When the first delta arrives, clear the spinner and start streaming
session.on("assistant.message_delta", (event) => {
  if (!firstDeltaReceived) {
    firstDeltaReceived = true;
    clearInterval(spinner);
    // Clear the spinner line: \r moves to start, spaces overwrite, \r again
    process.stdout.write("\r                \r");
  }
  process.stdout.write(event.data.deltaContent);
});

session.on("session.idle", () => {
  console.log(); // newline after streaming
});

console.log("🤖 Asking a question...\n");
await session.sendAndWait({
  prompt: "Explain what streaming means in the context of AI language models. Keep it to 2-3 sentences.",
});

await client.stop();
process.exit(0);
