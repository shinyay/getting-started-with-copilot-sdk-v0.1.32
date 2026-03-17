/**
 * conversation-commands.ts — REPL with slash commands
 *
 * In an interactive app, users expect local commands like /help, /exit.
 * These are handled BEFORE sending to the SDK — they're your app logic,
 * not model prompts.
 *
 * Exercise covered: 8 (Conversation commands), 9 (Graceful shutdown)
 *
 * Run: npx tsx conversation-commands.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";
import readline from "node:readline/promises";

const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  onPermissionRequest: approveAll,
});

// Track token usage
let totalTokens = 0;
session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("assistant.usage", (e) => {
  totalTokens += e.data.inputTokens + e.data.outputTokens;
});
session.on("session.idle", () => console.log("\n"));

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// Graceful shutdown on Ctrl+C
process.on("SIGINT", async () => {
  console.log("\n\n👋 Shutting down gracefully...");
  rl.close();
  await client.stop();
  process.exit(0);
});

function showHelp() {
  console.log("\n  Available commands:");
  console.log("  /help    — Show this help message");
  console.log("  /usage   — Show token usage so far");
  console.log("  /model   — Show current model");
  console.log("  /exit    — Exit the chat\n");
}

console.log("💬 Chat with commands — type /help for options\n");

while (true) {
  const input = await rl.question("You: ");
  const trimmed = input.trim();
  if (!trimmed) continue;

  // Handle slash commands locally — don't send to the model
  if (trimmed.startsWith("/")) {
    const cmd = trimmed.toLowerCase();
    if (cmd === "/help") {
      showHelp();
    } else if (cmd === "/usage") {
      console.log(`\n  📊 Total tokens used: ${totalTokens}\n`);
    } else if (cmd === "/model") {
      console.log(`\n  🤖 Current model: gpt-4.1\n`);
    } else if (cmd === "/exit") {
      console.log("Goodbye! 👋");
      break;
    } else {
      console.log(`\n  Unknown command: ${cmd}. Type /help for options.\n`);
    }
    continue; // Don't send commands to the model
  }

  // Regular message — send to the model
  process.stdout.write("Assistant: ");
  await session.sendAndWait({ prompt: trimmed });
}

rl.close();
await client.stop();
process.exit(0);
