/**
 * async-tool.ts — Asynchronous tool handlers
 *
 * Tool handlers are async functions. The SDK awaits the Promise, so your
 * handler can do anything that returns a Promise: fetch APIs, read files,
 * query databases, or introduce deliberate delays.
 *
 * This example simulates a slow API call with a timeout to show that
 * the SDK patiently waits for async operations.
 *
 * Exercise covered: 10 (Async tool handlers)
 *
 * Run: npx tsx async-tool.ts
 */

import { CopilotClient, defineTool, approveAll } from "@github/copilot-sdk";

// Simulate a slow API call
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const getWeatherForecast = defineTool("get_weather_forecast", {
  description: "Get a 3-day weather forecast for a city (may take a moment to fetch)",
  parameters: {
    type: "object",
    properties: {
      city: { type: "string", description: "The city name" },
    },
    required: ["city"],
  },
  handler: async (args: { city: string }) => {
    console.log(`  ⏳ [Fetching forecast for ${args.city}... (simulated 1s delay)]`);

    // Simulate a network request that takes time
    await delay(1000);

    // In production, this would be: await fetch("https://api.weather.com/...")
    const forecasts: Record<string, string[]> = {
      Tokyo: ["☀️ Sunny 24°C", "⛅ Partly cloudy 22°C", "🌧️ Rain 18°C"],
      Paris: ["🌧️ Rain 14°C", "🌧️ Rain 13°C", "⛅ Clearing 16°C"],
    };

    const forecast = forecasts[args.city];
    if (!forecast) return { error: `No forecast data for ${args.city}` };

    console.log(`  ✅ [Forecast received for ${args.city}]`);
    return {
      city: args.city,
      forecast: { day1: forecast[0], day2: forecast[1], day3: forecast[2] },
    };
  },
});

const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  tools: [getWeatherForecast],
  onPermissionRequest: approveAll,
});

session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("session.idle", () => console.log());

console.log("📅 Asking for a weather forecast (async handler with delay)...\n");
await session.sendAndWait({
  prompt: "What's the 3-day weather forecast for Tokyo?",
});

await client.stop();
process.exit(0);
