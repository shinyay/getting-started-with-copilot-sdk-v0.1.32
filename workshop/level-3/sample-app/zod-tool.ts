/**
 * zod-tool.ts — Define tools with Zod schemas (TypeScript-native)
 *
 * Instead of writing raw JSON Schema objects, you can use Zod — a TypeScript
 * schema library that gives you type inference, validation, and cleaner syntax.
 *
 * The SDK's defineTool() accepts Zod objects as the `parameters` field.
 *
 * Exercise covered: 3 (Use Zod for type-safe schemas)
 *
 * Run: npx tsx zod-tool.ts
 */

import { CopilotClient, defineTool, approveAll } from "@github/copilot-sdk";
import { z } from "zod";

// ===============================================
// Zod approach — TypeScript-native, type-safe
// ===============================================
const getWeather = defineTool("get_weather", {
  description: "Get the current weather temperature and conditions for a given city",

  // Zod schema instead of JSON Schema — cleaner and type-safe
  parameters: z.object({
    city: z.string().describe("The city name (e.g., 'Tokyo', 'Paris')"),
  }),

  // With Zod, args are automatically typed — no manual type annotation needed
  handler: async (args) => {
    // args.city is typed as string automatically!
    const weatherData: Record<string, { temp: number; condition: string }> = {
      Tokyo: { temp: 22, condition: "Partly cloudy" },
      Paris: { temp: 15, condition: "Rainy" },
      London: { temp: 12, condition: "Overcast" },
    };

    const data = weatherData[args.city];
    if (!data) {
      return { error: `Unknown city: ${args.city}` };
    }
    return { city: args.city, temperature: `${data.temp}°C`, condition: data.condition };
  },
});

/*
 * ===============================================
 * For comparison — the same tool with JSON Schema:
 * ===============================================
 *
 * const getWeather = defineTool("get_weather", {
 *   description: "Get the current weather...",
 *   parameters: {
 *     type: "object",
 *     properties: {
 *       city: { type: "string", description: "The city name" },
 *     },
 *     required: ["city"],
 *   },
 *   handler: async (args: { city: string }) => { ... },
 *                          ↑ Manual type annotation required
 * });
 *
 * Zod advantages:
 * - Automatic TypeScript type inference (no manual annotations)
 * - .describe() for parameter descriptions
 * - Built-in validation (z.string().email(), z.number().min(0), etc.)
 * - Single source of truth for types + schema
 */

const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  tools: [getWeather],
  onPermissionRequest: approveAll,
});

session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("session.idle", () => console.log());

console.log("🌤️  Asking about weather (using Zod-defined tool)...\n");
await session.sendAndWait({
  prompt: "What's the weather in Paris?",
});

await client.stop();
process.exit(0);
