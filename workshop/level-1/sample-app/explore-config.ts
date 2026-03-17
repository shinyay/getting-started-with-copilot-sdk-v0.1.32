/**
 * explore-config.ts — Preview all session configuration options
 *
 * createSession() accepts many options beyond just `model`. This script
 * sends a simple prompt but documents ALL the configuration options you'll
 * learn in later levels. Think of it as a roadmap for the workshop.
 *
 * Exercise covered: 12 (Explore the SessionConfig object)
 *
 * Run: npx tsx explore-config.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";

const client = new CopilotClient();

// Here is every major option you can pass to createSession().
// Only `model` is used here — the rest are previews for later levels.
const session = await client.createSession({
  // === Level 1: Basics (this level!) ===
  model: "gpt-4.1", // Required. The LLM model to use.
  onPermissionRequest: approveAll, // Required. Handles tool permission prompts.

  // === Level 2: Streaming ===
  // streaming: true,        // Enable token-by-token streaming events

  // === Level 3: Tools ===
  // tools: [],              // Array of custom tool definitions (defineTool)

  // === Level 4: Interactive ===
  // systemMessage: {        // Customize the AI's personality
  //   content: "You are a helpful assistant.",
  //   mode: "append",       // "append" (default, keeps guardrails) or "replace"
  // },
  // onUserInputRequest: async (request) => {  // Let the agent ask YOU questions
  //   return { answer: "user input", wasFreeform: true };
  // },

  // === Level 5: Hooks ===
  // hooks: {
  //   onSessionStart: async (input) => null,
  //   onSessionEnd: async (input) => null,
  //   onPreToolUse: async (input) => ({ permissionDecision: "allow" }),
  //   onPostToolUse: async (input) => null,
  //   onUserPromptSubmitted: async (input) => null,
  //   onErrorOccurred: async (input) => null,
  // },

  // === Level 6: Context ===
  // mcpServers: {},         // MCP server configurations (local stdio or remote HTTP)
  // customAgents: [],       // Specialized AI personas with name + prompt
  // skillDirectories: [],   // Paths to reusable skill bundles
  // availableTools: [],     // Whitelist specific built-in tools
  // excludedTools: [],      // Blacklist specific built-in tools

  // === Level 7: Production ===
  // provider: {             // BYOK — use your own API key
  //   type: "openai",       // "openai" | "azure" | "anthropic"
  //   baseUrl: "https://api.openai.com/v1",
  //   apiKey: "sk-...",
  // },
  // sessionId: "my-session-id",  // For session persistence
  // infiniteSessions: {          // Auto-compact long conversations
  //   enabled: true,
  //   backgroundCompactionThreshold: 0.80,
  // },

  // === Level 8: Advanced ===
  // reasoningEffort: "high",     // Control reasoning depth (model-dependent)
});

console.log("Session created with model: gpt-4.1");
console.log("See the comments in this file for ALL available options!\n");

const response = await session.sendAndWait({
  prompt:
    "List 3 things you can help me build with the Copilot SDK. Be brief.",
});

console.log("Response:", response?.data.content);

await client.stop();
process.exit(0);
