/**
 * safe-coder.ts — Capstone: Security-aware coding assistant
 *
 * Combines ALL 6 hook types into a cohesive security-focused application:
 *   onSessionStart     → inject project rules and context
 *   onUserPromptSubmitted → expand shortcuts, add expertise context
 *   onPreToolUse       → permission gating (block shell, allow reads, ask for writes)
 *   onPostToolUse      → redact PII and secrets from results
 *   onSessionEnd       → print audit summary
 *   onErrorOccurred    → retry transient errors, skip tool failures
 *
 * Plus: custom tools, streaming, usage tracking
 *
 * Exercises covered: 9 (onSessionEnd), 11 (Combine all hooks), 12 (Capstone)
 *
 * Run: npx tsx safe-coder.ts
 */

import { CopilotClient, defineTool, approveAll } from "@github/copilot-sdk";
import readline from "node:readline/promises";

// --- Audit state ---
interface AuditEntry {
  time: string;
  tool: string;
  decision: string;
  duration?: number;
}
const auditLog: AuditEntry[] = [];
const toolTimers = new Map<string, number>();
let promptCount = 0;
let totalTokens = 0;

// --- Tools ---
const readFile = defineTool("read_file", {
  description: "Read the contents of a source code file",
  parameters: {
    type: "object",
    properties: { path: { type: "string", description: "File path" } },
    required: ["path"],
  },
  handler: async (args: { path: string }) => ({
    path: args.path,
    content: `// ${args.path}\nconst password = "secret123";\nconst apiKey = "sk-abc123";\nexport function main() { console.log("hello"); }`,
    lines: 4,
  }),
});

const analyzeCode = defineTool("analyze_code", {
  description: "Analyze source code for security vulnerabilities and code quality issues",
  parameters: {
    type: "object",
    properties: {
      code: { type: "string", description: "Code to analyze" },
      focus: { type: "string", description: "Focus area: security, performance, or quality" },
    },
    required: ["code"],
  },
  handler: async (args: { code: string; focus?: string }) => ({
    focus: args.focus ?? "general",
    issues: [
      { severity: "HIGH", message: "Hardcoded password found", line: 2 },
      { severity: "HIGH", message: "API key in source code", line: 3 },
      { severity: "LOW", message: "console.log in production code", line: 4 },
    ],
    score: "3/10",
  }),
});

const suggestFix = defineTool("suggest_fix", {
  description: "Suggest a code fix for a specific security or quality issue",
  parameters: {
    type: "object",
    properties: {
      issue: { type: "string", description: "Description of the issue to fix" },
      language: { type: "string", description: "Programming language" },
    },
    required: ["issue"],
  },
  handler: async (args: { issue: string; language?: string }) => ({
    issue: args.issue,
    suggestion: "Move secrets to environment variables using process.env",
    example: 'const password = process.env.DB_PASSWORD ?? "";\nconst apiKey = process.env.API_KEY ?? "";',
  }),
});

