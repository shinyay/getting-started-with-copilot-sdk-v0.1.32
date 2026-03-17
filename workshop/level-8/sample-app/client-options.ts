/**
 * client-options.ts — Advanced CopilotClient constructor options
 *
 * Beyond logLevel and githubToken (Level 1), the client constructor
 * accepts additional options for deployment scenarios.
 *
 * Exercise covered: 4 (useLoggedInUser and advanced client options)
 *
 * Run: npx tsx client-options.ts
 */

console.log("🔧 Advanced CopilotClient Options\n");

console.log("=== All Constructor Options ===\n");
console.log(`  const client = new CopilotClient({
    // Logging (Level 1)
    logLevel: "debug",           // "debug" | "info" | "warn" | "error"

    // Authentication (Level 1, 7)
    githubToken: "gho_...",      // Explicit token (highest priority)
    useLoggedInUser: true,       // Use the logged-in GitHub user's identity

    // CLI Management (Level 7)
    cliPath: "/usr/local/bin/copilot",  // Custom path to CLI binary
    cliUrl: "http://localhost:3000",     // Connect to external CLI (--headless mode)
  });`);

console.log("\n=== Option Details ===\n");

console.log("  useLoggedInUser: boolean");
console.log("    When true, the SDK uses the currently logged-in GitHub user's");
console.log("    identity for all operations. Useful when the CLI is shared");
console.log("    across multiple users or in multi-tenant environments.\n");

console.log("  cliPath: string");
console.log("    Custom path to the Copilot CLI binary. Use when:");
console.log("    - CLI is installed in a non-standard location");
console.log("    - You have multiple CLI versions and want a specific one");
console.log("    - Docker/container deployments with known binary paths\n");

console.log("  cliUrl: string");
console.log("    Connect to an externally-running CLI (--headless mode).");
console.log("    See Level 7, Exercise 9 for details.\n");

console.log("=== Deployment Scenarios ===\n");
console.log("  ┌──────────────────────┬────────────────────────────────┐");
console.log("  │ Scenario             │ Options to Use                 │");
console.log("  ├──────────────────────┼────────────────────────────────┤");
console.log("  │ Local development    │ (defaults are fine)            │");
console.log("  │ CI/CD pipeline       │ githubToken from secrets       │");
console.log("  │ Docker container     │ cliPath + githubToken          │");
console.log("  │ Multi-tenant app     │ githubToken per user           │");
console.log("  │ Shared CLI server    │ cliUrl + useLoggedInUser       │");
console.log("  │ Debugging            │ logLevel: 'debug'              │");
console.log("  └──────────────────────┴────────────────────────────────┘");

process.exit(0);
