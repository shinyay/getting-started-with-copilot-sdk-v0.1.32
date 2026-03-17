/**
 * project-weather.ts — Project: Weather assistant (L2+L3+L7)
 *
 * A self-contained weather assistant combining:
 *   Level 2: Streaming responses
 *   Level 3: 3 custom tools (weather, forecast, alerts)
 *   Level 7: Error recovery hooks
 *
 * Exercise covered: 5 (Project: Weather assistant)
 *
 * Run: npx tsx project-weather.ts
 */

import { CopilotClient, defineTool, approveAll } from "@github/copilot-sdk";

// --- Tools ---
const getWeather = defineTool("get_weather", {
  description: "Get current weather conditions for a city",
  parameters: {
    type: "object",
    properties: { city: { type: "string", description: "City name" } },
    required: ["city"],
  },
  handler: async (args: { city: string }) => {
    const data: Record<string, { temp: number; condition: string; humidity: number }> = {
      Tokyo: { temp: 22, condition: "Partly cloudy", humidity: 65 },
      London: { temp: 12, condition: "Rainy", humidity: 85 },
      "New York": { temp: 18, condition: "Clear", humidity: 45 },
    };
    return data[args.city] ?? { error: `No data for ${args.city}` };
  },
});

const getForecast = defineTool("get_forecast", {
  description: "Get a 3-day weather forecast for a city",
  parameters: {
    type: "object",
    properties: { city: { type: "string", description: "City name" } },
    required: ["city"],
  },
  handler: async (args: { city: string }) => {
    const forecasts: Record<string, string[]> = {
      Tokyo: ["☀️ 24°C", "⛅ 22°C", "🌧️ 18°C"],
      London: ["🌧️ 11°C", "🌧️ 10°C", "⛅ 13°C"],
      "New York": ["☀️ 20°C", "☀️ 22°C", "⛅ 19°C"],
    };
    const f = forecasts[args.city];
    return f ? { city: args.city, day1: f[0], day2: f[1], day3: f[2] } : { error: `No forecast for ${args.city}` };
  },
});

const getAlerts = defineTool("get_weather_alerts", {
  description: "Get active weather alerts and warnings for a city",
  parameters: {
    type: "object",
    properties: { city: { type: "string", description: "City name" } },
    required: ["city"],
  },
  handler: async (args: { city: string }) => {
    const alerts: Record<string, string[]> = {
      Tokyo: [],
      London: ["⚠️ Heavy rain warning until 6 PM"],
      "New York": [],
    };
    const a = alerts[args.city];
    return { city: args.city, alerts: a ?? [], hasAlerts: (a?.length ?? 0) > 0 };
  },
});

// --- Client ---
const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  onPermissionRequest: approveAll,
  tools: [getWeather, getForecast, getAlerts],
  hooks: {
    onErrorOccurred: async (input) => {
      if (input.recoverable) return { errorHandling: "retry", retryCount: 2 };
      return { errorHandling: "skip", userNotification: "Weather service temporarily unavailable." };
    },
  },
});

session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("assistant.usage", (e) => {
  console.log(`\n  📊 ${e.data.inputTokens + e.data.outputTokens} tokens`);
});
session.on("session.idle", () => console.log());

console.log("🌤️  Weather Assistant (L2+L3+L7)\n");
process.stdout.write("Assistant: ");
await session.sendAndWait({
  prompt: "Give me a complete weather report for London: current conditions, 3-day forecast, and any active alerts.",
});

await client.stop();
process.exit(0);
