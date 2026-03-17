/**
 * mcp-options.ts — MCP server configuration options
 *
 * Local MCP servers support additional options: env (environment variables),
 * cwd (working directory), and timeout (prevent hung servers).
 *
 * Exercise covered: 5 (MCP server options)
 *
 * Run: npx tsx mcp-options.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";
import path from "node:path";

const docsPath = path.resolve("./sample-docs");

const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  onPermissionRequest: approveAll,
  mcpServers: {
    filesystem: {
      type: "local",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", docsPath],
      tools: ["*"],

      // Additional options:
      timeout: 30000,           // 30 second timeout — prevents hung servers
      env: { NODE_ENV: "development" },  // Environment variables for the server
      cwd: ".",                 // Working directory for the server process
    },
  },
});

session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("session.idle", () => console.log("\n"));

console.log("⚙️  MCP server with options: timeout=30s, env, cwd\n");

process.stdout.write("Assistant: ");
await session.sendAndWait({
  prompt: "What API endpoints are documented? List them from the api-reference.",
});

await client.stop();
process.exit(0);
