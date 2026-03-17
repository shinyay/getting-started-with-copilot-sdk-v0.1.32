/**
 * system-message.ts — Customize the AI's personality with system messages
 *
 * The systemMessage option lets you shape how the AI behaves:
 * - Append mode (default): adds your instructions to the built-in system prompt
 * - Replace mode: completely replaces the system prompt (removes guardrails)
 *
 * This script runs the same prompt with two different system messages
 * to show how personality changes.
 *
 * Exercises covered: 5 (Append mode), 6 (Replace mode)
 *
 * Run: npx tsx system-message.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";

const client = new CopilotClient();
const prompt = "Explain what a variable is in programming.";

// ============================================
// Mode 1: APPEND (default) — adds to system prompt, keeps guardrails
// ============================================
console.log("=== Mode 1: Append — Cheerful math tutor ===\n");

const session1 = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  onPermissionRequest: approveAll,
  systemMessage: {
    // Append mode: your instructions are ADDED to the default system prompt
    // All SDK guardrails and safety features remain active
    content: "You are a cheerful and encouraging math tutor. Use simple analogies and emojis. Keep answers under 3 sentences.",
  },
});

session1.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session1.on("session.idle", () => console.log("\n"));

await session1.sendAndWait({ prompt });

// ============================================
// Mode 2: REPLACE — completely replaces the system prompt
// ============================================
console.log("=== Mode 2: Replace — Strict exam proctor ===\n");

const session2 = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  onPermissionRequest: approveAll,
  systemMessage: {
    mode: "replace",
    // Replace mode: this is the ENTIRE system prompt — no guardrails
    // ⚠️ Use with care — you lose built-in safety features
    content: "You are a strict and formal exam proctor. Give only precise, technical definitions. No analogies, no encouragement. Maximum 2 sentences.",
  },
});

session2.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session2.on("session.idle", () => console.log("\n"));

await session2.sendAndWait({ prompt });

// ============================================
// Summary
// ============================================
console.log("=== Comparison ===");
console.log("Append mode: Personality added, guardrails preserved (recommended)");
console.log("Replace mode: Full control, guardrails removed (use with care)");

await client.stop();
process.exit(0);
