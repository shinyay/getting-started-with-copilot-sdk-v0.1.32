/**
 * optional-params.ts — Tools with optional parameters and defaults
 *
 * Not all tool parameters need to be required. This example defines
 * a weather tool with an optional "units" parameter that defaults to "celsius".
 *
 * Exercise covered: 9 (Tools with optional parameters)
 *
 * Run: npx tsx optional-params.ts
 */

import { CopilotClient, defineTool, approveAll } from "@github/copilot-sdk";

const getWeather = defineTool("get_weather", {
  description: "Get the current weather temperature for a city, in celsius or fahrenheit",
  parameters: {
    type: "object",
    properties: {
      city: {
        type: "string",
        description: "The city name",
      },
      units: {
        type: "string",
        enum: ["celsius", "fahrenheit"],
        description: "Temperature units (default: celsius)",
      },
    },
    required: ["city"], // Note: "units" is NOT required — it's optional
  },
  handler: async (args: { city: string; units?: string }) => {
    const data: Record<string, number> = {
      Tokyo: 22, Paris: 15, London: 12, "New York": 18,
    };

    const tempC = data[args.city];
    if (tempC === undefined) return { error: `Unknown city: ${args.city}` };

    // Handle the optional parameter with a default
    const units = args.units ?? "celsius";
    const temp = units === "fahrenheit" ? Math.round(tempC * 9 / 5 + 32) : tempC;

    return {
      city: args.city,
      temperature: temp,
      units,
      formatted: `${temp}°${units === "fahrenheit" ? "F" : "C"}`,
    };
  },
});

const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  tools: [getWeather],
  onPermissionRequest: approveAll,
});

session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("session.idle", () => console.log());

// The model may or may not pass "units" depending on the prompt
console.log("🌡️  Asking for weather in different units...\n");
await session.sendAndWait({
  prompt: "What's the weather in Tokyo in fahrenheit? And what about Paris in celsius?",
});

await client.stop();
process.exit(0);
