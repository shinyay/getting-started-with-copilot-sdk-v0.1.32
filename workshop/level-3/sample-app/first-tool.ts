/**
 * first-tool.ts — Your first custom tool definition
 *
 * Define a tool the model can call. The SDK's killer feature:
 * 1. You define a tool with name, description, parameters, and handler
 * 2. The model reads the description and decides WHEN to call it
 * 3. When called, the SDK runs your handler and sends the result back
 * 4. The model incorporates the result into its response
 *
 * This example uses JSON Schema for parameters (the standard way).
 * Exercise 3 shows the Zod alternative.
 *
 * Exercises covered: 1 (First tool), 2 (JSON Schema parameters)
 *
 * Run: npx tsx first-tool.ts
 */

import { CopilotClient, defineTool, approveAll } from "@github/copilot-sdk";

// Define a weather tool using JSON Schema parameters
const getWeather = defineTool("get_weather", {
  // description: the model reads this to decide WHEN to call the tool
  description: "Get the current weather temperature and conditions for a given city",

  // parameters: JSON Schema defining what arguments the tool accepts
  parameters: {
    type: "object",
    properties: {
      city: {
        type: "string",
        description: "The city name (e.g., 'Tokyo', 'Paris', 'New York')",
      },
    },
    required: ["city"],
  },

  // handler: your function that runs when the model calls this tool
  handler: async (args: { city: string }) => {
    // Hardcoded data for demo — in production you'd call a weather API
    const weatherData: Record<string, { temp: number; condition: string }> = {
      Tokyo: { temp: 22, condition: "Partly cloudy" },
      Paris: { temp: 15, condition: "Rainy" },
      London: { temp: 12, condition: "Overcast" },
      "New York": { temp: 18, condition: "Sunny" },
      Sydney: { temp: 26, condition: "Clear skies" },
    };

    const data = weatherData[args.city];
    if (!data) {
      return { error: `Unknown city: ${args.city}. Available: ${Object.keys(weatherData).join(", ")}` };
    }

    return { city: args.city, temperature: `${data.temp}°C`, condition: data.condition };
  },
});

const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  tools: [getWeather], // Pass tools in an array
  onPermissionRequest: approveAll,
});

session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("session.idle", () => console.log());

console.log("🌤️  Asking about the weather...\n");
await session.sendAndWait({
  prompt: "What's the weather like in Tokyo right now?",
});

await client.stop();
process.exit(0);
