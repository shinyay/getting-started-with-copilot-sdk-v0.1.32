---
layout: step
title: "Level 1: Connect — Your First SDK Session"
step_number: 1
permalink: /steps/1/
---

# Level 1: Connect — Your First SDK Session

> **Risk level:** 🟢 Zero — Nothing in this level modifies any files or runs dangerous code. You're only sending prompts and reading responses.

## Learning Objectives

By the end of this level, you will be able to:

1. Install the Copilot SDK and verify your development environment
2. Explain the SDK's 4-layer architecture (Your Code → SDK → CLI → LLM)
3. Create a `CopilotClient` instance and understand what happens under the hood
4. Create a session with a specific model
5. Send a prompt and receive a response using `sendAndWait()`
6. Read and interpret the response object structure
7. Clean up resources properly with `client.stop()` and `process.exit(0)`, and understand `onPermissionRequest`
8. Compare responses from different models
9. Understand the authentication priority chain
10. Read JSON-RPC debug traffic between the SDK and CLI
11. Handle common errors gracefully with try-catch patterns
12. Name all major `createSession()` configuration options

---

## Prerequisites

- [ ] Node.js 20+ installed (`node --version`)
- [ ] Copilot CLI installed and in PATH (`copilot --version`)
- [ ] GitHub Copilot subscription active
- [ ] Authenticated (`copilot auth login` or `gh auth status`)
- [ ] This repository cloned locally

---

## Workshop Structure

This level contains **12 exercises**. Estimated time: **45–60 minutes**.

| Exercise | Topic | Time |
|----------|-------|------|
| 1 | Install SDK & Verify Setup | 5 min |
| 2 | Understand the Architecture | 5 min |
| 3 | Create Your First Client | 3 min |
| 4 | Create Your First Session | 3 min |
| 5 | Send Your First Prompt | 5 min |
| 6 | Read the Response Object | 5 min |
| 7 | Permissions & Clean Up | 5 min |
| 8 | Try Different Models | 5 min |
| 9 | Authentication Methods | 5 min |
| 10 | Enable Debug Logging | 5 min |
| 11 | Handle Errors Gracefully | 5 min |
| 12 | Explore the SessionConfig Object | 5 min |

---

## Exercise 1: Install SDK & Verify Setup

### Goal
Get a working Node.js project with the Copilot SDK installed and all prerequisites verified.

### Steps

**1.1** Navigate to the sample app directory:

```bash
cd workshop/level-1/sample-app
```

**1.2** Verify your prerequisites:

```bash
node --version      # Must be 18+
copilot --version   # Must be installed
```

**1.3** Install dependencies:

```bash
npm install
```

**1.4** Examine the `package.json` to see what was installed:

```bash
cat package.json
```

You should see two dependencies:
- `@github/copilot-sdk` — the SDK itself
- `tsx` — runs TypeScript files directly (no compilation step needed)

**1.5** Verify the SDK is importable:

```bash
npx tsx -e "import { CopilotClient, approveAll } from '@github/copilot-sdk'; console.log('SDK loaded ✅')"
```

### Key Concept

> 💡 **The SDK is a thin client.** It doesn't contain an AI model — it connects to the Copilot CLI, which handles authentication, model routing, and API calls. Think of the SDK as a remote control and the CLI as the TV.

### ✅ Checkpoint
`npm install` completed without errors and you see `@github/copilot-sdk` in `package.json`.

---

## Exercise 2: Understand the Architecture

### Goal
Draw the mental model of how the SDK communicates with the AI. Understanding this 4-layer architecture will help you debug every issue you'll encounter later.

### Steps

**2.1** Study this architecture diagram:

```
┌─────────────────────────────────────────────────────────────────┐
│  Your Code (TypeScript)                                         │
│  └─ import { CopilotClient, approveAll } from "@github/copilot-sdk" │
│     └─ client.createSession({ model: "gpt-4.1", ... })         │
│        └─ session.sendAndWait({ prompt: "What is 2+2?" })      │
├─────────────────────────────────────────────────────────────────┤
│  SDK Client (Node.js library)                                   │
│  └─ Spawns CLI as child process                                 │
│  └─ Sends/receives JSON-RPC messages over stdio                 │
├─────────────────────────────────────────────────────────────────┤
│  Copilot CLI (separate process)                                 │
│  └─ Handles authentication, rate limiting, tool execution       │
│  └─ Routes requests to the correct model provider               │
├─────────────────────────────────────────────────────────────────┤
│  LLM API (GitHub Copilot / OpenAI / Azure / etc.)              │
│  └─ Generates the actual response                               │
└─────────────────────────────────────────────────────────────────┘
```

