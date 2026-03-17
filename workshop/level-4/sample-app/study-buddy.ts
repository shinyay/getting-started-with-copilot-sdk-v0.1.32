/**
 * study-buddy.ts — Capstone: Interactive quiz assistant
 *
 * The complete Level 4 experience — combining:
 * - System message (quiz master personality)
 * - onUserInputRequest (agent asks quiz questions)
 * - Custom tools (generate_quiz, check_answer, get_hint, track_score)
 * - Streaming responses
 * - Per-turn usage monitoring
 * - Slash commands (/help, /score, /topic, /exit)
 * - Graceful Ctrl+C handling
 *
 * Exercises covered: 10-12 (Token usage, multi-tool dialog, capstone)
 *
 * Run: npx tsx study-buddy.ts
 */

import { CopilotClient, defineTool, approveAll } from "@github/copilot-sdk";
import readline from "node:readline/promises";

// --- State ---
let score = { correct: 0, total: 0 };
let currentTopic = "general knowledge";

// --- Tools ---

const generateQuiz = defineTool("generate_quiz", {
  description: "Generate a quiz question on a specific topic with 4 multiple-choice answers",
  parameters: {
    type: "object",
    properties: {
      topic: { type: "string", description: "The quiz topic" },
      difficulty: { type: "string", description: "Easy, medium, or hard" },
    },
    required: ["topic"],
  },
  handler: async (args: { topic: string; difficulty?: string }) => {
    currentTopic = args.topic;
    return {
      topic: args.topic,
      difficulty: args.difficulty ?? "medium",
      instruction: "Generate a quiz question on this topic with 4 choices (A-D) and indicate the correct answer.",
    };
  },
});

const checkAnswer = defineTool("check_answer", {
  description: "Record whether the user's quiz answer was correct or incorrect",
  parameters: {
    type: "object",
    properties: {
      correct: { type: "boolean", description: "Whether the answer was correct" },
    },
    required: ["correct"],
  },
  handler: async (args: { correct: boolean }) => {
    score.total++;
    if (args.correct) score.correct++;
    return {
      currentScore: `${score.correct}/${score.total}`,
      percentage: score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0,
    };
  },
});

const getHint = defineTool("get_hint", {
  description: "Provide a hint for the current quiz question without revealing the answer",
  parameters: {
    type: "object",
    properties: {
      topic: { type: "string", description: "The quiz topic for context" },
    },
    required: ["topic"],
  },
  handler: async (args: { topic: string }) => {
    return { instruction: `Provide a helpful hint about ${args.topic} that guides toward the answer without giving it away.` };
  },
});

const getScore = defineTool("get_score", {
  description: "Get the user's current quiz score",
  parameters: { type: "object", properties: {} },
  handler: async () => {
    return {
      correct: score.correct,
      total: score.total,
      percentage: score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0,
    };
  },
});

// --- readline ---
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// --- Client & Session ---
const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  onPermissionRequest: approveAll,
  tools: [generateQuiz, checkAnswer, getHint, getScore],

  systemMessage: {
    content: `You are Study Buddy, a friendly and encouraging quiz master. 
When the user asks for a quiz, use the generate_quiz tool and then present a fun multiple-choice question.
When the user answers, evaluate their answer and use check_answer to record the result.
If they ask for a hint, use the get_hint tool.
Keep the tone upbeat and educational. Use emojis occasionally.`,
  },

  onUserInputRequest: async (request) => {
    console.log();
    const answer = await rl.question(`🤖 ${request.question}\n   > `);
    return { answer: answer.trim(), wasFreeform: true };
  },
});

// --- Events ---
let turnTokens = 0;
session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("assistant.usage", (e) => {
  turnTokens = e.data.inputTokens + e.data.outputTokens;
});
session.on("session.idle", () => {
  console.log(`\n  [${turnTokens} tokens this turn | Score: ${score.correct}/${score.total}]\n`);
});

// --- Signal handling ---
process.on("SIGINT", async () => {
  console.log(`\n\n📊 Final score: ${score.correct}/${score.total}`);
  console.log("👋 Goodbye!");
  rl.close();
  await client.stop();
  process.exit(0);
});

// --- Commands ---
function showHelp() {
  console.log("\n  📚 Study Buddy Commands:");
  console.log("  /help    — Show this help");
  console.log("  /score   — Show current score");
  console.log("  /topic   — Show current topic");
  console.log("  /exit    — Quit\n");
}

// --- Main loop ---
console.log("╔══════════════════════════════════════════════╗");
console.log("║   📚 Study Buddy — Interactive Quiz Master   ║");
console.log("║                                              ║");
console.log("║   Try: \"Quiz me on JavaScript\"               ║");
console.log("║   Commands: /help /score /topic /exit        ║");
console.log("╚══════════════════════════════════════════════╝\n");

while (true) {
  const input = await rl.question("You: ");
  const trimmed = input.trim();
  if (!trimmed) continue;

  if (trimmed.startsWith("/")) {
    const cmd = trimmed.toLowerCase();
    if (cmd === "/help") showHelp();
    else if (cmd === "/score") console.log(`\n  📊 Score: ${score.correct}/${score.total} (${score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%)\n`);
    else if (cmd === "/topic") console.log(`\n  📖 Current topic: ${currentTopic}\n`);
    else if (cmd === "/exit") { console.log(`\n📊 Final score: ${score.correct}/${score.total}\nGoodbye! 👋`); break; }
    else console.log(`\n  Unknown command. Type /help.\n`);
    continue;
  }

  process.stdout.write("Assistant: ");
  await session.sendAndWait({ prompt: trimmed });
}

rl.close();
await client.stop();
process.exit(0);
