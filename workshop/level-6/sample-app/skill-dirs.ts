/**
 * skill-dirs.ts — Load reusable skill directories
 *
 * Skills are directories containing prompts, tools, and configuration
 * that can be loaded into a session. They're reusable across projects.
 *
 * Structure:
 *   skills/docs-review/
 *   ├── skill.json          # Name, description, file references
 *   ├── prompts/
 *   │   └── system.md       # System prompt additions
 *   └── tools/
 *       └── (tool definitions)
 *
 * Exercise covered: 8 (Skill directories)
 *
 * Run: npx tsx skill-dirs.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";
import path from "node:path";
import { readFileSync } from "node:fs";

// Show the skill directory contents
const skillPath = path.resolve("./skills/docs-review");
console.log("📦 Skill directory: ./skills/docs-review/\n");

try {
  const skillJson = JSON.parse(readFileSync(path.join(skillPath, "skill.json"), "utf8"));
  console.log(`  skill.json: ${JSON.stringify(skillJson, null, 2)}`);
} catch {
  console.log("  (skill.json not readable — continuing with config)");
}

try {
  const systemPrompt = readFileSync(path.join(skillPath, "prompts/system.md"), "utf8");
  console.log(`\n  prompts/system.md:\n    ${systemPrompt.split("\n").join("\n    ")}`);
} catch {
  console.log("  (system.md not readable — continuing with config)");
}

console.log("\n---\n");

const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  onPermissionRequest: approveAll,

  // Load skill directories
  skillDirectories: [skillPath],

  // You can selectively disable skills:
  // disabledSkills: ["docs-review"],
});

session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("session.idle", () => console.log("\n"));

console.log("Using docs-review skill for this conversation:\n");

process.stdout.write("Assistant: ");
await session.sendAndWait({
  prompt: "Review this API endpoint documentation for completeness: 'POST /api/users - Creates a new user. Requires email field.'",
});

await client.stop();
process.exit(0);
