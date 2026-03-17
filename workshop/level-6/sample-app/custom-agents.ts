/**
 * custom-agents.ts — Define specialized AI personas
 *
 * Custom agents are AI personas with their own name, description, and
 * system prompt. They shape how the model responds without replacing
 * the SDK's built-in capabilities.
 *
 * Exercise covered: 7 (Define custom agents)
 *
 * Run: npx tsx custom-agents.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";

const client = new CopilotClient();

// Create a session with a custom agent persona
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  onPermissionRequest: approveAll,
  customAgents: [
    {
      name: "docs-writer",
      displayName: "Documentation Writer",
      description: "Expert at writing clear, structured technical documentation",
      prompt:
        "You are a senior technical writer with 15 years of experience. " +
        "You write clear, concise documentation that developers love. " +
        "Always use proper markdown formatting. Include code examples. " +
        "Structure content with clear headings and bullet points. " +
        "If something is unclear, point it out constructively.",
    },
  ],
});

session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("session.idle", () => console.log("\n"));

console.log("📝 Custom agent: Documentation Writer\n");
console.log("Watch how the persona shapes the response style:\n");

process.stdout.write("Assistant: ");
await session.sendAndWait({
  prompt: "Write a README section explaining how to configure environment variables for a Node.js project. Keep it concise.",
});

await client.stop();
process.exit(0);
