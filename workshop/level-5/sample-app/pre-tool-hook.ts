/**
 * pre-tool-hook.ts — Gate, log, and modify tool execution
 *
 * The onPreToolUse hook fires BEFORE every tool call. Use it to:
 * - Log all tool calls (name + args)
 * - Block dangerous tools (shell, bash, file writes)
 * - Modify arguments before execution
 * - Add context for the tool
 *
 * Exercises covered: 4 (onPreToolUse — gate execution),
 *   5 (Block dangerous tools), 6 (Modify tool arguments)
 *
 * Run: npx tsx pre-tool-hook.ts
 */

import { CopilotClient, defineTool, approveAll } from "@github/copilot-sdk";

// A safe tool to test hooks with
const analyzeCode = defineTool("analyze_code", {
  description: "Analyze a code snippet for potential issues",
  parameters: {
    type: "object",
    properties: {
      code: { type: "string", description: "The code to analyze" },
      language: { type: "string", description: "Programming language" },
    },
    required: ["code"],
  },
  handler: async (args: { code: string; language?: string; safeMode?: boolean }) => {
    console.log(`    🔧 [handler] Received args: ${JSON.stringify(args)}`);
    return {
      language: args.language ?? "unknown",
      issues: ["No semicolons", "Missing error handling"],
      safeMode: args.safeMode ?? false,
    };
  },
});

const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  tools: [analyzeCode],
  onPermissionRequest: approveAll,
  hooks: {
    onPreToolUse: async (input) => {
      console.log(`\n  🛡️  [onPreToolUse] Tool: "${input.toolName}"`);
      console.log(`      Args: ${JSON.stringify(input.toolArgs)}`);

      // Behavior 1: Block dangerous tools
      if (["shell", "bash", "editFile", "execute"].includes(input.toolName)) {
        console.log(`      ❌ DENIED — dangerous tool blocked`);
        return {
          permissionDecision: "deny",
          permissionDecisionReason: `Tool "${input.toolName}" is blocked for security reasons`,
        };
      }

      // Behavior 2: Modify arguments (inject safeMode flag)
      if (input.toolName === "analyze_code") {
        console.log(`      ✏️  Injecting safeMode: true into args`);
        return {
          permissionDecision: "allow",
          modifiedArgs: { ...input.toolArgs, safeMode: true },
        };
      }

      // Default: allow everything else
      console.log(`      ✅ Allowed`);
      return { permissionDecision: "allow" };
    },
  },
});

session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("session.idle", () => console.log("\n"));

console.log("🛡️  Hook demo: logging, blocking, and modifying tool calls\n");
process.stdout.write("Assistant: ");
await session.sendAndWait({
  prompt: 'Analyze this JavaScript code for issues: "const x = 1; console.log(x)"',
});

await client.stop();
process.exit(0);
