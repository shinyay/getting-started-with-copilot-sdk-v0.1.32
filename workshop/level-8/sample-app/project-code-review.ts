/**
 * project-code-review.ts — Project: Code review agent (L5+L6+L7)
 *
 * A self-contained code review agent combining:
 *   Level 5: Hooks (permission gating + audit logging)
 *   Level 6: MCP filesystem server + custom agent persona
 *   Level 7: Session persistence
 *
 * Exercise covered: 6 (Project: Code review agent)
 *
 * Run: npx tsx project-code-review.ts
 */

import { CopilotClient, defineTool, approveAll } from "@github/copilot-sdk";
import path from "node:path";

const docsPath = path.resolve("../../level-6/sample-app/sample-docs");
const auditLog: string[] = [];

const client = new CopilotClient();
const session = await client.createSession({
  sessionId: "code-review-demo",
  model: "gpt-4.1",
  streaming: true,
  onPermissionRequest: approveAll,

  // L6: Custom agent persona
  customAgents: [{
    name: "security-reviewer",
    displayName: "Security Reviewer",
    description: "Expert at finding security vulnerabilities in code",
    prompt: "You are a senior security engineer. Focus on: hardcoded secrets, injection vulnerabilities, authentication flaws, and data exposure. Rate severity as LOW/MEDIUM/HIGH/CRITICAL.",
  }],

  // L6: MCP filesystem (read-only)
  mcpServers: {
    project: {
      type: "local",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", docsPath],
      tools: ["read_file", "list_directory"],
      timeout: 15000,
    },
  },

  // L5: Hooks for permission gating + audit
  hooks: {
    onPreToolUse: async (input) => {
      auditLog.push(`[TOOL] ${input.toolName}(${JSON.stringify(input.toolArgs).slice(0, 80)})`);
      if (["shell", "bash", "editFile"].includes(input.toolName)) {
        return { permissionDecision: "deny", permissionDecisionReason: "Read-only review mode" };
      }
      return { permissionDecision: "allow" };
    },
    onSessionEnd: async () => {
      console.log(`\n📋 Audit: ${auditLog.length} tool calls recorded`);
      return null;
    },
  },
});

session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("session.idle", () => console.log("\n"));

console.log("🔍 Code Review Agent (L5+L6+L7)\n");
process.stdout.write("Assistant: ");
await session.sendAndWait({
  prompt: "Review the project's API reference documentation for security issues. Read the api-reference.md file and analyze it.",
});

console.log(`📋 Audit log: ${auditLog.join(" → ")}`);

await client.stop();
process.exit(0);
