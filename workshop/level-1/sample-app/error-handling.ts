/**
 * error-handling.ts — Graceful error handling with the SDK
 *
 * Things go wrong: the CLI might not be installed, authentication might
 * expire, or you might pass an invalid model name. This script demonstrates
 * how to catch and handle common errors.
 *
 * Three scenarios:
 * 1. Normal operation (should succeed)
 * 2. Invalid model name (should fail gracefully)
 * 3. Error message formatting (showing how to extract useful info)
 *
 * Exercise covered: 11 (Handle errors gracefully)
 *
 * Run: npx tsx error-handling.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";

// Scenario 1: Normal operation — everything works
async function normalOperation() {
  console.log("=== Scenario 1: Normal operation ===");
  const client = new CopilotClient();
  try {
    const session = await client.createSession({ model: "gpt-4.1", onPermissionRequest: approveAll });
    const response = await session.sendAndWait({
      prompt: "Say hello in one word.",
    });
    console.log("✅ Success:", response?.data.content);
  } catch (error) {
    console.error("❌ Unexpected error:", (error as Error).message);
  } finally {
    await client.stop();
  }
}

// Scenario 2: Invalid model — the SDK should throw a meaningful error
async function invalidModel() {
  console.log("\n=== Scenario 2: Invalid model name ===");
  const client = new CopilotClient();
  try {
    const session = await client.createSession({
      model: "this-model-does-not-exist-12345",
      onPermissionRequest: approveAll,
    });
    const response = await session.sendAndWait({
      prompt: "Hello",
    });
    console.log("Response:", response?.data.content);
  } catch (error) {
    // This is expected to fail — the model name is invalid
    console.log("✅ Error caught (expected):", (error as Error).message);
  } finally {
    await client.stop();
  }
}

// Scenario 3: Error formatting — extract useful information from errors
async function errorFormatting() {
  console.log("\n=== Scenario 3: Error formatting ===");
  const client = new CopilotClient();
  try {
    // Force an error by using an invalid model
    await client.createSession({ model: "nonexistent-model", onPermissionRequest: approveAll });
  } catch (error) {
    const err = error as Error;
    console.log("Error name:", err.name);
    console.log("Error message:", err.message);
    if (err.stack) {
      // Show just the first 3 lines of the stack trace
      console.log(
        "Stack (first 3 lines):",
        err.stack.split("\n").slice(0, 3).join("\n"),
      );
    }
  } finally {
    await client.stop();
  }
}

// Run all scenarios sequentially
await normalOperation();
await invalidModel();
await errorFormatting();

console.log("\n=== All scenarios complete ===");
process.exit(0);
