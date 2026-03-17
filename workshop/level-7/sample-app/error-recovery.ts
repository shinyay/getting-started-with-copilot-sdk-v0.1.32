/**
 * error-recovery.ts — Production error recovery patterns
 *
 * Combines onErrorOccurred hook with practical retry logic,
 * graceful degradation, and user-friendly error messages.
 *
 * Exercise covered: 10 (Error recovery patterns)
 *
 * Run: npx tsx error-recovery.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";

let retryCount = 0;

const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  onPermissionRequest: approveAll,
  hooks: {
    onErrorOccurred: async (input) => {
      console.log(`\n  ⚠️  Error occurred:`);
      console.log(`      Context: ${input.errorContext}`);
      console.log(`      Error: ${input.error}`);
      console.log(`      Recoverable: ${input.recoverable}`);

      // Strategy 1: Retry rate limits
      if (input.errorContext === "model_call" && input.error.includes("rate")) {
        retryCount++;
        console.log(`      → Retry #${retryCount} (rate limit)`);
        return {
          errorHandling: "retry",
          retryCount: 3,
          userNotification: `Rate limit hit. Retrying (attempt ${retryCount}/3)...`,
        };
      }

      // Strategy 2: Skip non-critical tool failures
      if (input.errorContext === "tool_execution" && input.recoverable) {
        console.log("      → Skipping failed tool");
        return {
          errorHandling: "skip",
          userNotification: "A tool encountered an error and was skipped.",
        };
      }

      // Strategy 3: Abort on system errors
      if (input.errorContext === "system") {
        console.log("      → Aborting (system error)");
        return {
          errorHandling: "abort",
          userNotification: "A system error occurred. Please restart the application.",
        };
      }

      // Default: let SDK handle it
      console.log("      → Using default handling");
      return null;
    },
  },
});

session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("session.idle", () => console.log("\n"));

console.log("🛡️  Error Recovery Patterns\n");
console.log("This demo shows the onErrorOccurred hook with production strategies.\n");

process.stdout.write("Assistant: ");
await session.sendAndWait({
  prompt: "Explain the circuit breaker pattern in software engineering. Keep it to 3 sentences.",
});

console.log("=== Recovery Strategy Matrix ===\n");
console.log("  ┌──────────────────┬──────────────────┬──────────────────┐");
console.log("  │ errorContext      │ Strategy         │ When             │");
console.log("  ├──────────────────┼──────────────────┼──────────────────┤");
console.log("  │ model_call       │ retry (3x)       │ Rate limits      │");
console.log("  │ tool_execution   │ skip             │ Non-critical     │");
console.log("  │ system           │ abort            │ Fatal errors     │");
console.log("  │ user_input       │ skip             │ Invalid input    │");
console.log("  └──────────────────┴──────────────────┴──────────────────┘");

await client.stop();
process.exit(0);
