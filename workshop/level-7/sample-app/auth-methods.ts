/**
 * auth-methods.ts — Authentication priority chain
 *
 * The SDK checks for authentication in this order:
 *   1. Explicit githubToken in constructor
 *   2. COPILOT_GITHUB_TOKEN env var
 *   3. GH_TOKEN env var
 *   4. GITHUB_TOKEN env var
 *   5. Stored OAuth credentials (copilot auth login)
 *   6. GitHub CLI credentials (gh auth login)
 *
 * Exercise covered: 1 (Authentication deep dive)
 *
 * Run: npx tsx auth-methods.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";

console.log("🔐 Authentication Priority Chain\n");

// Show which env vars are currently set
const envVars = ["COPILOT_GITHUB_TOKEN", "GH_TOKEN", "GITHUB_TOKEN"];
console.log("Currently set environment variables:");
for (const v of envVars) {
  const val = process.env[v];
  console.log(`  ${v}: ${val ? `set (${val.slice(0, 8)}...)` : "not set"}`);
}
console.log();

// Method 1: Default — uses the priority chain automatically
console.log("=== Method 1: Default (auto-detect) ===");
console.log("  new CopilotClient()");
console.log("  → SDK checks env vars, then stored OAuth, then gh auth\n");

const client = new CopilotClient();
const session = await client.createSession({ model: "gpt-4.1", onPermissionRequest: approveAll });
const response = await session.sendAndWait({
  prompt: "Say 'Auth works!' and nothing else.",
});
console.log(`  Result: ${response?.data.content}\n`);

// Method 2: Explicit token (highest priority)
console.log("=== Method 2: Explicit token ===");
console.log('  new CopilotClient({ githubToken: "gho_..." })');
console.log("  → Overrides ALL other methods\n");

// Method 3: Environment variable
console.log("=== Method 3: Environment variable ===");
console.log("  export COPILOT_GITHUB_TOKEN=gho_...");
console.log("  → Second-highest priority\n");

console.log("=== Priority Order ===");
console.log("  1. Explicit githubToken         (constructor option)");
console.log("  2. COPILOT_GITHUB_TOKEN          (env var)");
console.log("  3. GH_TOKEN                      (env var)");
console.log("  4. GITHUB_TOKEN                  (env var)");
console.log("  5. Stored OAuth credentials      (copilot auth login)");
console.log("  6. GitHub CLI credentials        (gh auth login)");

await client.stop();
process.exit(0);