**2.2** Key insight — **the CLI is a separate process**:

When you call `new CopilotClient()`, the SDK spawns `copilot` as a subprocess. This means:
- If the CLI isn't installed, the SDK can't work
- If the CLI crashes, your code gets an error
- When you call `client.stop()`, the subprocess is terminated

**2.3** Key insight — **communication is JSON-RPC**:

Every method call (`createSession`, `sendAndWait`, etc.) is translated into a JSON-RPC message sent over stdio to the CLI. You'll see these messages in Exercise 10 (debug logging).

### Key Concept

> 💡 **JSON-RPC over stdio** is the wire protocol. All four language SDKs (TypeScript, Python, Go, .NET) use the same protocol, which is why they all have identical capabilities. Learning one SDK means you understand them all.

### ✅ Checkpoint
You can explain the 4 layers (Your Code → SDK → CLI → LLM) and know that the CLI is a separate subprocess.

---

## Exercise 3: Create Your First Client

### Goal
Instantiate a `CopilotClient` and understand what happens when you do.

### Steps

**3.1** Open `hello.ts` in the sample app and examine the first SDK line:

```typescript
import { CopilotClient, approveAll } from "@github/copilot-sdk";

const client = new CopilotClient();
```

**3.2** Understand what `new CopilotClient()` does:

1. Spawns the Copilot CLI as a child process (`copilot --server --stdio`)
2. Establishes a JSON-RPC connection over stdin/stdout
3. Waits for the CLI to be ready

**3.3** The constructor accepts optional configuration:

```typescript
// All options are optional
const client = new CopilotClient({
  logLevel: "debug",      // "debug" | "info" | "warn" | "error"
  cliPath: "/path/to/copilot",  // Custom CLI binary path
  cliUrl: "http://localhost:3000",  // Connect to external CLI (Level 7)
  githubToken: "gho_...",  // Explicit auth token
  useLoggedInUser: true,   // Use logged-in GitHub user
});
```

For now, the default `new CopilotClient()` is all you need.

### Key Concept

> 💡 **One client, many sessions.** A single `CopilotClient` manages one CLI subprocess. You can create multiple sessions from the same client — they share the same CLI connection but have independent conversation state.

### ✅ Checkpoint
You understand that `new CopilotClient()` spawns a CLI subprocess and know the optional constructor parameters.

---

## Exercise 4: Create Your First Session

### Goal
Create a session — the object that holds your conversation state and sends messages to the model.

### Steps

**4.1** Examine the session creation in `hello.ts`:

```typescript
const session = await client.createSession({ model: "gpt-4.1", onPermissionRequest: approveAll });
```

**4.2** Understand the key concepts:

- **`model` is required** — you must specify which LLM to use
- **A session is a conversation** — it holds the full message history
- **Sessions are independent** — two sessions from the same client don't share context
- **`createSession` is async** — it returns a Promise (note the `await`)

**4.3** Try creating the session without a model to see the error:

```typescript
// This will fail — model is required
const session = await client.createSession({});
```

### Key Concept

> 💡 **Client vs Session.** The client is your connection to the CLI. The session is your conversation. Think of it like a phone: the client is the phone line, the session is a specific phone call. You can make multiple calls on the same line.

### ✅ Checkpoint
You can create a session and know that `model` is the only required parameter.

---

## Exercise 5: Send Your First Prompt

### Goal
Send a message to the AI and receive a response. This is the core interaction.

### Steps

**5.1** Run the hello script:

```bash
npm run hello
```

**5.2** You should see output like:

```
Response: 4
```

**5.3** Examine the `sendAndWait` call in `hello.ts`:

```typescript
const response = await session.sendAndWait({
  prompt: "What is 2 + 2? Reply with just the number.",
});
```

**5.4** Understand `sendAndWait`:

- **Blocking** — it waits until the model finishes generating the entire response
- **Returns a response object** — the text is in `response.data.content`
- **Prompt is a string** — the `prompt` field in the options object

**5.5** Try modifying the prompt in `hello.ts`:

```typescript
const response = await session.sendAndWait({
  prompt: "What is the capital of Japan? Reply with just the city name.",
});
```

Run again with `npm run hello` and verify you get "Tokyo".

### Key Concept

> 💡 **`sendAndWait` is the simplest pattern.** It blocks until the full response is ready. In Level 2, you'll learn `send` + events for streaming responses token-by-token. For scripts and simple programs, `sendAndWait` is perfect.

