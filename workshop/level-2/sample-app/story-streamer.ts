/**
 * story-streamer.ts — The capstone demo: streaming story generator
 *
 * Combines all Level 2 patterns into a cohesive application:
 * - Streaming output (token-by-token)
 * - Multiple sequential prompts (story + continuation)
 * - Token usage tracking per prompt and cumulative
 * - Typing indicator while waiting
 *
 * Exercises covered: 10 (Multiple prompts), 12 (Capstone — streaming framework)
 *
 * Run: npx tsx story-streamer.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";

const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  onPermissionRequest: approveAll,
});

// --- State ---
let totalInput = 0;
let totalOutput = 0;
let promptCount = 0;
let firstDelta = false;

// --- Spinner ---
const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
let spinnerIndex = 0;
let spinner: ReturnType<typeof setInterval> | null = null;

function startSpinner() {
  firstDelta = false;
  spinnerIndex = 0;
  spinner = setInterval(() => {
    if (!firstDelta) {
      process.stdout.write(`\r  ${spinnerFrames[spinnerIndex++ % spinnerFrames.length]} thinking...`);
    }
  }, 80);
}

function stopSpinner() {
  if (spinner) {
    clearInterval(spinner);
    spinner = null;
  }
  process.stdout.write("\r                  \r");
}

// --- Events ---
session.on("assistant.message_delta", (event) => {
  if (!firstDelta) {
    firstDelta = true;
    stopSpinner();
  }
  process.stdout.write(event.data.deltaContent);
});

session.on("assistant.usage", (event) => {
  promptCount++;
  totalInput += event.data.inputTokens;
  totalOutput += event.data.outputTokens;
});

session.on("session.idle", () => {
  console.log();
  console.log(`  📊 [${totalInput + totalOutput} total tokens so far]\n`);
});

// --- Helper ---
async function ask(prompt: string, label: string) {
  console.log(`--- ${label} ---\n`);
  startSpinner();
  await session.sendAndWait({ prompt });
}

// --- Main story flow ---
console.log("╔══════════════════════════════════════════╗");
console.log("║   📖 Story Streamer                      ║");
console.log("║   Watch a story unfold in real time       ║");
console.log("╚══════════════════════════════════════════╝\n");

await ask(
  "Write the opening paragraph of a short mystery story set in a library. Make it atmospheric and intriguing. Keep it to 3-4 sentences.",
  "Part 1: The Opening",
);

await ask(
  "Continue the story with a surprising twist. What does the protagonist discover? Keep it to 3-4 sentences.",
  "Part 2: The Twist",
);

await ask(
  "Write a satisfying conclusion to the story in 2-3 sentences.",
  "Part 3: The Conclusion",
);

// --- Summary ---
console.log("============================");
console.log(`📊 Story complete!`);
console.log(`   ${promptCount} prompts sent`);
console.log(`   ${totalInput} input tokens + ${totalOutput} output tokens`);
console.log(`   ${totalInput + totalOutput} total tokens consumed`);
console.log("============================");

await client.stop();
process.exit(0);
