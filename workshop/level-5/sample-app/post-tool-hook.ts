/**
 * post-tool-hook.ts — Transform and redact tool results
 *
 * The onPostToolUse hook fires AFTER every tool call, before the
 * result is sent back to the model. Use it to:
 * - Redact sensitive data (passwords, secrets, PII)
 * - Transform results for consistency
 * - Log results for auditing
 *
 * Exercise covered: 7 (onPostToolUse — transform results)
 *
 * Run: npx tsx post-tool-hook.ts
 */

import { CopilotClient, defineTool, approveAll } from "@github/copilot-sdk";

// A tool that returns data with sensitive information
const getConfig = defineTool("get_config", {
  description: "Get application configuration settings including database and API credentials",
  parameters: {
    type: "object",
    properties: {
      section: { type: "string", description: "Config section: 'database', 'api', or 'general'" },
    },
    required: ["section"],
  },
  handler: async (args: { section: string }) => {
    const configs: Record<string, Record<string, string>> = {
      database: {
        host: "db.example.com",
        port: "5432",
        username: "admin",
        password: "super_secret_password_123",
        database: "myapp_prod",
      },
      api: {
        baseUrl: "https://api.example.com",
        apiKey: "sk-secret-api-key-abc123",
        secretToken: "token_very_secret_789",
      },
      general: {
        appName: "MyApp",
        version: "2.1.0",
        environment: "production",
      },
    };
    return configs[args.section] ?? { error: `Unknown section: ${args.section}` };
  },
});

const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  tools: [getConfig],
  onPermissionRequest: approveAll,
  hooks: {
    onPostToolUse: async (input) => {
      console.log(`\n  📤 [onPostToolUse] Tool: "${input.toolName}"`);

      // Deep-clone the result for modification
      const result = JSON.parse(JSON.stringify(input.toolResult));

      // Redact any field containing sensitive keywords
      const sensitiveKeys = ["password", "secret", "apikey", "token"];
      let redactionCount = 0;

      function redactObject(obj: Record<string, unknown>) {
        for (const [key, value] of Object.entries(obj)) {
          if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
            obj[key] = "[REDACTED]";
            redactionCount++;
          } else if (typeof value === "string" && sensitiveKeys.some((sk) => value.toLowerCase().includes(sk))) {
            obj[key] = "[REDACTED]";
            redactionCount++;
          } else if (typeof value === "object" && value !== null) {
            redactObject(value as Record<string, unknown>);
          }
        }
      }

      if (typeof result === "object" && result !== null) {
        redactObject(result as Record<string, unknown>);
      }

      console.log(`      Redacted ${redactionCount} sensitive field(s)`);
      console.log(`      Modified result: ${JSON.stringify(result)}`);

      return redactionCount > 0 ? { modifiedResult: result } : null;
    },
  },
});

session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("session.idle", () => console.log("\n"));

console.log("🔒 Hook demo: automatic PII/secret redaction\n");
process.stdout.write("Assistant: ");
await session.sendAndWait({
  prompt: "Show me the database and API configuration settings.",
});

await client.stop();
process.exit(0);
