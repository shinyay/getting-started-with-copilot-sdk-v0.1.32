/**
 * mcp-filtered.ts — MCP with tool filtering (security)
 *
 * Instead of tools: ["*"] (all tools), you can specify exactly which
 * MCP tools to enable. This is important for security — you don't want
 * the model to have write access when it only needs to read.
 *
 * Exercise covered: 4 (MCP tool filtering)
 *
 * Run: npx tsx mcp-filtered.ts
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

      // FILTERED: only read operations allowed
      // Compare with mcp-local.ts which uses ["*"]
      tools: ["read_file", "list_directory"],
      // Write operations (write_file, create_directory, etc.) are NOT available
    },
  },
});

session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("session.idle", () => console.log("\n"));

console.log("🔒 MCP with filtered tools: read_file, list_directory only\n");
console.log("The model can READ docs but NOT write or modify them.\n");

process.stdout.write("Assistant: ");
await session.sendAndWait({
  prompt: "Read the getting-started.md file and tell me what prerequisites are needed.",
});

await client.stop();
process.exit(0);
