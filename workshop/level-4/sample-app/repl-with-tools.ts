/**
 * repl-with-tools.ts — Interactive REPL with custom tools
 *
 * Combines the REPL pattern with custom tools. The tools respond to
 * dynamic user questions during conversation — showing how tools
 * work in an interactive context.
 *
 * Exercise covered: 3 (Integrate custom tools in the REPL)
 *
 * Run: npx tsx repl-with-tools.ts
 */

import { CopilotClient, defineTool, approveAll } from "@github/copilot-sdk";
import readline from "node:readline/promises";

const generateQuiz = defineTool("generate_quiz", {
  description: "Generate a quiz question on a given topic. Returns a question and 4 answer choices.",
  parameters: {
    type: "object",
    properties: {
      topic: { type: "string", description: "The quiz topic (e.g., 'JavaScript', 'history', 'science')" },
    },
    required: ["topic"],
  },
  handler: async (args: { topic: string }) => {
    // Hardcoded quiz for demo — in production, generate dynamically
    const quizzes: Record<string, { question: string; choices: string[]; answer: string }> = {
      javascript: {
        question: "Which keyword declares a block-scoped variable in JavaScript?",
        choices: ["A) var", "B) let", "C) const", "D) Both B and C"],
        answer: "D",
      },
      history: {
        question: "In which year did the Berlin Wall fall?",
        choices: ["A) 1987", "B) 1989", "C) 1991", "D) 1993"],
        answer: "B",
      },
      science: {
        question: "What is the chemical symbol for gold?",
        choices: ["A) Go", "B) Gd", "C) Au", "D) Ag"],
        answer: "C",
      },
    };
    const quiz = quizzes[args.topic.toLowerCase()];
    if (!quiz) return { error: `No quiz for "${args.topic}". Try: javascript, history, science` };
    return quiz;
  },
});

const checkAnswer = defineTool("check_answer", {
  description: "Check if a quiz answer is correct. Provide the topic and the user's answer letter.",
  parameters: {
    type: "object",
    properties: {
      topic: { type: "string", description: "The quiz topic" },
      answer: { type: "string", description: "The user's answer letter (A, B, C, or D)" },
    },
    required: ["topic", "answer"],
  },
  handler: async (args: { topic: string; answer: string }) => {
    const answers: Record<string, string> = {
      javascript: "D", history: "B", science: "C",
    };
    const correct = answers[args.topic.toLowerCase()];
    if (!correct) return { error: `Unknown topic: ${args.topic}` };
    const isCorrect = args.answer.toUpperCase() === correct;
    return { isCorrect, userAnswer: args.answer.toUpperCase(), correctAnswer: correct };
  },
});

const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  onPermissionRequest: approveAll,
  tools: [generateQuiz, checkAnswer],
});

session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("session.idle", () => console.log("\n"));

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log("🎓 Quiz REPL — ask for a quiz on any topic, then answer it!");
console.log("   Try: \"Quiz me on JavaScript\" or \"Give me a history question\"");
console.log("   Type 'exit' to quit\n");

while (true) {
  const input = await rl.question("You: ");
  const trimmed = input.trim();
  if (!trimmed) continue;
  if (trimmed.toLowerCase() === "exit") { console.log("Goodbye! 👋"); break; }

  process.stdout.write("Assistant: ");
  await session.sendAndWait({ prompt: trimmed });
}

rl.close();
await client.stop();
process.exit(0);
