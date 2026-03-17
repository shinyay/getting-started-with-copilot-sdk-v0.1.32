/**
 * tool-control.ts — Whitelist and blacklist built-in tools
 *
 * The SDK comes with built-in tools (shell, editFile, etc.). You can
 * control which ones are available using availableTools (whitelist) or
 * excludedTools (blacklist).
 *
 * Exercise covered: 9 (Available and excluded tools)
 *
 * Run: npx tsx tool-control.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";

const client = new CopilotClient();

console.log("🔧 Tool access control demo\n");

// Option 1: EXCLUDE specific tools (blacklist)
console.log("=== Option 1: excludedTools (blacklist) ===");
console.log('  excludedTools: ["shell", "bash", "editFile"]');
console.log("  → Everything available EXCEPT these\n");

const session1 = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  onPermissionRequest: approveAll,
  excludedTools: ["shell", "bash", "editFile"],
  // All other built-in tools remain available
});

session1.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session1.on("session.idle", () => console.log("\n"));

process.stdout.write("Assistant: ");
await session1.sendAndWait({
  prompt: "What tools do you have available? List them briefly.",
});

// Option 2: ALLOW specific tools only (whitelist)
console.log("=== Option 2: availableTools (whitelist) ===");
console.log('  availableTools: ["read_file", "search_code"]');
console.log("  → ONLY these tools available, everything else blocked\n");

/*
 * Note: availableTools is a whitelist — it restricts to ONLY the listed tools.
 * This is more restrictive than excludedTools.
 *
 * const session2 = await client.createSession({
 *   model: "gpt-4.1",
 *   availableTools: ["read_file", "search_code"],
 *   // Only these 2 tools available — no shell, no edit, no write
 * });
 *
 * Use availableTools when you want maximum restriction.
 * Use excludedTools when you want to block a few dangerous tools.
 */

console.log("=== Comparison ===");
console.log("  excludedTools → Block specific tools, allow everything else (blacklist)");
console.log("  availableTools → Allow specific tools, block everything else (whitelist)");
console.log("  Hooks onPreToolUse → Fine-grained per-call control (Level 5)\n");

await client.stop();
process.exit(0);
