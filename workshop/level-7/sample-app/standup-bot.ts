/**
 * standup-bot.ts — Capstone: Production-grade daily standup assistant
 *
 * Combines all Level 7 production patterns:
 * - Session persistence (resume yesterday's context)
 * - Configurable provider (BYOK-ready)
 * - Custom tools (standup workflow)
 * - Error recovery hooks
 * - Structured logging and usage tracking
 * - Graceful shutdown
 *
 * Exercises covered: 11 (Logging and observability), 12 (Capstone)
 *
 * Run: npx tsx standup-bot.ts
 */

import { CopilotClient, defineTool, approveAll } from "@github/copilot-sdk";
import readline from "node:readline/promises";

// --- Configuration ---
const date = new Date().toISOString().split("T")[0];
const sessionId = `team-standup-${date}`;

// --- Standup data (in production, this would be a database) ---
const standupData: {
  yesterday: string[];
  today: string[];
  blockers: string[];
} = { yesterday: [], today: [], blockers: [] };

// --- Tools ---
const getYesterday = defineTool("get_yesterday_items", {
  description: "Get the list of tasks completed yesterday from the standup record",
  parameters: { type: "object", properties: {} },
  handler: async () => {
    return {
      items: standupData.yesterday.length > 0
        ? standupData.yesterday
        : ["No items recorded yet. Ask the user what they did yesterday."],
    };
  },
});

const recordPlan = defineTool("record_today_plan", {
  description: "Record what the user plans to work on today",
  parameters: {
    type: "object",
    properties: {
      items: {
        type: "array",
        items: { type: "string" },
        description: "List of planned tasks for today",
      },
    },
    required: ["items"],
  },
  handler: async (args: { items: string[] }) => {
    standupData.today.push(...args.items);
    console.log(`  📝 [Recorded ${args.items.length} plan item(s)]`);
    return { recorded: args.items, total: standupData.today.length };
  },
});

const flagBlocker = defineTool("flag_blocker", {
  description: "Flag a blocker or impediment that is preventing progress",
  parameters: {
    type: "object",
    properties: {
      blocker: { type: "string", description: "Description of the blocker" },
      severity: { type: "string", description: "low, medium, or high severity" },
    },
    required: ["blocker"],
  },
  handler: async (args: { blocker: string; severity?: string }) => {
    standupData.blockers.push(args.blocker);
    console.log(`  🚧 [Blocker flagged: ${args.blocker}]`);
    return { blocker: args.blocker, severity: args.severity ?? "medium", totalBlockers: standupData.blockers.length };
  },
});

// --- Logging ---
const logs: string[] = [];
function log(msg: string) {
  const entry = `${new Date().toISOString()} ${msg}`;
  logs.push(entry);
}

// --- Client + Session ---
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const client = new CopilotClient();

let totalTokens = 0;
let turnCount = 0;

log(`Session starting: ${sessionId}`);

const session = await client.createSession({
  sessionId,
  model: "gpt-4.1",
  streaming: true,
  onPermissionRequest: approveAll,
  tools: [getYesterday, recordPlan, flagBlocker],
  systemMessage: {
    content:
      "You are a friendly standup facilitator. Guide the team through the 3 standup questions: " +
      "1) What did you do yesterday? 2) What will you do today? 3) Any blockers? " +
      "Use the tools to record responses. Be concise and encouraging.",
  },
  hooks: {
    onPreToolUse: async (input) => {
      log(`Tool called: ${input.toolName}`);
      return { permissionDecision: "allow" };
    },
    onErrorOccurred: async (input) => {
      log(`Error: ${input.errorContext} — ${input.error}`);
      if (input.recoverable) {
        return { errorHandling: "retry", retryCount: 2 };
      }
      return { errorHandling: "skip", userNotification: "An error occurred, continuing..." };
    },
    onSessionEnd: async (input) => {
      log(`Session ended: ${input.reason}`);
      return null;
    },
  },
});

// --- Events ---
session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("assistant.usage", (e) => {
  totalTokens += e.data.inputTokens + e.data.outputTokens;
  turnCount++;
});
session.on("session.idle", () => {
  console.log(`\n  [Turn ${turnCount} | ${totalTokens} total tokens]\n`);
});

// --- Signal handling ---
process.on("SIGINT", async () => {
  console.log("\n\n📋 Standup Summary:");
  console.log(`  Yesterday: ${standupData.yesterday.length > 0 ? standupData.yesterday.join(", ") : "not recorded"}`);
  console.log(`  Today: ${standupData.today.length > 0 ? standupData.today.join(", ") : "not recorded"}`);
  console.log(`  Blockers: ${standupData.blockers.length > 0 ? standupData.blockers.join(", ") : "none"}`);
  console.log(`\n📊 Session: ${turnCount} turns, ${totalTokens} tokens`);
  console.log(`📋 Log entries: ${logs.length}`);
  rl.close();
  await client.stop();
  process.exit(0);
});

// --- Main ---
console.log("╔══════════════════════════════════════════════╗");
console.log("║   📋 Daily Standup Bot                       ║");
console.log("║                                              ║");
console.log(`║   Session: ${sessionId}     ║`);
console.log("║   Tools: yesterday, plan, blockers           ║");
console.log("║   Type 'exit' to finish                      ║");
console.log("╚══════════════════════════════════════════════╝\n");

// Kick off the standup
process.stdout.write("Assistant: ");
await session.sendAndWait({
  prompt: "Start the daily standup. Ask me about yesterday first.",
});

while (true) {
  const input = await rl.question("You: ");
  const trimmed = input.trim();
  if (!trimmed) continue;
  if (trimmed.toLowerCase() === "exit") break;

  log(`User input: ${trimmed.slice(0, 50)}...`);
  process.stdout.write("\nAssistant: ");
  await session.sendAndWait({ prompt: trimmed });
}

// Print summary
console.log("\n📋 Standup Complete:");
console.log(`  Today's plan: ${standupData.today.join(", ") || "none recorded"}`);
console.log(`  Blockers: ${standupData.blockers.join(", ") || "none"}`);
console.log(`  Session: ${turnCount} turns, ${totalTokens} tokens`);

rl.close();
await client.stop();
process.exit(0);