### ✅ Checkpoint
You ran `npm run hello`, saw `Response: 4`, and understand that `sendAndWait` blocks until the response is complete.

---

## Exercise 6: Read the Response Object

### Goal
Explore what the response object contains beyond just the text content.

### Steps

**6.1** Modify `hello.ts` temporarily to log the full response:

```typescript
const response = await session.sendAndWait({
  prompt: "What is 2 + 2? Reply with just the number.",
});

// Log the full response structure
console.log("Full response:", JSON.stringify(response, null, 2));
```

**6.2** Run it and examine the output:

```bash
npm run hello
```

**6.3** The response object has this structure:

```typescript
{
  data: {
    content: "4",     // The actual text response
    role: "assistant", // Always "assistant" for model responses
    // ... additional metadata
  }
}
```

**6.4** The key field you'll use most is:

```typescript
response?.data.content   // The text response as a string
```

> 💡 **Note the `?.` (optional chaining).** `sendAndWait` can return `undefined` in rare edge cases (e.g., if the session is interrupted). Always use `response?.data.content` to safely access the content.

**6.5** Revert your change — remove the `JSON.stringify` line and restore the original `console.log("Response:", response?.data.content)`.

### Key Concept

> 💡 **The response is an object, not a string.** The text you want is nested at `response.data.content`. The response also contains metadata like the role (`"assistant"`) and potentially other fields depending on the model.

### ✅ Checkpoint
You know that the response text lives at `response?.data.content` and understand why optional chaining (`?.`) is used.

---

## Exercise 7: Permissions & Clean Up

### Goal
Understand why `onPermissionRequest: approveAll` is required, and why both `client.stop()` and `process.exit(0)` are necessary. Learn what happens if you skip any of these.

### Steps

**7.1** Examine the permission handler and cleanup code in `hello.ts`:

```typescript
import { CopilotClient, approveAll } from "@github/copilot-sdk";

const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4.1",
  onPermissionRequest: approveAll,  // ← Required since v0.1.28
});
// ...
await client.stop();
process.exit(0);
```

**7.2** Understand why **`onPermissionRequest: approveAll` is required**:

- Since v0.1.28, the SDK **denies all permissions by default** — any tool or action the agent attempts will be blocked unless you provide a handler
- `approveAll` is a convenience function exported by the SDK that approves every permission request
- Without it, your sessions may silently fail when the agent tries to use tools or perform actions

**7.3** Understand why **`client.stop()` is essential**:

- It sends a shutdown signal to the CLI subprocess
- Without it, the CLI process continues running as an orphan
- Orphaned processes consume memory and may hold authentication tokens

**7.4** Understand why **`process.exit(0)` is essential**:

- Node.js keeps running as long as there are active handles (timers, connections, etc.)
- The SDK may leave event listeners or handles that prevent natural exit
- `process.exit(0)` ensures a clean shutdown (exit code 0 = success)

**7.5** Try commenting out `process.exit(0)` and running `npm run hello`. You may notice the script hangs after printing the response. Press Ctrl+C to kill it, then restore the line.

### Key Concept

> 💡 **Permissions are deny-by-default.** Since v0.1.28, the SDK denies all permissions by default. `approveAll` is a convenience handler that approves everything — great for learning, but production apps should implement granular checks. You'll learn to write custom permission handlers in Level 5.

> 💡 **Always clean up.** The pattern is always: `await client.stop()` then `process.exit(0)`. Forgetting `client.stop()` leaves zombie CLI processes. Forgetting `process.exit(0)` makes your script hang.

### ✅ Checkpoint
You can explain why `onPermissionRequest: approveAll` is needed, why both `client.stop()` and `process.exit(0)` are required, and what breaks without each one.

---

## Exercise 8: Try Different Models

### Goal
Send the same prompt to different models and observe how they differ in speed and response quality.

### Steps

**8.1** Run the model comparison script:

```bash
npm run models
```

**8.2** Observe the output:

```
--- Model: gpt-4.1 ---
Response: An API is ...
Time: 2340ms

--- Model: gpt-4.1-mini ---
Response: An API is ...
Time: 1120ms
```

**8.3** Open `try-models.ts` and examine how it loops through models:

```typescript
const models = ["gpt-4.1", "gpt-4.1-mini"];

for (const model of models) {
  const session = await client.createSession({ model, onPermissionRequest: approveAll });
  const response = await session.sendAndWait({ prompt: "..." });
  // ...
}
```

**8.4** Try adding another model to the array (e.g., `"gpt-4.1-nano"` or `"claude-sonnet-4.5"`) and run again. If the model is not available, you'll see an error — which leads naturally to Exercise 11.

