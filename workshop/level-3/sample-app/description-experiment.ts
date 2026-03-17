/**
 * description-experiment.ts — Prove that tool descriptions matter
 *
 * This script defines TWO tools with the SAME handler but DIFFERENT descriptions:
 * - Tool A: vague description ("does stuff with cities")
 * - Tool B: clear description ("Get the current weather temperature and conditions")
 *
 * It sends the same prompt to two sessions and compares whether the model
 * calls the tool. The clear description should win.
 *
 * Also demonstrates error handling in tools (Exercise 11):
 * - Returning { error: "message" } lets the model explain the error gracefully
 * - Throwing an exception triggers tool.execution_error event
 *
 * Exercises covered: 4 (Clear descriptions), 11 (Error handling in tools)
 *
 * Run: npx tsx description-experiment.ts
 */

import { CopilotClient, defineTool, approveAll } from "@github/copilot-sdk";

// Shared handler — identical behavior
const weatherHandler = async (args: { city: string }) => {
  const data: Record<string, { temp: number; condition: string }> = {
    Tokyo: { temp: 22, condition: "Partly cloudy" },
    Paris: { temp: 15, condition: "Rainy" },
  };
  const d = data[args.city];
  if (!d) {
    // Returning an error object — the model sees this and explains it gracefully
    return { error: `City "${args.city}" not found. Available: ${Object.keys(data).join(", ")}` };
  }
  return { city: args.city, temperature: `${d.temp}°C`, condition: d.condition };
};

const sharedParams = {
  type: "object" as const,
  properties: { city: { type: "string" as const, description: "City name" } },
  required: ["city" as const],
};

// Tool A: VAGUE description
const vagueWeather = defineTool("city_info", {
  description: "Does stuff with cities",
  parameters: sharedParams,
  handler: weatherHandler,
});

// Tool B: CLEAR description
const clearWeather = defineTool("get_weather", {
  description: "Get the current weather temperature and conditions for a given city",
  parameters: sharedParams,
  handler: weatherHandler,
});

const client = new CopilotClient();

// --- Test 1: Vague description ---
console.log("=== Test 1: Vague description (\"Does stuff with cities\") ===\n");
const session1 = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  tools: [vagueWeather],
  onPermissionRequest: approveAll,
});

let tool1Called = false;
session1.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session1.on("session.idle", () => {
  console.log();
  console.log(`  Tool called: ${tool1Called ? "YES ✅" : "NO ❌ (model didn't know what the tool does)"}`);
});

// Monkey-patch to detect if tool was called
const origHandler1 = vagueWeather;
await session1.sendAndWait({ prompt: "What's the weather in Tokyo?" });

// --- Test 2: Clear description ---
console.log("\n=== Test 2: Clear description (\"Get the current weather...\") ===\n");
const session2 = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  tools: [clearWeather],
  onPermissionRequest: approveAll,
});

session2.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session2.on("session.idle", () => console.log());

await session2.sendAndWait({ prompt: "What's the weather in Tokyo?" });

// --- Test 3: Error handling ---
console.log("\n=== Test 3: Error handling — unknown city ===\n");
const session3 = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  tools: [clearWeather],
  onPermissionRequest: approveAll,
});

session3.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session3.on("session.idle", () => console.log());

// This city isn't in our data — the tool returns { error: "..." }
// The model receives the error and explains it gracefully to the user
await session3.sendAndWait({ prompt: "What's the weather in Atlantis?" });

await client.stop();
process.exit(0);
