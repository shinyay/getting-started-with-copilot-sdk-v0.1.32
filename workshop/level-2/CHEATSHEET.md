# Level 2 — Quick Reference Card

## Session Config — Streaming

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `streaming` | `boolean` | `false` | Enable token-by-token delta events |

```typescript
const session = await client.createSession({
  model: "gpt-4.1",
  onPermissionRequest: approveAll,
  streaming: true,
});
```

## Event Types

| Event | Fires | `event.data` Fields | Use For |
|-------|-------|--------------------|---------|
| `assistant.message_delta` | N times (per chunk) | `deltaContent` (string) | Real-time display |
| `assistant.message` | Once (end) | `content` (string) | Capturing full response |
| `assistant.usage` | Once (end) | `inputTokens`, `outputTokens` | Cost tracking |
| `session.idle` | Once (last) | — | Knowing everything is done |

## Event Ordering (guaranteed)

```
1. assistant.message_delta   ×N  (streaming chunks)
2. assistant.message          ×1  (complete text)
3. assistant.usage            ×1  (token counts)
4. session.idle               ×1  (agent loop finished)
```

## Event Subscription

```typescript
// Subscribe BEFORE sending — or you'll miss early tokens
session.on("assistant.message_delta", (event) => { ... });
session.on("assistant.message", (event) => { ... });
session.on("assistant.usage", (event) => { ... });
session.on("session.idle", () => { ... });
```

## Streaming Printer Pattern

```typescript
session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("session.idle", () => console.log());

await session.sendAndWait({ prompt: "..." });
```

## `send` vs `sendAndWait`

| Aspect | `sendAndWait` | `send` |
|--------|--------------|--------|
| Blocks? | Yes | No |
| Returns | `Response` object | `void` |
| Events fire? | Yes (if streaming) | Yes |
| Best for | Scripts, sequential prompts | Custom async orchestration |

> Default to `sendAndWait`. It fires events AND returns the response.

## Token Usage Tracking

```typescript
let totalInput = 0, totalOutput = 0;

session.on("assistant.usage", (event) => {
  totalInput += event.data.inputTokens;
  totalOutput += event.data.outputTokens;
  console.log(`Total: ${totalInput + totalOutput} tokens`);
});
```

> ⚠️ `inputTokens` grows each turn — conversation history is resent with every prompt.

## Typing Indicator Pattern

```typescript
const spinner = setInterval(() => process.stdout.write(`\r⠋ thinking...`), 80);
let first = false;

session.on("assistant.message_delta", (e) => {
  if (!first) { first = true; clearInterval(spinner); process.stdout.write("\r           \r"); }
  process.stdout.write(e.data.deltaContent);
});
```

## Output Methods

| Method | Trailing Newline | Use For |
|--------|:----------------:|---------|
| `process.stdout.write(text)` | No | Streaming deltas (same line) |
| `console.log(text)` | Yes | Final output, separators |
| `process.stdout.write("\r")` | No | Overwrite current line (spinners) |

## Common Mistakes

| Mistake | What Happens | Fix |
|---------|-------------|-----|
| `console.log` for deltas | Every chunk on its own line | Use `process.stdout.write` |
| Subscribe AFTER `send` | Miss early tokens | Subscribe first, then send |
| Forget `streaming: true` | No delta events fire at all | Add `streaming: true` to session config |
| Forget `session.idle` newline | Next prompt starts on same line | Add `console.log()` in idle handler |
| Use `send` for sequential prompts | Events interleave | Use `await sendAndWait` |
