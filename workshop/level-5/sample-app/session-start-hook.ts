/**
 * session-start-hook.ts — Inject context when a session starts
 *
 * The onSessionStart hook fires once when a session is created.
 * Use it to inject project context, user preferences, or configuration
 * that the model should know about for the entire conversation.
 *
 * input.source tells you HOW the session started:
 *   "startup" — fresh session
 *   "resume"  — resumed from persistence
 *   "new"     — new session on existing client
 *
 * Exercise covered: 1 (Your first hook: onSessionStart)
 *
 * Run: npx tsx session-start-hook.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";

const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  onPermissionRequest: approveAll,
  hooks: {
    onSessionStart: async (input) => {
      console.log(`📋 [onSessionStart] Session started — source: "${input.source}"`);

      // Return additionalContext to inject project information
      return {
        additionalContext:
          "This project uses TypeScript with strict mode. " +
          "It follows functional programming patterns and uses the Copilot SDK. " +
          "The user is a senior engineer who prefers concise, technical answers.",
      };
    },
  },
});

session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("session.idle", () => console.log("\n"));

console.log("💡 The onSessionStart hook injected project context.\n");
console.log("Watch how the model knows about TypeScript + functional patterns:\n");

process.stdout.write("Assistant: ");
await session.sendAndWait({
  prompt: "What design patterns should I use in my project?",
});

await client.stop();
process.exit(0);
