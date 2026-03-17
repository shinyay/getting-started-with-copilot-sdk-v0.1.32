/**
 * docs-explorer.ts — Capstone: Full documentation assistant
 *
 * Combines all Level 6 features into a production-quality documentation
 * explorer:
 * - MCP filesystem server for reading docs
 * - Custom agent persona (technical writer)
 * - Skill directory for review guidelines
 * - Custom tool for formatting
 * - Hooks from Level 5 (audit logging)
 * - Streaming + usage tracking
 *
 * Exercise covered: 12 (Capstone: context-rich documentation assistant)
 *
 * Run: npx tsx docs-explorer.ts
 */

import { CopilotClient, defineTool, approveAll } from "@github/copilot-sdk";
import readline from "node:readline/promises";
import path from "node:path";

const docsPath = path.resolve("./sample-docs");
const skillsPath = path.resolve("./skills/docs-review");

// --- Custom tool ---
const generateToc = defineTool("generate_toc", {
  description: "Generate a table of contents from a list of document titles and descriptions",
  parameters: {
    type: "object",
    properties: {
      documents: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
          },
        },
        description: "Array of document objects with title and description",
      },
    },
    required: ["documents"],
  },
  handler: async (args: { documents: Array<{ title: string; description: string }> }) => {
    const toc = args.documents
      .map((doc, i) => `${i + 1}. **${doc.title}** — ${doc.description}`)
      .join("\n");
    return { tableOfContents: toc, totalDocuments: args.documents.length };
  },
});

// --- Audit state ---
const toolCalls: string[] = [];
let totalTokens = 0;

// --- Client + Session ---
const client = new CopilotClient();
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  onPermissionRequest: approveAll,

  // MCP: filesystem access to docs
  mcpServers: {
    filesystem: {
      type: "local",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", docsPath],
      tools: ["read_file", "list_directory"],
    },
  },

  // Custom tool
  tools: [generateToc],

  // Custom agent persona
  customAgents: [
    {
      name: "docs-navigator",
      displayName: "Documentation Navigator",
      description: "Expert at exploring and explaining project documentation",
      prompt:
        "You are a Documentation Navigator — an expert at reading, summarizing, and explaining technical docs. " +
        "When asked about docs, use the filesystem tools to read them. Be thorough but concise. " +
        "Use proper markdown formatting in your responses.",
    },
  ],

  // Skills
  skillDirectories: [skillsPath],

  // Hooks: audit trail
  hooks: {
    onPreToolUse: async (input) => {
      toolCalls.push(input.toolName);
      return { permissionDecision: "allow" };
    },
    onSessionEnd: async () => {
      console.log(`\n📋 Session summary: ${toolCalls.length} tool calls, ${totalTokens} tokens`);
      return null;
    },
  },
});

// --- Events ---
session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("assistant.usage", (e) => {
  totalTokens += e.data.inputTokens + e.data.outputTokens;
});
session.on("session.idle", () => console.log("\n"));

// --- Signal handling ---
process.on("SIGINT", async () => {
  console.log(`\n\n📋 Tools used: ${toolCalls.join(", ") || "none"}`);
  console.log(`📊 Total tokens: ${totalTokens}`);
  rl.close();
  await client.stop();
  process.exit(0);
});

// --- Main ---
console.log("╔══════════════════════════════════════════════╗");
console.log("║   📚 Docs Explorer — Documentation Assistant  ║");
console.log("║                                              ║");
console.log("║   Features:                                   ║");
console.log("║   📂 MCP filesystem (read docs)              ║");
console.log("║   📝 Custom agent (docs navigator)           ║");
console.log("║   📦 Skill directory (review guidelines)     ║");
console.log("║   🔧 Custom tool (generate_toc)              ║");
console.log("║   📋 Audit hooks (tool call tracking)        ║");
console.log("║                                              ║");
console.log("║   Type 'exit' to quit                        ║");
console.log("╚══════════════════════════════════════════════╝\n");

while (true) {
  const input = await rl.question("You: ");
  const trimmed = input.trim();
  if (!trimmed) continue;
  if (trimmed.toLowerCase() === "exit") break;

  process.stdout.write("\nAssistant: ");
  await session.sendAndWait({ prompt: trimmed });
}

console.log(`\n📋 Tools used: ${toolCalls.join(", ") || "none"}`);
console.log(`📊 Total tokens: ${totalTokens}`);
rl.close();
await client.stop();
process.exit(0);
