/**
 * basic-repl.ts — A minimal interactive REPL with streaming
 *
 * A Read-Eval-Print Loop: read user input, send to session, stream response.
 * Uses Node's built-in readline/promises for simple line input.
 *
 * Exercises covered: 1 (Basic REPL), 2 (Add streaming), 4 (Multi-turn memory)
 *
 * Run: npx tsx basic-repl.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";
import readline from "node:readline/promises";

const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  onPermissionRequest: approveAll,
});

// Stream response tokens
session.on("assistant.message_delta", (event) => {
  process.stdout.write(event.data.deltaContent);
});

session.on("session.idle", () => {
  console.log("\n");
});

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("💬 Basic REPL — type your messages, 'exit' to quit\n");

while (true) {
  const input = await rl.question("You: ");
  const trimmed = input.trim();

  if (!trimmed) continue;
  if (trimmed.toLowerCase() === "exit") {
    console.log("Goodbye! 👋");
    break;
  }

  process.stdout.write("Assistant: ");
  await session.sendAndWait({ prompt: trimmed });
  // Multi-turn: the session remembers all previous messages automatically
}

rl.close();
await client.stop();
process.exit(0);
