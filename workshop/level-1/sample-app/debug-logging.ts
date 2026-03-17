/**
 * debug-logging.ts — See the JSON-RPC traffic between SDK and CLI
 *
 * Setting logLevel: "debug" on CopilotClient reveals the raw JSON-RPC
 * messages exchanged between your code and the Copilot CLI subprocess.
 *
 * What to look for in the output:
 * - "-> " lines: messages SENT to the CLI (requests)
 * - "<- " lines: messages RECEIVED from the CLI (responses)
 * - session.create: the session creation request with model config
 * - session.sendMessage: your prompt being sent
 * - session.event: events coming back (message content, usage, idle)
 *
 * This is the most powerful debugging tool for understanding SDK behavior.
 *
 * Exercise covered: 10 (Enable debug logging)
 *
 * Run: npx tsx debug-logging.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";

// Enable debug logging by passing logLevel to the client constructor
const client = new CopilotClient({ logLevel: "debug" });

const session = await client.createSession({ model: "gpt-4.1", onPermissionRequest: approveAll });

console.log("\n=== Sending prompt (watch the JSON-RPC traffic above) ===\n");

const response = await session.sendAndWait({
  prompt: "What is 2 + 2? Reply with just the number.",
});

console.log("\n=== Response ===");
console.log("Content:", response?.data.content);

await client.stop();
process.exit(0);
