/**
 * mcp-remote.ts — Configure a remote MCP server (HTTP/SSE)
 *
 * Remote MCP servers are already running — you connect to them via HTTP.
 * Unlike local servers (which the SDK spawns), remote servers handle their
 * own lifecycle. You just provide the URL and authentication.
 *
 * NOTE: This is a configuration example. Running it requires an actual
 * remote MCP server at the specified URL. The code demonstrates the
 * correct config shape.
 *
 * Exercise covered: 6 (Connect to a remote MCP server)
 *
 * Run: npx tsx mcp-remote.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";

// Example: connect to a remote GitHub MCP server
// In production, you'd use a real URL and token

const token = process.env.GITHUB_TOKEN ?? "your-token-here";

const client = new CopilotClient();

console.log("🌐 Remote MCP server configuration example\n");
console.log("Config shape for remote (HTTP/SSE) MCP servers:\n");

console.log(`mcpServers: {
  github: {
    type: "http",
    url: "https://api.githubcopilot.com/mcp/",
    headers: {
      "Authorization": "Bearer \${GITHUB_TOKEN}"
    },
    tools: ["*"],
  },
}`);

console.log("\nKey differences from local MCP:\n");
console.log("  Local:  type: 'local',  command + args  (SDK spawns subprocess)");
console.log("  Remote: type: 'http',   url + headers   (connect to running server)");

console.log("\n⚠️  This example does not connect to a real server.");
console.log("To test, you need an MCP server running at the specified URL.");
console.log("See: https://github.com/modelcontextprotocol/servers\n");

// If you have a real remote MCP server, uncomment this:
/*
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  onPermissionRequest: approveAll,
  mcpServers: {
    github: {
      type: "http",
      url: "https://api.githubcopilot.com/mcp/",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      tools: ["*"],
    },
  },
});

session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("session.idle", () => console.log("\n"));

await session.sendAndWait({ prompt: "List my recent GitHub repositories." });
await client.stop();
*/

process.exit(0);
