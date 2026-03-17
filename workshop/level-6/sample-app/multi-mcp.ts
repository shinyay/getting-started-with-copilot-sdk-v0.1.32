/**
 * multi-mcp.ts — Connect multiple MCP servers simultaneously
 *
 * You can connect multiple MCP servers in one session. Each server
 * provides its own set of tools, and the model can use tools from
 * any of them. Tools are namespaced by server name.
 *
 * Exercise covered: 11 (Multiple MCP servers)
 *
 * Run: npx tsx multi-mcp.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";
import path from "node:path";

const docsPath = path.resolve("./sample-docs");
const skillsPath = path.resolve("./skills");

const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  onPermissionRequest: approveAll,

  // Multiple MCP servers — each with its own tools
  mcpServers: {
    // Server 1: Access to documentation files
    docs: {
      type: "local",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", docsPath],
      tools: ["read_file", "list_directory"],  // Read-only access to docs
    },

    // Server 2: Access to skills directory
    skills: {
      type: "local",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", skillsPath],
      tools: ["read_file", "list_directory"],  // Read-only access to skills
    },
  },
});

session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("session.idle", () => console.log("\n"));

console.log("📂📂 Two MCP servers connected simultaneously:");
console.log(`   docs:   ${docsPath} (documentation files)`);
console.log(`   skills: ${skillsPath} (skill definitions)\n`);

process.stdout.write("Assistant: ");
await session.sendAndWait({
  prompt: "List the files available in both directories (documentation and skills). What content is available from each source?",
});

await client.stop();
process.exit(0);