// --- readline ---
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// --- Client + Session with ALL hooks ---
const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  tools: [readFile, analyzeCode, suggestFix],
  onPermissionRequest: approveAll,
  systemMessage: {
    content: "You are Safe Coder, a security-focused code review assistant. Always prioritize security findings. Be thorough but concise.",
  },
  hooks: {
    // Hook 1: Session start — inject project context
    onSessionStart: async (input) => {
      console.log(`  📋 [SESSION START] source: ${input.source}`);
      return {
        additionalContext: "Project: TypeScript/Node.js. Security policy: no hardcoded secrets, no shell execution, all changes require review.",
      };
    },

    // Hook 2: Prompt submitted — expand shortcuts, add context
    onUserPromptSubmitted: async (input) => {
      promptCount++;
      if (input.prompt.startsWith("/fix")) {
        return { modifiedPrompt: `Fix the security issue: ${input.prompt.slice(4).trim()}. Show the corrected code.` };
      }
      if (input.prompt.startsWith("/review")) {
        return { modifiedPrompt: `Review this code for security vulnerabilities: ${input.prompt.slice(7).trim()}` };
      }
      return { additionalContext: "Focus on security implications in your analysis." };
    },

    // Hook 3: Pre-tool — permission gating + logging
    onPreToolUse: async (input) => {
      const timestamp = new Date().toISOString();

      // Block dangerous tools
      if (["shell", "bash", "editFile", "execute"].includes(input.toolName)) {
        auditLog.push({ time: timestamp, tool: input.toolName, decision: "DENIED" });
        console.log(`  🚫 [PRE-TOOL] DENIED: ${input.toolName}`);
        return { permissionDecision: "deny", permissionDecisionReason: "Blocked by security policy" };
      }

      // Allow read-only tools
      auditLog.push({ time: timestamp, tool: input.toolName, decision: "ALLOWED" });
      toolTimers.set(input.toolName, Date.now());
      console.log(`  ✅ [PRE-TOOL] Allowed: ${input.toolName}`);
      return { permissionDecision: "allow" };
    },

    // Hook 4: Post-tool — redact sensitive data
    onPostToolUse: async (input) => {
      const start = toolTimers.get(input.toolName);
      const duration = start ? Date.now() - start : 0;
      const lastEntry = auditLog[auditLog.length - 1];
      if (lastEntry) lastEntry.duration = duration;

      // Redact secrets from results
      let resultStr = JSON.stringify(input.toolResult);
      const secrets = [/password['":\s]*['"][^'"]+['"]/gi, /apiKey['":\s]*['"][^'"]+['"]/gi, /sk-[a-zA-Z0-9]+/g];
      let redacted = false;
      for (const pattern of secrets) {
        if (pattern.test(resultStr)) {
          resultStr = resultStr.replace(pattern, (match) => match.replace(/['"][^'"]+['"]$|sk-[a-zA-Z0-9]+/, '"[REDACTED]"'));
          redacted = true;
        }
      }
      if (redacted) {
        console.log(`  🔒 [POST-TOOL] Redacted secrets from ${input.toolName} result`);
        try {
          return { modifiedResult: JSON.parse(resultStr) };
        } catch {
          return null;
        }
      }
      return null;
    },

    // Hook 5: Session end — print audit summary
    onSessionEnd: async (input) => {
      console.log(`\n  📋 [SESSION END] reason: ${input.reason}`);
      console.log(`      Prompts: ${promptCount} | Tool calls: ${auditLog.length} | Tokens: ${totalTokens}`);
      return null;
    },

    // Hook 6: Error occurred — recovery strategies
    onErrorOccurred: async (input) => {
      console.log(`  ⚠️  [ERROR] ${input.errorContext}: ${input.error}`);
      if (input.recoverable) {
        return { errorHandling: "retry", retryCount: 2, userNotification: "Retrying..." };
      }
      return { errorHandling: "skip", userNotification: "An error occurred, continuing..." };
    },
  },
});

// --- Events ---
session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("assistant.usage", (e) => { totalTokens += e.data.inputTokens + e.data.outputTokens; });
session.on("session.idle", () => console.log("\n"));

// --- Signal handling ---
process.on("SIGINT", async () => {
  console.log("\n\n📋 Audit summary on exit:");
  auditLog.forEach((e) => console.log(`  ${e.time} | ${e.tool} | ${e.decision} | ${e.duration ?? 0}ms`));
  rl.close();
  await client.stop();
  process.exit(0);
});

// --- Main ---
console.log("╔══════════════════════════════════════════════╗");
console.log("║   🔒 Safe Coder — Security Code Reviewer     ║");
console.log("║                                              ║");
console.log("║   All 6 hooks active:                        ║");
console.log("║   ✅ onSessionStart   (project context)      ║");
console.log("║   ✅ onPromptSubmitted (shortcuts + context)  ║");
console.log("║   ✅ onPreToolUse     (permission gating)     ║");
console.log("║   ✅ onPostToolUse    (secret redaction)      ║");
console.log("║   ✅ onSessionEnd     (audit summary)         ║");
console.log("║   ✅ onErrorOccurred  (error recovery)        ║");
console.log("║                                              ║");
console.log("║   Shortcuts: /review, /fix                   ║");
console.log("║   Type 'exit' to quit                        ║");
console.log("╚══════════════════════════════════════════════╝\n");

while (true) {
  const input = await rl.question("You: ");
  const trimmed = input.trim();
  if (!trimmed) continue;
  if (trimmed.toLowerCase() === "exit") break;

  process.stdout.write("\nAssistant: ");
  await session.sendAndWait({ prompt: trimmed });
}

// Print final audit
console.log("\n📋 Final Audit Log:");
auditLog.forEach((e) => console.log(`  ${e.time} | ${e.tool} | ${e.decision} | ${e.duration ?? 0}ms`));
console.log(`\nTotal: ${promptCount} prompts, ${auditLog.length} tool calls, ${totalTokens} tokens`);

rl.close();
await client.stop();
process.exit(0);
