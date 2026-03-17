# Level 8 — Quick Reference Card

## Image Attachments

```typescript
await session.sendAndWait({
  prompt: "What's in this image?",
  attachments: [{ type: "file", path: "./image.png" }],
});
// Supported: PNG, JPG, GIF, WebP
// Multiple images: add more objects to the array
```

## Reasoning Events

```typescript
// Thinking process (fires BEFORE response — model-dependent)
session.on("assistant.reasoning_delta", (e) => {
  process.stdout.write(e.data.deltaContent);  // Streaming thinking
});
session.on("assistant.reasoning", (e) => {
  console.log(e.data.content);  // Complete thinking
});

// Regular response (fires AFTER reasoning)
session.on("assistant.message_delta", (e) => { ... });
```

## Event Timeline (with reasoning)

```
1. assistant.reasoning_delta  ×N   (thinking)
2. assistant.reasoning         ×1   (complete thinking)
3. assistant.message_delta     ×N   (response)
4. assistant.message           ×1   (complete response)
5. assistant.usage             ×1   (tokens — includes reasoning)
6. session.idle                ×1   (done)
```

## `reasoningEffort`

```typescript
const session = await client.createSession({
  model: "gpt-4.1",
  onPermissionRequest: approveAll,
  reasoningEffort: "high",  // "low" | "medium" | "high"
});
```

| Effort | Quality | Cost | Use For |
|--------|---------|------|---------|
| `"low"` | Fast | Lower | Simple Q&A, lookups |
| `"medium"` | Balanced | Moderate | General use |
| `"high"` | Thorough | Higher | Complex reasoning, security reviews |

## All CopilotClient Options

```typescript
const client = new CopilotClient({
  logLevel: "debug",                     // L1
  githubToken: "gho_...",               // L1/L7
  useLoggedInUser: true,                 // L8
  cliPath: "/usr/local/bin/copilot",    // L8
  cliUrl: "http://localhost:3000",       // L7
});
```

## Complete SDK Feature Map

```
L1: CopilotClient, createSession, sendAndWait, client.stop, process.exit
L2: streaming, session.on, message_delta, message, idle, usage, send
L3: defineTool, JSON Schema, Zod, handler, tools array
L4: systemMessage (append/replace), onUserInputRequest, REPL
L5: hooks: onSessionStart, onSessionEnd, onPreToolUse, onPostToolUse,
    onUserPromptSubmitted, onErrorOccurred
L6: mcpServers (local/http), customAgents, skillDirectories,
    disabledSkills, availableTools, excludedTools
L7: provider (BYOK), sessionId, resumeSession, infiniteSessions,
    external CLI (cliUrl), onPermissionRequest, approveAll
L8: attachments, reasoning_delta, reasoning, reasoningEffort,
    useLoggedInUser, cliPath, session.setModel
```

## Testing Patterns

```typescript
// 1. Extract handler as standalone function
async function weatherHandler(args: { city: string }) { ... }

// 2. Test with mock input (no SDK needed)
const result = await weatherHandler({ city: "Tokyo" });
assert.deepEqual(result, { city: "Tokyo", temperature: 22 });

// 3. Test hooks the same way
async function preToolHook(input: { toolName: string }) { ... }
assert.equal((await preToolHook({ toolName: "shell" })).permissionDecision, "deny");
```

## Security Hardening Checklist

```
Auth & Secrets:
  ☐ No API keys in source code (use process.env)
  ☐ .env in .gitignore
  ☐ BYOK keys rotated regularly

Tool Restrictions:
  ☐ onPreToolUse blocks shell/bash/editFile
  ☐ MCP: specific tool names, not ["*"] in production
  ☐ excludedTools or availableTools set
  ☐ NEVER use approveAll in production — use granular permission handlers

Data Protection:
  ☐ onPostToolUse redacts PII/secrets
  ☐ Sensitive data never reaches the model

Error Handling:
  ☐ onErrorOccurred: retry transient, skip non-critical, abort fatal
  ☐ userNotification for all error strategies

Observability:
  ☐ Audit trail via pre/post hooks
  ☐ Token usage tracked per session
  ☐ Structured session IDs

Shutdown:
  ☐ SIGINT handler with client.stop()
  ☐ try-catch-finally for cleanup
  ☐ MCP servers have timeout
```

## Project Architecture Template

```
My SDK App
├── tools/           ← defineTool handlers (extracted, testable)
├── hooks/           ← Hook functions (extracted, testable)
├── skills/          ← Skill directories (prompts, tools)
├── config.ts        ← Session config (model, BYOK, MCP)
├── app.ts           ← Main application (REPL, streaming)
├── tests/           ← Unit tests for handlers and hooks
└── package.json
```

## New APIs (v0.1.30+)

| API | Description |
|-----|-------------|
| `session.setModel(modelName)` | Switch model mid-session without creating a new session |
| `mode: "immediate"` / `mode: "enqueue"` on `send()` | Steering vs queueing — `"immediate"` interrupts current turn, `"enqueue"` waits |
| `overridesBuiltInTool: true` on `defineTool()` | Override built-in tools like `grep`, `edit_file` with custom implementations |
| `onPermissionRequest: approveAll` | **Required since v0.1.32** — auto-approve all tool executions (dev only) |
