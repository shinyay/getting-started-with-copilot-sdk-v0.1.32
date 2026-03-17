/**
 * hello.ts — Your first Copilot SDK program
 *
 * This is the simplest possible SDK example. It demonstrates the complete
 * lifecycle: create client → create session → send prompt → read response → clean up.
 *
 * If you see "4" printed, your setup is working correctly.
 *
 * Exercises covered: 1 (setup), 3 (client), 4 (session), 5 (send), 6 (response), 7 (cleanup)
 *
 * Run: npx tsx hello.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";

// Step 1: Create a client
// This spawns the Copilot CLI as a child process (JSON-RPC over stdio).
// The CLI handles authentication, model routing, and rate limiting.
const client = new CopilotClient();

// Step 2: Create a session
// A session holds conversation state. The `model` parameter is required.
// Think of it as: client = connection, session = conversation.
const session = await client.createSession({ model: "gpt-4.1", onPermissionRequest: approveAll });

// Step 3: Send a prompt and wait for the complete response
// sendAndWait() blocks until the model finishes generating.
// It returns a response object with the full text in response.data.content.
const response = await session.sendAndWait({
  prompt: "What is 2 + 2? Reply with just the number.",
});

// Step 4: Read and print the response
// The response object has: response.data.content (the text), plus metadata.
console.log("Response:", response?.data.content);

// Step 5: Clean up — ALWAYS do both of these
// client.stop() shuts down the CLI subprocess. Without it, the process lingers.
// process.exit(0) exits Node.js. Without it, the event loop may hang.
await client.stop();
process.exit(0);
