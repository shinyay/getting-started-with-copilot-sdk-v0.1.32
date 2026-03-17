/**
 * audit-logger.ts — Full audit trail with combined hooks
 *
 * Combines onPreToolUse and onPostToolUse to create a compliance-grade
 * audit log. Every tool call is logged with: timestamp, tool name,
 * arguments, result, and execution duration.
 *
 * Exercise covered: 8 (Audit logging with hooks)
 *
 * Run: npx tsx audit-logger.ts
 */

import { CopilotClient, defineTool, approveAll } from "@github/copilot-sdk";

// Audit log storage
interface AuditEntry {
  timestamp: string;
  toolName: string;
  args: unknown;
  result: unknown;
  durationMs: number;
}

const auditLog: AuditEntry[] = [];
const pendingCalls = new Map<string, { startTime: number; args: unknown }>();

// Tools to generate audit entries
const readFile = defineTool("read_file", {
  description: "Read the contents of a file by path",
  parameters: {
    type: "object",
    properties: { path: { type: "string", description: "File path to read" } },
    required: ["path"],
  },
  handler: async (args: { path: string }) => {
    return { path: args.path, content: `// Contents of ${args.path}\nconsole.log("hello");`, size: "42 bytes" };
  },
});

const searchCode = defineTool("search_code", {
  description: "Search for a pattern in the codebase",
  parameters: {
    type: "object",
    properties: { pattern: { type: "string", description: "Search pattern" } },
    required: ["pattern"],
  },
  handler: async (args: { pattern: string }) => {
    return { pattern: args.pattern, matches: [`src/index.ts:5`, `src/utils.ts:12`], count: 2 };
  },
});

const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  tools: [readFile, searchCode],
  onPermissionRequest: approveAll,
  hooks: {
    onPreToolUse: async (input) => {
      // Record start time for duration tracking
      const callId = `${input.toolName}-${Date.now()}`;
      pendingCalls.set(input.toolName, { startTime: Date.now(), args: input.toolArgs });
      console.log(`  📥 [PRE]  ${input.toolName}(${JSON.stringify(input.toolArgs)})`);
      return { permissionDecision: "allow" };
    },

    onPostToolUse: async (input) => {
      const pending = pendingCalls.get(input.toolName);
      const duration = pending ? Date.now() - pending.startTime : 0;

      const entry: AuditEntry = {
        timestamp: new Date().toISOString(),
        toolName: input.toolName,
        args: input.toolArgs,
        result: input.toolResult,
        durationMs: duration,
      };
      auditLog.push(entry);

      console.log(`  📤 [POST] ${input.toolName} → completed in ${duration}ms`);
      pendingCalls.delete(input.toolName);
      return null; // Don't modify the result
    },
  },
});

session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("session.idle", () => console.log("\n"));

console.log("📋 Audit logging demo — every tool call is recorded\n");
process.stdout.write("Assistant: ");
await session.sendAndWait({
  prompt: "Find all console.log calls in the codebase, then read the index.ts file.",
});

// Print audit summary
console.log("╔══════════════════════════════════════════════╗");
console.log("║   📋 Audit Log Summary                       ║");
console.log("╚══════════════════════════════════════════════╝\n");
for (const entry of auditLog) {
  console.log(`  ${entry.timestamp}`);
  console.log(`    Tool: ${entry.toolName}`);
  console.log(`    Args: ${JSON.stringify(entry.args)}`);
  console.log(`    Duration: ${entry.durationMs}ms`);
  console.log();
}
console.log(`Total tool calls: ${auditLog.length}`);

await client.stop();
process.exit(0);
