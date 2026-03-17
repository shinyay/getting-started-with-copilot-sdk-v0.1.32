/**
 * project-docs.ts — Project: Documentation assistant (L6+L7)
 *
 * A self-contained documentation assistant combining:
 *   Level 6: MCP filesystem + custom agent + skill directory
 *   Level 7: Session persistence + structured logging
 *
 * Exercise covered: 8 (Project: Documentation assistant)
 *
 * Run: npx tsx project-docs.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";
import path from "node:path";

const docsPath = path.resolve("../../level-6/sample-app/sample-docs");
const skillsPath = path.resolve("../../level-6/sample-app/skills/docs-review");
const date = new Date().toISOString().split("T")[0];

const client = new CopilotClient();
const session = await client.createSession({
  sessionId: `docs-assistant-${date}`,
  model: "gpt-4.1",
  streaming: true,
  onPermissionRequest: approveAll,

  // L6: MCP filesystem
  mcpServers: {
    docs: {
      type: "local",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", docsPath],
      tools: ["read_file", "list_directory"],
      timeout: 15000,
    },
  },

  // L6: Custom agent
  customAgents: [{
    name: "docs-helper",
    displayName: "Documentation Helper",
    description: "Expert at navigating and explaining project documentation",
    prompt: "You are a documentation expert. Read files carefully, provide accurate summaries, and suggest improvements when asked.",
  }],

  // L6: Skill directory
  skillDirectories: [skillsPath],
});

let totalTokens = 0;
session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("assistant.usage", (e) => {
  totalTokens += e.data.inputTokens + e.data.outputTokens;
});
session.on("session.idle", () => console.log("\n"));

console.log("📚 Documentation Assistant (L6+L7)\n");
console.log(`Session: docs-assistant-${date} (persistent)\n`);

process.stdout.write("Assistant: ");
await session.sendAndWait({
  prompt: "List all available documentation files and give me a one-line summary of each. Then suggest which one a new developer should read first.",
});

console.log(`📊 Tokens: ${totalTokens} | Session persisted as: docs-assistant-${date}`);

await client.stop();
process.exit(0);
