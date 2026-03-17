/**
 * test-tools.ts — Testing patterns for SDK applications
 *
 * Tool handlers and hooks are pure functions — they can be tested
 * directly without running the full SDK. Extract them, call them
 * with mock inputs, and assert the outputs.
 *
 * Exercise covered: 10 (Testing SDK applications)
 *
 * Run: npx tsx test-tools.ts
 */

import assert from "node:assert/strict";

console.log("🧪 Testing SDK Applications\n");

// ====================================================
// Pattern 1: Extract tool handlers as pure functions
// ====================================================

console.log("=== Pattern 1: Test tool handlers ===\n");

// Instead of defining the handler inline in defineTool,
// extract it as a separate function:

async function weatherHandler(args: { city: string; units?: string }) {
  const data: Record<string, number> = { Tokyo: 22, London: 12, Paris: 15 };
  const tempC = data[args.city];
  if (tempC === undefined) return { error: `Unknown city: ${args.city}` };
  const units = args.units ?? "celsius";
  const temp = units === "fahrenheit" ? Math.round(tempC * 9 / 5 + 32) : tempC;
  return { city: args.city, temperature: temp, units };
}

// Now test it directly — no SDK needed!
const result1 = await weatherHandler({ city: "Tokyo" });
assert.deepEqual(result1, { city: "Tokyo", temperature: 22, units: "celsius" });
console.log("  ✅ Tokyo celsius: 22°C");

const result2 = await weatherHandler({ city: "Tokyo", units: "fahrenheit" });
assert.equal(result2.temperature, 72);
console.log("  ✅ Tokyo fahrenheit: 72°F");

const result3 = await weatherHandler({ city: "Atlantis" });
assert.ok("error" in result3);
console.log("  ✅ Unknown city returns error object");

// ====================================================
// Pattern 2: Test hooks with mock inputs
// ====================================================

console.log("\n=== Pattern 2: Test hooks ===\n");

// Extract hook logic as a function:
async function preToolUseHook(input: { toolName: string; toolArgs: unknown }) {
  const blocked = ["shell", "bash", "editFile"];
  if (blocked.includes(input.toolName)) {
    return { permissionDecision: "deny" as const, permissionDecisionReason: "Blocked" };
  }
  return { permissionDecision: "allow" as const };
}

// Test with mock inputs:
const allow = await preToolUseHook({ toolName: "read_file", toolArgs: {} });
assert.equal(allow.permissionDecision, "allow");
console.log("  ✅ read_file is allowed");

const deny = await preToolUseHook({ toolName: "shell", toolArgs: {} });
assert.equal(deny.permissionDecision, "deny");
console.log("  ✅ shell is denied");

const deny2 = await preToolUseHook({ toolName: "bash", toolArgs: {} });
assert.equal(deny2.permissionDecision, "deny");
console.log("  ✅ bash is denied");

// ====================================================
// Pattern 3: Test prompt expansion
// ====================================================

console.log("\n=== Pattern 3: Test prompt hooks ===\n");

async function promptHook(input: { prompt: string }) {
  if (input.prompt.startsWith("/fix")) {
    return { modifiedPrompt: `Fix the errors in ${input.prompt.slice(4).trim()}` };
  }
  if (input.prompt.startsWith("/review")) {
    return { modifiedPrompt: `Review ${input.prompt.slice(7).trim()} for security issues` };
  }
  return null;
}

const fix = await promptHook({ prompt: "/fix the auth module" });
assert.equal(fix?.modifiedPrompt, "Fix the errors in the auth module");
console.log("  ✅ /fix expands correctly");

const review = await promptHook({ prompt: "/review database queries" });
assert.equal(review?.modifiedPrompt, "Review database queries for security issues");
console.log("  ✅ /review expands correctly");

const normal = await promptHook({ prompt: "What is TypeScript?" });
assert.equal(normal, null);
console.log("  ✅ Normal prompts pass through unchanged");

// ====================================================
// Summary
// ====================================================

console.log("\n=== Testing Best Practices ===\n");
console.log("  1. Extract handlers/hooks as standalone async functions");
console.log("  2. Test with mock inputs (no SDK, no CLI, no API calls)");
console.log("  3. Assert return shapes: { error }, { permissionDecision }, null");
console.log("  4. Test edge cases: unknown input, missing optional fields");
console.log("  5. Use assert.deepEqual for objects, assert.equal for primitives");

console.log("\n✅ All 9 tests passed!");

process.exit(0);
