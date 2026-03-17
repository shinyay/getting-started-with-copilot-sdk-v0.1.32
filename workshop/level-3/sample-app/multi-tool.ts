/**
 * multi-tool.ts — Define multiple tools and watch the model choose
 *
 * When you pass multiple tools, the model reads ALL descriptions and
 * decides which tool(s) to call based on the user's question.
 *
 * This script defines 3 tools (weather, population, timezone) and
 * sends a prompt that requires all 3. Watch the model orchestrate
 * multiple tool calls in sequence.
 *
 * Exercises covered: 7 (Tool invocation loop), 8 (Multiple tools)
 *
 * Run: npx tsx multi-tool.ts
 */

import { CopilotClient, defineTool, approveAll } from "@github/copilot-sdk";

// --- Tool 1: Weather ---
const getWeather = defineTool("get_weather", {
  description: "Get the current weather temperature and conditions for a given city",
  parameters: {
    type: "object",
    properties: { city: { type: "string", description: "The city name" } },
    required: ["city"],
  },
  handler: async (args: { city: string }) => {
    console.log(`  🔧 [get_weather called with: ${args.city}]`);
    const data: Record<string, { temp: number; condition: string }> = {
      Tokyo: { temp: 22, condition: "Partly cloudy" },
      Paris: { temp: 15, condition: "Rainy" },
      London: { temp: 12, condition: "Overcast" },
    };
    const d = data[args.city];
    if (!d) return { error: `Unknown city: ${args.city}` };
    return { city: args.city, temperature: `${d.temp}°C`, condition: d.condition };
  },
});

// --- Tool 2: Population ---
const getPopulation = defineTool("get_population", {
  description: "Get the current population of a city",
  parameters: {
    type: "object",
    properties: { city: { type: "string", description: "The city name" } },
    required: ["city"],
  },
  handler: async (args: { city: string }) => {
    console.log(`  🔧 [get_population called with: ${args.city}]`);
    const populations: Record<string, string> = {
      Tokyo: "13.96 million",
      Paris: "2.16 million",
      London: "8.98 million",
    };
    const pop = populations[args.city];
    if (!pop) return { error: `Unknown city: ${args.city}` };
    return { city: args.city, population: pop };
  },
});

// --- Tool 3: Timezone ---
const getTimezone = defineTool("get_timezone", {
  description: "Get the current local time and timezone for a city",
  parameters: {
    type: "object",
    properties: { city: { type: "string", description: "The city name" } },
    required: ["city"],
  },
  handler: async (args: { city: string }) => {
    console.log(`  🔧 [get_timezone called with: ${args.city}]`);
    const timezones: Record<string, string> = {
      Tokyo: "Asia/Tokyo",
      Paris: "Europe/Paris",
      London: "Europe/London",
    };
    const tz = timezones[args.city];
    if (!tz) return { error: `Unknown city: ${args.city}` };
    const time = new Date().toLocaleString("en-US", { timeZone: tz, timeStyle: "short" });
    return { city: args.city, localTime: time, timezone: tz };
  },
});

const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  tools: [getWeather, getPopulation, getTimezone], // All 3 tools
  onPermissionRequest: approveAll,
});

session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("session.idle", () => console.log());

console.log("🌍 Asking about Tokyo (weather + population + timezone)...\n");
console.log("Watch for 🔧 markers — they show when tools are called:\n");

await session.sendAndWait({
  prompt: "Tell me about Tokyo — what's the weather, population, and current local time?",
});

await client.stop();
process.exit(0);
