/**
 * city-guide.ts — Capstone: Multi-tool travel assistant
 *
 * A complete travel guide assistant with 4 tools working together.
 * The model orchestrates multiple tool calls to build a comprehensive
 * city overview from separate data sources.
 *
 * Tools: get_weather, get_population, get_timezone, get_landmarks
 *
 * Exercise covered: 12 (Build a multi-tool travel assistant)
 *
 * Run: npx tsx city-guide.ts
 */

import { CopilotClient, defineTool, approveAll } from "@github/copilot-sdk";

// --- City data (simulating separate data sources) ---

const weatherData: Record<string, { temp: number; condition: string }> = {
  Paris: { temp: 15, condition: "Light rain, bring an umbrella" },
  Tokyo: { temp: 22, condition: "Partly cloudy, pleasant" },
  London: { temp: 12, condition: "Overcast, typical" },
  "New York": { temp: 18, condition: "Clear and sunny" },
  Sydney: { temp: 26, condition: "Warm and clear" },
};

const populationData: Record<string, { population: string; metro: string }> = {
  Paris: { population: "2.16 million", metro: "12.3 million" },
  Tokyo: { population: "13.96 million", metro: "37.4 million" },
  London: { population: "8.98 million", metro: "14.8 million" },
  "New York": { population: "8.34 million", metro: "20.1 million" },
  Sydney: { population: "5.31 million", metro: "5.31 million" },
};

const timezoneData: Record<string, string> = {
  Paris: "Europe/Paris", Tokyo: "Asia/Tokyo", London: "Europe/London",
  "New York": "America/New_York", Sydney: "Australia/Sydney",
};

const landmarkData: Record<string, string[]> = {
  Paris: ["Eiffel Tower", "Louvre Museum", "Notre-Dame Cathedral", "Arc de Triomphe"],
  Tokyo: ["Senso-ji Temple", "Tokyo Tower", "Meiji Shrine", "Shibuya Crossing"],
  London: ["Big Ben", "Tower of London", "British Museum", "Buckingham Palace"],
  "New York": ["Statue of Liberty", "Central Park", "Empire State Building", "Times Square"],
  Sydney: ["Sydney Opera House", "Harbour Bridge", "Bondi Beach", "Royal Botanic Garden"],
};

// --- Tool definitions ---

const getWeather = defineTool("get_weather", {
  description: "Get the current weather temperature and conditions for a city",
  parameters: {
    type: "object",
    properties: { city: { type: "string", description: "The city name" } },
    required: ["city"],
  },
  handler: async (args: { city: string }) => {
    const d = weatherData[args.city];
    if (!d) return { error: `No weather data for ${args.city}` };
    return { city: args.city, temperature: `${d.temp}°C`, condition: d.condition };
  },
});

const getPopulation = defineTool("get_population", {
  description: "Get the population of a city (city proper and metropolitan area)",
  parameters: {
    type: "object",
    properties: { city: { type: "string", description: "The city name" } },
    required: ["city"],
  },
  handler: async (args: { city: string }) => {
    const d = populationData[args.city];
    if (!d) return { error: `No population data for ${args.city}` };
    return { city: args.city, cityPopulation: d.population, metroPopulation: d.metro };
  },
});

const getTimezone = defineTool("get_timezone", {
  description: "Get the current local time and timezone for a city",
  parameters: {
    type: "object",
    properties: { city: { type: "string", description: "The city name" } },
    required: ["city"],
  },
  handler: async (args: { city: string }) => {
    const tz = timezoneData[args.city];
    if (!tz) return { error: `No timezone data for ${args.city}` };
    const time = new Date().toLocaleString("en-US", { timeZone: tz, dateStyle: "full", timeStyle: "short" });
    return { city: args.city, localTime: time, timezone: tz };
  },
});

const getLandmarks = defineTool("get_landmarks", {
  description: "Get the top tourist landmarks and attractions for a city",
  parameters: {
    type: "object",
    properties: { city: { type: "string", description: "The city name" } },
    required: ["city"],
  },
  handler: async (args: { city: string }) => {
    const landmarks = landmarkData[args.city];
    if (!landmarks) return { error: `No landmark data for ${args.city}` };
    return { city: args.city, topLandmarks: landmarks };
  },
});

// --- Main ---

const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  tools: [getWeather, getPopulation, getTimezone, getLandmarks],
  onPermissionRequest: approveAll,
});

session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("assistant.usage", (e) => {
  console.log(`\n  📊 Tokens: ${e.data.inputTokens} input + ${e.data.outputTokens} output`);
});
session.on("session.idle", () => console.log());

console.log("╔══════════════════════════════════════════════╗");
console.log("║   🌍 City Guide — AI Travel Assistant        ║");
console.log("║   4 tools: weather, population, time, sights ║");
console.log("╚══════════════════════════════════════════════╝\n");

await session.sendAndWait({
  prompt: "I'm planning a trip to Paris. Give me a complete overview: current weather, population, local time, and top landmarks to visit. Format it nicely.",
});

await client.stop();
process.exit(0);
