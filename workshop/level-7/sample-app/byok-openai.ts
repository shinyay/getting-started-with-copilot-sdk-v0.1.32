/**
 * byok-openai.ts — Bring Your Own Key with OpenAI
 *
 * Use your own OpenAI API key instead of a GitHub Copilot subscription.
 * Requires OPENAI_API_KEY environment variable.
 *
 * Exercise covered: 2 (BYOK with OpenAI)
 *
 * Run: OPENAI_API_KEY=sk-... npx tsx byok-openai.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.log("⚠️  OPENAI_API_KEY not set.\n");
  console.log("To run this exercise, set your OpenAI API key:");
  console.log("  export OPENAI_API_KEY=sk-your-key-here");
  console.log("  npx tsx byok-openai.ts\n");
  console.log("The BYOK configuration looks like:\n");
  console.log(`  const session = await client.createSession({
    model: "gpt-4",
    onPermissionRequest: approveAll,
    provider: {
      type: "openai",
      baseUrl: "https://api.openai.com/v1",
      apiKey: process.env.OPENAI_API_KEY,
    },
  });`);
  console.log("\nKey points:");
  console.log("  - model is REQUIRED with BYOK (SDK throws without it)");
  console.log("  - type: 'openai' for OpenAI's API");
  console.log("  - baseUrl: always 'https://api.openai.com/v1'");
  console.log("  - apiKey: your sk-... key from OpenAI dashboard");
  process.exit(0);
}

console.log("🔑 BYOK with OpenAI\n");

const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4",
  streaming: true,
  onPermissionRequest: approveAll,
  provider: {
    type: "openai",
    baseUrl: "https://api.openai.com/v1",
    apiKey,
  },
});

session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("session.idle", () => console.log("\n"));

process.stdout.write("Assistant: ");
await session.sendAndWait({
  prompt: "Say 'Hello from OpenAI BYOK!' and tell me which model you are.",
});

await client.stop();
process.exit(0);
