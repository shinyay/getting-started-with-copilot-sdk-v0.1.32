/**
 * byok-ollama.ts — BYOK with local Ollama (zero-cost, fully offline)
 *
 * Ollama runs LLMs locally on your machine. The SDK connects to it
 * using the OpenAI-compatible API at localhost:11434.
 *
 * Setup: brew install ollama && ollama pull llama3
 * No API key needed — it's your own hardware.
 *
 * Exercise covered: 3 (BYOK with Ollama)
 *
 * Run: npx tsx byok-ollama.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";

console.log("🏠 BYOK with Ollama (local LLM)\n");
console.log("Prerequisites:");
console.log("  1. Install Ollama: brew install ollama (or https://ollama.com)");
console.log("  2. Pull a model: ollama pull llama3");
console.log("  3. Ollama runs automatically on http://localhost:11434\n");

// Check if Ollama is reachable
try {
  const res = await fetch("http://localhost:11434/api/tags");
  if (res.ok) {
    const data = (await res.json()) as { models?: Array<{ name: string }> };
    const models = data.models?.map((m: { name: string }) => m.name) ?? [];
    console.log(`✅ Ollama is running. Available models: ${models.join(", ") || "none"}\n`);
  }
} catch {
  console.log("❌ Ollama is not running at localhost:11434.");
  console.log("   Start it with: ollama serve");
  console.log("   Then pull a model: ollama pull llama3\n");
  console.log("The BYOK configuration for Ollama:\n");
  console.log(`  provider: {
    type: "openai",                          // Ollama uses OpenAI-compatible API
    baseUrl: "http://localhost:11434/v1",     // Ollama's local endpoint
    // No apiKey needed — it's your own machine
  }`);
  process.exit(0);
}

const client = new CopilotClient();
const session = await client.createSession({
  model: "llama3",
  streaming: true,
  onPermissionRequest: approveAll,
  provider: {
    type: "openai",                        // Ollama speaks OpenAI protocol
    baseUrl: "http://localhost:11434/v1",   // Local Ollama endpoint
    // No apiKey — running on your own hardware
  },
});

session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("session.idle", () => console.log("\n"));

console.log("Sending prompt to local Ollama...\n");
process.stdout.write("Assistant: ");
await session.sendAndWait({
  prompt: "Say 'Hello from Ollama!' and tell me which model you are. Keep it brief.",
});

await client.stop();
process.exit(0);
