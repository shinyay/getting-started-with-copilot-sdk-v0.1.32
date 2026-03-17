/**
 * project-quiz.ts — Project: Interactive quiz generator (L3+L4)
 *
 * A self-contained quiz app combining:
 *   Level 3: Custom tools (generate, evaluate, hint)
 *   Level 4: onUserInputRequest + systemMessage + REPL
 *
 * Exercise covered: 7 (Project: Interactive quiz generator)
 *
 * Run: npx tsx project-quiz.ts
 */

import { CopilotClient, defineTool, approveAll } from "@github/copilot-sdk";
import readline from "node:readline/promises";

let score = { correct: 0, total: 0 };

const generateQuestion = defineTool("generate_question", {
  description: "Generate a quiz question with 4 multiple-choice answers on a topic",
  parameters: {
    type: "object",
    properties: {
      topic: { type: "string", description: "Quiz topic" },
      difficulty: { type: "string", description: "easy, medium, or hard" },
    },
    required: ["topic"],
  },
  handler: async (args: { topic: string; difficulty?: string }) => ({
    topic: args.topic,
    difficulty: args.difficulty ?? "medium",
    instruction: "Create a quiz question with 4 choices (A-D). Mark the correct answer.",
  }),
});

const evaluateAnswer = defineTool("evaluate_answer", {
  description: "Record whether the user's answer to the quiz was correct",
  parameters: {
    type: "object",
    properties: { correct: { type: "boolean", description: "Was the answer correct?" } },
    required: ["correct"],
  },
  handler: async (args: { correct: boolean }) => {
    score.total++;
    if (args.correct) score.correct++;
    return { score: `${score.correct}/${score.total}`, percentage: Math.round((score.correct / score.total) * 100) };
  },
});

const getHint = defineTool("get_hint", {
  description: "Provide a hint for the current quiz question without giving away the answer",
  parameters: {
    type: "object",
    properties: { topic: { type: "string", description: "Topic for context" } },
    required: ["topic"],
  },
  handler: async (args: { topic: string }) => ({
    instruction: `Give a helpful hint about ${args.topic} without revealing the answer directly.`,
  }),
});

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  onPermissionRequest: approveAll,
  tools: [generateQuestion, evaluateAnswer, getHint],
  systemMessage: {
    content: "You are Quiz Master, a fun and encouraging quiz host. Present questions clearly, celebrate correct answers, and provide educational explanations for wrong ones.",
  },
  onUserInputRequest: async (request) => {
    console.log();
    const answer = await rl.question(`🤖 ${request.question}\n   > `);
    return { answer: answer.trim(), wasFreeform: true };
  },
});

session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("session.idle", () => console.log("\n"));

process.on("SIGINT", async () => {
  console.log(`\n\n📊 Final score: ${score.correct}/${score.total}`);
  rl.close();
  await client.stop();
  process.exit(0);
});

console.log("🎯 Quiz Generator (L3+L4)\n");
process.stdout.write("Assistant: ");
await session.sendAndWait({
  prompt: "Start a quiz! Ask me 3 questions about JavaScript. Use the tools to generate questions and evaluate my answers.",
});

console.log(`📊 Score: ${score.correct}/${score.total}`);
rl.close();
await client.stop();
process.exit(0);
