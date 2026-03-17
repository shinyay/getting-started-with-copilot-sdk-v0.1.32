/**
 * error-hook.ts — Custom error handling with onErrorOccurred
 *
 * The onErrorOccurred hook fires when errors happen during:
 * - Model calls (rate limits, network issues)
 * - Tool execution (handler throws)
 * - System errors
 *
 * You can: retry, skip, or abort — and show friendly notifications.
 *
 * Exercise covered: 10 (onErrorOccurred — custom error handling)
 *
 * Run: npx tsx error-hook.ts
 */

import { CopilotClient, defineTool, approveAll } from "@github/copilot-sdk";

// A tool that intentionally fails sometimes
const riskyTool = defineTool("risky_operation", {
  description: "Perform a risky operation that might fail",
  parameters: {
    type: "object",
    properties: {
      operation: { type: "string", description: "Operation to perform" },
    },
    required: ["operation"],
  },
  handler: async (args: { operation: string }) => {
    // Simulate intermittent failure
    if (args.operation.toLowerCase().includes("danger")) {
      throw new Error("Simulated operation failure: connection timeout");
    }
    return { status: "success", operation: args.operation, result: "Operation completed safely" };
  },
});

const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  tools: [riskyTool],
  onPermissionRequest: approveAll,
  hooks: {
    onErrorOccurred: async (input) => {
      console.log(`\n  ⚠️  [onErrorOccurred]`);
      console.log(`      Error: ${input.error}`);
      console.log(`      Context: ${input.errorContext}`);
      console.log(`      Recoverable: ${input.recoverable}`);

      // Strategy 1: Retry transient errors (model calls)
      if (input.errorContext === "model_call" && input.error.includes("rate")) {
        console.log(`      → Retrying (rate limit)`);
        return {
          errorHandling: "retry",
          retryCount: 3,
          userNotification: "Rate limit hit. Retrying...",
        };
      }

      // Strategy 2: Skip non-critical tool errors
      if (input.errorContext === "tool_execution") {
        console.log(`      → Skipping failed tool`);
        return {
          errorHandling: "skip",
          userNotification: "A tool encountered an error and was skipped.",
        };
      }

      // Strategy 3: Abort on system errors
      if (input.errorContext === "system") {
        console.log(`      → Aborting (system error)`);
        return {
          errorHandling: "abort",
          userNotification: "A system error occurred. Please try again.",
        };
      }

      // Default: let the SDK handle it
      return null;
    },
  },
});

session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("session.idle", () => console.log("\n"));

console.log("⚠️  Error hook demo — custom error recovery strategies\n");

// Test with a safe operation first
process.stdout.write("Assistant: ");
await session.sendAndWait({
  prompt: 'Run the risky_operation with operation "safe check".',
});

// Test with a dangerous operation that will trigger the error hook
console.log("Now testing with an operation that will fail:\n");
process.stdout.write("Assistant: ");
await session.sendAndWait({
  prompt: 'Run the risky_operation with operation "danger zone test".',
});

await client.stop();
process.exit(0);