### Key Concept

> 💡 **Model selection is a tradeoff.** Larger models (gpt-4.1) tend to give higher-quality responses but take longer and cost more tokens. Smaller models (gpt-4.1-mini) are faster and cheaper but may produce less nuanced answers. Choose based on your use case.

### ✅ Checkpoint
You ran the same prompt on 2+ models and observed differences in response time and quality.

---

## Exercise 9: Authentication Methods

### Goal
Understand how the SDK authenticates with GitHub and the priority order of authentication methods.

### Steps

**9.1** The SDK checks for authentication in this priority order:

| Priority | Method | How to Set |
|----------|--------|-----------|
| 1 (highest) | Explicit `githubToken` | `new CopilotClient({ githubToken: "gho_..." })` |
| 2 | `COPILOT_GITHUB_TOKEN` env var | `export COPILOT_GITHUB_TOKEN=gho_...` |
| 3 | `GH_TOKEN` env var | `export GH_TOKEN=gho_...` |
| 4 | `GITHUB_TOKEN` env var | `export GITHUB_TOKEN=gho_...` |
| 5 | Stored OAuth credentials | `copilot auth login` (interactive) |
| 6 (lowest) | GitHub CLI credentials | `gh auth login` |

**9.2** Check which auth method you're currently using:

```bash
# If you used copilot auth login:
copilot auth status

# If you used GitHub CLI:
gh auth status
```

