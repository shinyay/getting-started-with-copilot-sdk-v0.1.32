/**
 * mcp-local.ts — Configure a local MCP server (filesystem)
 *
 * MCP (Model Context Protocol) lets you connect external tool providers.
 * A local MCP server runs as a subprocess (like the CLI itself), communicating
 * via stdio. The filesystem server gives the model access to read files.
 *
 * Exercises covered: 2 (Configure local MCP), 3 (Use MCP tools in session)
 *
 * Run: npx tsx mcp-local.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";
import path from "node:path";

const docsPath = path.resolve("./sample-docs");

const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  onPermissionRequest: approveAll,

  // Configure a local MCP server — the filesystem server
  mcpServers: {
    filesystem: {
      type: "local",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", docsPath],
      tools: ["*"],  // Enable ALL tools from this server
    },
  },
});

session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("session.idle", () => console.log("\n"));

console.log(`📂 MCP filesystem server connected to: ${docsPath}\n`);
console.log("Asking the model to explore the documentation...\n");

process.stdout.write("Assistant: ");
await session.sendAndWait({
  prompt: "List all files in the documentation directory and give me a brief summary of the architecture document.",
});

await client.stop();
process.exit(0);
