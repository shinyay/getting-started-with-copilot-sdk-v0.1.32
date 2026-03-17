/**
 * parallel-sessions.ts — Run independent conversations simultaneously
 *
 * Multiple sessions from the same client run independently. They don't
 * share context, and you can use different models for each.
 *
 * Exercise covered: 8 (Multiple parallel sessions)
 *
 * Run: npx tsx parallel-sessions.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";

const client = new CopilotClient();

console.log("⚡ Parallel Sessions — Independent Conversations\n");

// Create two sessions with different models
const session1 = await client.createSession({ model: "gpt-4.1", onPermissionRequest: approveAll });
const session2 = await client.createSession({ model: "gpt-4.1-mini", onPermissionRequest: approveAll });

const prompt = "What is the most important principle in software engineering? One sentence.";

console.log(`Prompt: "${prompt}"\n`);
console.log("Sending to two models simultaneously...\n");

// Send to both in parallel using Promise.all
const start = Date.now();
const [response1, response2] = await Promise.all([
  session1.sendAndWait({ prompt }),
  session2.sendAndWait({ prompt }),
]);
const elapsed = Date.now() - start;

console.log("=== gpt-4.1 ===");
console.log(`  ${response1?.data.content}\n`);

console.log("=== gpt-4.1-mini ===");
console.log(`  ${response2?.data.content}\n`);

console.log(`Both completed in ${elapsed}ms (parallel, not sequential)`);
console.log("\nKey: sessions are INDEPENDENT — they don't share conversation history.");

await client.stop();
process.exit(0);