**9.3** Try setting an environment variable (don't worry — this is temporary):

```bash
# This would override stored credentials (don't actually run with a real token)
COPILOT_GITHUB_TOKEN=invalid_token npx tsx hello.ts
# You'll see an auth error — proving the env var takes priority
```

Press Ctrl+C if the command hangs after the error.

### Key Concept

> 💡 **Environment variables override stored credentials.** This matters in CI/CD and deployment scenarios where you inject tokens. For local development, `copilot auth login` is the easiest setup. For production, use environment variables or explicit tokens.

### ✅ Checkpoint
You can list the 6 authentication methods in priority order and know which one you're currently using.

---

## Exercise 10: Enable Debug Logging

### Goal
See the raw JSON-RPC messages between the SDK and CLI. This is your most powerful debugging tool.

### Steps

**10.1** Run the debug logging script:

```bash
npm run debug
```

**10.2** You'll see verbose output including JSON-RPC traffic. Look for patterns like:

```
-> {"jsonrpc":"2.0","method":"session.create",...}   ← SDK sends to CLI
<- {"jsonrpc":"2.0","result":{...}}                  ← CLI responds
-> {"jsonrpc":"2.0","method":"session.sendMessage",...}
<- {"jsonrpc":"2.0","method":"session.event",...}     ← Events from CLI
```

**10.3** Open `debug-logging.ts` and see how debug logging is enabled:

```typescript
const client = new CopilotClient({ logLevel: "debug" });
```

**10.4** Identify these three key message types in the debug output:

| Message | Direction | What It Means |
|---------|-----------|--------------|
| `session.create` | → CLI | Creating a new conversation session |
| `session.sendMessage` | → CLI | Sending your prompt |
| `session.event` | ← CLI | Response data coming back |

**10.5** Try changing `logLevel` to `"info"` or `"warn"` and notice how the output decreases. The levels are: `debug` > `info` > `warn` > `error`.

### Key Concept

> 💡 **Debug logging shows everything.** When something isn't working — a tool not being called, an auth failure, a model error — the first step is always `logLevel: "debug"`. It reveals the exact JSON-RPC messages being exchanged, which tells you precisely where the problem is.

### ✅ Checkpoint
You can identify a JSON-RPC request/response pair in the debug output and know the 4 log levels.

---

## Exercise 11: Handle Errors Gracefully

### Goal
Learn common SDK errors and how to catch them with try-catch patterns.

### Steps

**11.1** Run the error handling script:

```bash
npm run errors
```

**11.2** Observe the three scenarios:

```
=== Scenario 1: Normal operation ===
✅ Success: Hello

=== Scenario 2: Invalid model name ===
✅ Error caught (expected): ...

=== Scenario 3: Error formatting ===
Error name: Error
Error message: ...
```

**11.3** Open `error-handling.ts` and study the pattern:

```typescript
const client = new CopilotClient();
try {
  const session = await client.createSession({ model: "gpt-4.1", onPermissionRequest: approveAll });
  const response = await session.sendAndWait({ prompt: "Hello" });
  console.log("✅ Success:", response?.data.content);
} catch (error) {
  console.error("❌ Error:", (error as Error).message);
} finally {
  await client.stop();  // Always clean up, even on error
}
```

**11.4** Key points about error handling:

| Error Source | Common Causes | How to Handle |
|-------------|---------------|---------------|
| Client creation | CLI not installed, CLI not in PATH | Check `copilot --version` first |
| Session creation | Invalid model name, auth failure | Catch and show friendly message |
| Send message | Network timeout, rate limiting | Retry with backoff (Level 7) |

**11.5** Notice the `finally` block — **`client.stop()` goes in `finally`** to ensure cleanup even when errors occur.

### Key Concept

> 💡 **Always wrap SDK calls in try-catch-finally.** The `try` block does the work, `catch` handles errors gracefully, and `finally` ensures `client.stop()` runs no matter what. This prevents zombie CLI processes on error paths.

### ✅ Checkpoint
Errors are caught and displayed as friendly messages instead of crashing. You know the three common error sources.

---

## Exercise 12: Explore the SessionConfig Object

### Goal
Preview all the features you'll learn in later levels by examining every `createSession()` option.

### Steps

**12.1** Run the config exploration script:

```bash
npm run config
```

**12.2** Open `explore-config.ts` and read through the annotated comments. Every major `createSession()` option is documented with which level teaches it:

| Option | Type | Level |
|--------|------|:-----:|
| `model` | `string` | **1** (this level) |
| `onPermissionRequest` | `function` | **1** (this level) |
| `streaming` | `boolean` | **2** |
| `tools` | `Tool[]` | **3** |
| `systemMessage` | `{ content, mode? }` | **4** |
| `onUserInputRequest` | `async function` | **4** |
| `hooks` | `{ onPreToolUse, ... }` | **5** |
| `mcpServers` | `{ name: config }` | **6** |
| `customAgents` | `Agent[]` | **6** |
| `skillDirectories` | `string[]` | **6** |
| `availableTools` | `string[]` | **6** |
| `excludedTools` | `string[]` | **6** |
| `provider` | `{ type, baseUrl, apiKey }` | **7** |
| `sessionId` | `string` | **7** |
| `infiniteSessions` | `{ enabled, ... }` | **7** |
| `reasoningEffort` | `string` | **8** |

**12.3** Pick 5 options that interest you most and note which levels they belong to. This is your personal roadmap for the rest of the workshop.

### Key Concept

> 💡 **`createSession()` is the SDK's central configuration point.** Almost every feature — streaming, tools, hooks, MCP, BYOK, persistence — is configured here. Understanding this object is understanding the SDK.

### ✅ Checkpoint
You can name at least 5 `createSession()` options and know which level teaches each one.

---

## Self-Assessment

Rate yourself 1–3 on each skill:

| # | Skill | 1 | 2 | 3 |
|---|-------|---|---|---|
| 1 | I can install the SDK and verify my setup | ☐ | ☐ | ☐ |
| 2 | I can explain the 4-layer architecture | ☐ | ☐ | ☐ |
| 3 | I can create a `CopilotClient` instance | ☐ | ☐ | ☐ |
| 4 | I can create a session with a specific model | ☐ | ☐ | ☐ |
| 5 | I can send a prompt with `sendAndWait` | ☐ | ☐ | ☐ |
| 6 | I can read `response.data.content` | ☐ | ☐ | ☐ |
| 7 | I can explain `onPermissionRequest: approveAll`, `client.stop()`, and `process.exit(0)` | ☐ | ☐ | ☐ |
| 8 | I can compare responses from different models | ☐ | ☐ | ☐ |
| 9 | I can list the authentication priority order | ☐ | ☐ | ☐ |
| 10 | I can read JSON-RPC debug traffic | ☐ | ☐ | ☐ |
| 11 | I can handle errors with try-catch-finally | ☐ | ☐ | ☐ |
| 12 | I can name 5+ `createSession()` options | ☐ | ☐ | ☐ |

**Scoring:**
```
1 = I need to revisit this
2 = I can do this with reference
3 = I can do this from memory

Score: __/36
  30+ (≥ 83%) → Proceed to Level 2 ✅
  24-29 (67-80%) → Review weak areas, then proceed
  < 24 (< 67%) → Repeat key exercises before continuing
```

---

## What's Next?

In **[Level 2: Stream](../level-2/README.md)**, you'll move from blocking `sendAndWait` to **event-driven streaming** — watching tokens arrive one by one in real time. You'll learn the `session.on()` event system, track token usage, and build a typing indicator.
