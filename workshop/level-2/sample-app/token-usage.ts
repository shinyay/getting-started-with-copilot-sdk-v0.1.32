/**
 * token-usage.ts — Track token consumption across multiple prompts
 *
 * The "assistant.usage" event fires after each response with token counts.
 * This script sends 3 prompts and tracks both per-prompt and cumulative usage.
 *
 * Token types:
 * - inputTokens: tokens consumed by your prompt + conversation history
 * - outputTokens: tokens generated in the model's response
 *
 * Exercises covered: 8 (Monitor token usage), 11 (Build a live token counter)
 *
 * Run: npx tsx token-usage.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";

const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  onPermissionRequest: approveAll,
});

// Running totals
let totalInput = 0;
let totalOutput = 0;
let promptNumber = 0;

// Stream response text
session.on("assistant.message_delta", (event) => {
  process.stdout.write(event.data.deltaContent);
});

// Track usage after each response
session.on("assistant.usage", (event) => {
  promptNumber++;
  const input = event.data.inputTokens;
  const output = event.data.outputTokens;
  totalInput += input;
  totalOutput += output;

  console.log(); // newline after streaming
  console.log(`  📊 Prompt #${promptNumber}: ${input} input + ${output} output = ${input + output} tokens`);
  console.log(`  📈 Running total: ${totalInput} input + ${totalOutput} output = ${totalInput + totalOutput} tokens`);
});

const prompts = [
  "What is JavaScript? One sentence.",
  "What is TypeScript? One sentence.",
  "What is the difference between them? One sentence.",
];

for (const prompt of prompts) {
  console.log(`\n--- Prompt: "${prompt}" ---\n`);
  await session.sendAndWait({ prompt });
}

console.log("\n============================");
console.log(`Final total: ${totalInput + totalOutput} tokens (${totalInput} in + ${totalOutput} out)`);
console.log("============================");

await client.stop();
process.exit(0);
