/**
 * mcp-plus-custom.ts — MCP tools + custom defineTool tools together
 *
 * You can use MCP servers AND custom tools in the same session.
 * The model sees all tools from both sources and chooses the right one.
 *
 * Exercise covered: 10 (Combine MCP + custom tools)
 *
 * Run: npx tsx mcp-plus-custom.ts
 */

import { CopilotClient, defineTool, approveAll } from "@github/copilot-sdk";
import path from "node:path";

const docsPath = path.resolve("./sample-docs");

// Custom tool: summarize documentation with a specific format
const formatSummary = defineTool("format_summary", {
  description: "Format a documentation summary as a structured report with sections",
  parameters: {
    type: "object",
    properties: {
      title: { type: "string", description: "Document title" },
      sections: { type: "number", description: "Number of key sections found" },
      complexity: { type: "string", description: "Low, medium, or high complexity" },
    },
    required: ["title", "sections"],
  },
  handler: async (args: { title: string; sections: number; complexity?: string }) => {
    console.log(`  🔧 [format_summary] ${args.title}, ${args.sections} sections`);
    return {
      report: `📄 ${args.title}`,
      sections: args.sections,
      complexity: args.complexity ?? "medium",
      format: "structured-report",
      timestamp: new Date().toISOString(),
    };
  },
});

const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  onPermissionRequest: approveAll,

  // MCP server provides filesystem tools (read_file, list_directory)
  mcpServers: {
    filesystem: {
      type: "local",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", docsPath],
      tools: ["*"],
    },
  },

  // Custom tool provides formatting logic
  tools: [formatSummary],
});

session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("session.idle", () => console.log("\n"));

console.log("🔗 MCP (filesystem) + custom tool (format_summary) combined\n");

process.stdout.write("Assistant: ");
await session.sendAndWait({
  prompt: "Read the architecture.md file, then use the format_summary tool to create a structured summary report of what you found.",
});

await client.stop();
process.exit(0);
