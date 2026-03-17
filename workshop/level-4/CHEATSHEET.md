---
layout: cheatsheet
title: "Level 4: Interact — Cheatsheet"
parent_step: 4
permalink: /cheatsheet/4/
---

# Level 4 — Quick Reference Card

## System Message

| Mode | Config | Guardrails | Use When |
|------|--------|:----------:|----------|
| **Append** (default) | `{ content: "..." }` | ✅ Preserved | Most apps — shape personality |
| **Replace** | `{ mode: "replace", content: "..." }` | ❌ Removed | Full control needed |

```typescript
// Append mode (recommended)
systemMessage: {
  content: "You are a cheerful math tutor. Use emojis.",
}

// Replace mode (use with care)
systemMessage: {
  mode: "replace",
  content: "You are a strict exam proctor. Only technical definitions.",
}
```

## User Input Requests

```typescript
const session = await client.createSession({
  model: "gpt-4.1",
  onUserInputRequest: async (request, invocation) => {
    // request.question     — what the agent wants to ask
    // request.choices      — optional multiple-choice options
    // request.allowFreeform — whether free text is accepted
    // invocation.sessionId — the session that triggered this (optional to use)
    const answer = await rl.question(`🤖 ${request.question}\n> `);
    return { answer: answer.trim(), wasFreeform: true };
  },
  onPermissionRequest: approveAll,
});
```

> The SDK's built-in `ask_user` tool triggers this handler automatically.

## REPL Pattern

```typescript
import readline from "node:readline/promises";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

while (true) {
  const input = await rl.question("You: ");
  if (!input.trim()) continue;
  if (input.trim().toLowerCase() === "exit") break;

  process.stdout.write("Assistant: ");
  await session.sendAndWait({ prompt: input.trim() });
}

rl.close();
```

## Conversation Commands

```typescript
if (trimmed.startsWith("/")) {
  if (cmd === "/help")  { showHelp(); }
  if (cmd === "/exit")  { break; }
  if (cmd === "/usage") { console.log(`Tokens: ${total}`); }
  continue;  // Don't send to model
}
// Only non-command messages reach here
await session.sendAndWait({ prompt: trimmed });
```

## Signal Handling

```typescript
process.on("SIGINT", async () => {
  console.log("\n👋 Shutting down...");
  rl.close();
  await client.stop();
  process.exit(0);
});
```

> Without this, Ctrl+C leaves the CLI subprocess as an orphan.

## Per-Turn Token Tracking

```typescript
let turnTokens = 0;
session.on("assistant.usage", (e) => {
  turnTokens = e.data.inputTokens + e.data.outputTokens;
});
session.on("session.idle", () => {
  console.log(`  [${turnTokens} tokens this turn]`);
});
```

## Multi-Turn Memory

```
Turn 1: user sends "My name is Alex"
Turn 2: user sends "What did I say my name was?"
  → Session automatically includes Turn 1 in context
  → Model answers "Alex" — no manual history needed
```

> Input tokens grow each turn because the full history is resent.

## Session Config — Level 4

| Option | Type | Description |
|--------|------|-------------|
| `systemMessage` | `{ content: string; mode?: "replace" }` | Customize AI personality |
| `onUserInputRequest` | `async (request) => { answer, wasFreeform }` | Handle agent-to-user questions |

## Common Mistakes

| Mistake | What Happens | Fix |
|---------|-------------|-----|
| `mode: "replace"` without safety rules | No guardrails at all | Add your own safety instructions |
| No SIGINT handler in REPL | Orphaned CLI on Ctrl+C | Add `process.on("SIGINT", ...)` |
| Sending `/help` to the model | Wastes tokens, confuses model | Check `startsWith("/")` before `sendAndWait` |
| Forgetting `rl.close()` | stdin stays open | Close readline in exit path and SIGINT handler |
| Not tracking usage | Surprise token costs | Subscribe to `assistant.usage` event |
