/**
 * prompt-hooks.ts — Intercept and transform user prompts
 *
 * The onUserPromptSubmitted hook fires every time a message is sent.
 * Use it to:
 * - Log all prompts for auditing
 * - Expand shortcuts (/fix → full instruction)
 * - Add hidden context the model should consider
 * - Filter or modify user input
 *
 * Exercises covered: 2 (onUserPromptSubmitted), 3 (Prompt expansion shortcuts)
 *
 * Run: npx tsx prompt-hooks.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";

const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  onPermissionRequest: approveAll,
  hooks: {
    onUserPromptSubmitted: async (input) => {
      console.log(`📝 [onUserPromptSubmitted] Original prompt: "${input.prompt}"`);

      // Shortcut expansion: /fix, /review, /explain
      if (input.prompt.startsWith("/fix")) {
        const target = input.prompt.slice(4).trim() || "the code";
        const expanded = `Fix the errors in ${target}. Show the corrected code and explain what was wrong.`;
        console.log(`   ↳ Expanded to: "${expanded}"`);
        return { modifiedPrompt: expanded };
      }

      if (input.prompt.startsWith("/review")) {
        const target = input.prompt.slice(7).trim() || "the code";
        const expanded = `Review ${target} for security vulnerabilities, performance issues, and best practice violations.`;
        console.log(`   ↳ Expanded to: "${expanded}"`);
        return { modifiedPrompt: expanded };
      }

      if (input.prompt.startsWith("/explain")) {
        const target = input.prompt.slice(8).trim() || "the code";
        const expanded = `Explain ${target} step by step, as if teaching a junior developer.`;
        console.log(`   ↳ Expanded to: "${expanded}"`);
        return { modifiedPrompt: expanded };
      }

      // For non-shortcut prompts, add hidden context
      console.log(`   ↳ Adding context: "User is a senior engineer"`);
      return { additionalContext: "The user is a senior TypeScript engineer. Keep explanations concise and technical." };
    },
  },
});

session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("session.idle", () => console.log("\n"));

// Test 1: Normal prompt (gets additionalContext)
console.log("=== Test 1: Normal prompt ===\n");
process.stdout.write("Assistant: ");
await session.sendAndWait({ prompt: "What is a closure?" });

// Test 2: Shortcut expansion
console.log("=== Test 2: /review shortcut ===\n");
process.stdout.write("Assistant: ");
await session.sendAndWait({ prompt: "/review async error handling patterns" });

await client.stop();
process.exit(0);
