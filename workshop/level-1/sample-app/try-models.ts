/**
 * try-models.ts — Compare responses from different models
 *
 * The `model` parameter in createSession() determines which LLM processes
 * your prompt. Different models vary in speed, quality, and cost.
 *
 * This script sends the same prompt to two different models and compares
 * the results. Observe how response time and phrasing may differ.
 *
 * Exercise covered: 8 (Try different models)
 *
 * Run: npx tsx try-models.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";

const client = new CopilotClient();

const models = ["gpt-4.1", "gpt-4.1-mini"];

for (const model of models) {
  console.log(`\n--- Model: ${model} ---`);

  const start = Date.now();
  const session = await client.createSession({ model, onPermissionRequest: approveAll });

  const response = await session.sendAndWait({
    prompt: "Explain what an API is in exactly one sentence.",
  });

  const elapsed = Date.now() - start;

  console.log(`Response: ${response?.data.content}`);
  console.log(`Time: ${elapsed}ms`);
}

await client.stop();
process.exit(0);
