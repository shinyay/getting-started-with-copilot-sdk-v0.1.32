/**
 * external-cli.ts — Connect to an externally-managed CLI process
 *
 * Instead of the SDK spawning the CLI, you can run it separately
 * and connect via HTTP. Useful for:
 * - Resource sharing (multiple SDK clients, one CLI)
 * - Debugging (inspect CLI logs independently)
 * - Container deployments (CLI as a sidecar)
 *
 * Exercise covered: 9 (External CLI mode)
 *
 * Run: npx tsx external-cli.ts
 */

console.log("🔌 External CLI Mode\n");

console.log("=== Step 1: Start the CLI externally ===\n");
console.log("  In a separate terminal, run:");
console.log("    copilot --headless --port 3000\n");

console.log("=== Step 2: Connect from your code ===\n");
console.log(`  import { CopilotClient, approveAll } from "@github/copilot-sdk";

  const client = new CopilotClient({
    cliUrl: "http://localhost:3000",  // ← Connect to external CLI
  });

  // Everything else works the same:
  const session = await client.createSession({ model: "gpt-4.1", onPermissionRequest: approveAll });
  await session.sendAndWait({ prompt: "Hello" });
  await client.stop();`);

console.log("\n=== When to Use External CLI Mode ===\n");
console.log("  Resource sharing:  Multiple SDK clients share one CLI process");
console.log("  Debugging:         Inspect CLI logs independently from your app");
console.log("  Containers:        CLI runs as a sidecar container");
console.log("  Load testing:      One CLI handles multiple concurrent connections");

console.log("\n=== Default Mode (comparison) ===\n");
console.log("  new CopilotClient()         → SDK spawns CLI as subprocess (automatic)");
console.log("  new CopilotClient({ cliUrl }) → SDK connects to existing CLI (manual)");

console.log("\nNote: This is a config reference exercise.");
console.log("To test, start 'copilot --headless --port 3000' in another terminal.");

process.exit(0);
