/**
 * user-input-request.ts — Let the agent ask YOU questions
 *
 * The onUserInputRequest handler enables the model to ask the user
 * for clarification or input during a conversation. The SDK has a
 * built-in ask_user tool; onUserInputRequest is YOUR handler for it.
 *
 * Flow:
 * 1. Model decides it needs user input (e.g., "What subject?")
 * 2. SDK calls your onUserInputRequest handler
 * 3. Your handler reads from stdin and returns the answer
 * 4. Model receives the answer and continues
 *
 * Exercise covered: 7 (User input requests)
 *
 * Run: npx tsx user-input-request.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";
import readline from "node:readline/promises";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  onPermissionRequest: approveAll,

  // This handler fires when the model wants to ask the user a question
  onUserInputRequest: async (request) => {
    // request.question: the question the model wants to ask
    // request.choices: optional array of choices (like multiple choice)
    // request.allowFreeform: whether free text is accepted

    console.log(); // newline before agent's question
    let answer: string;

    if (request.choices && request.choices.length > 0) {
      // Multiple choice — show options
      console.log(`🤖 Agent asks: ${request.question}`);
      request.choices.forEach((choice: string, i: number) => {
        console.log(`   ${i + 1}. ${choice}`);
      });
      answer = await rl.question("Your choice: ");
    } else {
      // Freeform input
      answer = await rl.question(`🤖 Agent asks: ${request.question}\n   Your answer: `);
    }

    return { answer: answer.trim(), wasFreeform: true };
  },
});

session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("session.idle", () => console.log("\n"));

console.log("📝 The agent will ask YOU questions during this conversation.\n");
console.log("Sending: \"Give me a personalized study plan. Ask me what I need.\"\n");

process.stdout.write("Assistant: ");
await session.sendAndWait({
  prompt: "Give me a personalized study plan. First, ask me what subject I want to study and my current level. Use the ask_user tool to ask me.",
});

rl.close();
await client.stop();
process.exit(0);
