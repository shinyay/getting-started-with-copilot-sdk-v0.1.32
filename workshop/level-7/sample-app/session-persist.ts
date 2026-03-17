/**
 * session-persist.ts — Pause and resume conversations across restarts
 *
 * By providing a stable sessionId, conversations are automatically
 * persisted to ~/.copilot/session-state/{sessionId}/. You can resume
 * them later — even after restarting your application.
 *
 * What persists: conversation history, tool results, agent plan
 * What doesn't: API keys (re-provide for BYOK), in-memory tool state
 *
 * Exercises covered: 5 (Session persistence basics), 6 (Session ID strategies)
 *
 * Run: npx tsx session-persist.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";

// Structured session ID — easy to audit, find, and clean up
const userId = "demo-user";
const date = new Date().toISOString().split("T")[0]; // 2024-01-15
const sessionId = `${userId}-standup-${date}`;

console.log("💾 Session Persistence Demo\n");
console.log(`Session ID: ${sessionId}`);
console.log(`Persisted to: ~/.copilot/session-state/${sessionId}/\n`);

// --- Phase 1: Create and send first message ---
console.log("=== Phase 1: Initial session ===\n");

const client1 = new CopilotClient();
const session1 = await client1.createSession({
  sessionId,  // ← This enables persistence
  model: "gpt-4.1",
  streaming: true,
  onPermissionRequest: approveAll,
});

session1.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session1.on("session.idle", () => console.log("\n"));

process.stdout.write("Assistant: ");
await session1.sendAndWait({
  prompt: "Remember this: my favorite programming language is TypeScript and my name is Alex.",
});

// Stop the client — simulating application shutdown
await client1.stop();
console.log("--- Client stopped (simulating restart) ---\n");

// --- Phase 2: Resume and verify context is preserved ---
console.log("=== Phase 2: Resumed session ===\n");

const client2 = new CopilotClient();
const session2 = await client2.resumeSession(sessionId);

session2.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session2.on("session.idle", () => console.log("\n"));

process.stdout.write("Assistant: ");
await session2.sendAndWait({
  prompt: "What's my name and favorite language? (Testing that persistence works)",
});

console.log("=== Session ID Best Practices ===");
console.log(`  Pattern: {userId}-{task}-{date}`);
console.log(`  Example: ${sessionId}`);
console.log("  Benefits: easy auditing, cleanup, access control\n");

console.log("=== What Persists ===");
console.log("  ✅ Conversation history");
console.log("  ✅ Tool results");
console.log("  ✅ Agent plan and artifacts");
console.log("  ❌ API keys (re-provide for BYOK)");
console.log("  ❌ In-memory tool state (rebuilt on resume)");

await client2.stop();
process.exit(0);
