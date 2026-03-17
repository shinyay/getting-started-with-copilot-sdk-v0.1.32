# Level 2: Stream — Real-Time Response Handling

> **Risk level:** 🟢 Zero — Like Level 1, you're only sending prompts and reading responses. No files are modified, no code is executed on your behalf.

## Learning Objectives

By the end of this level, you will be able to:

1. Enable streaming in a session and see tokens arrive progressively
2. Subscribe to `assistant.message_delta` events and handle token chunks
3. Receive the complete assembled message via `assistant.message`
4. Detect when the agent loop finishes with `session.idle`
5. Build a clean streaming printer using `process.stdout.write()`
6. Explain the difference between `sendAndWait` and `send` and choose the right one
7. Subscribe to multiple event types simultaneously and trace their ordering
8. Monitor token consumption with `assistant.usage` events
9. Build a typing indicator that transitions to streaming output
10. Send multiple sequential prompts and observe correct event ordering
11. Track cumulative token usage across an entire conversation
12. Create a decision framework for when to use each sending pattern

---

## Prerequisites

- [ ] **Level 1 completed** (you can create a client, session, send prompts, and clean up)
- [ ] Node.js 20+, Copilot CLI installed and authenticated
- [ ] This repository cloned locally

---

## Workshop Structure

This level contains **12 exercises**. Estimated time: **50–70 minutes**.

| Exercise | Topic | Time |
|----------|-------|------|
| 1 | Enable Streaming | 5 min |
| 2 | Subscribe to Message Deltas | 5 min |
| 3 | Receive the Complete Message | 5 min |
| 4 | Detect Response Completion | 3 min |
| 5 | Build a Streaming Printer | 5 min |
| 6 | Compare `sendAndWait` vs `send` | 7 min |
| 7 | Track All Event Types at Once | 5 min |
| 8 | Monitor Token Usage | 5 min |
| 9 | Build a Typing Indicator | 7 min |
| 10 | Send Multiple Sequential Prompts | 5 min |
| 11 | Build a Live Token Counter | 5 min |
| 12 | Streaming Decision Framework | 3 min |

---

## Exercise 1: Enable Streaming

### Goal
See the difference between blocking (Level 1) and streaming responses. With streaming enabled, text appears token-by-token instead of all at once.

### Steps

**1.1** Navigate to the sample app and install dependencies:

```bash
cd workshop/level-2/sample-app
npm install
```

**1.2** First, recall the Level 1 pattern (blocking). If you run the Level 1 hello script, the response appears all at once after a pause:

```bash
# Level 1 (blocking) — waits, then prints everything
cd ../level-1/sample-app && npm run hello && cd ../../level-2/sample-app
```

**1.3** Now run the Level 2 streaming version:

```bash
npm run basic
```

**1.4** Observe the difference: text appears **progressively**, word by word, as if someone is typing it.

**1.5** Open `stream-basic.ts` and find the key change:

```typescript
const session = await client.createSession({
  model: "gpt-4.1",
  onPermissionRequest: approveAll,
  streaming: true,  // ← This one option enables streaming
});
```

### Key Concept

> 💡 **`streaming: true` is the only config change needed.** Adding this single option to `createSession()` enables delta events. Without it, no `assistant.message_delta` events fire — even if you subscribe to them.

### ✅ Checkpoint
You see text appearing progressively (word-by-word) instead of all at once.

---

## Exercise 2: Subscribe to Message Deltas

### Goal
Handle the core streaming event — `assistant.message_delta` — which fires once for each chunk of tokens the model generates.

### Steps

**2.1** Open `stream-basic.ts` and examine the event subscription:

```typescript
session.on("assistant.message_delta", (event) => {
  process.stdout.write(event.data.deltaContent);
});
```

**2.2** Understand the two key elements:

- **`session.on("assistant.message_delta", handler)`** — subscribes to delta events
- **`event.data.deltaContent`** — the text chunk (usually a few characters or a word)

**2.3** Notice that the code uses `process.stdout.write()`, NOT `console.log()`. Try temporarily changing it:

```typescript
// Try this — notice the broken output
session.on("assistant.message_delta", (event) => {
  console.log(event.data.deltaContent);  // Adds a newline after EVERY chunk!
});
```

Run `npm run basic` and see: each word appears on its own line. Revert back to `process.stdout.write()`.

**2.4** Key timing rule — **subscribe BEFORE sending**:

```typescript
// ✅ Correct: subscribe first, then send
session.on("assistant.message_delta", handler);
await session.sendAndWait({ prompt: "..." });

// ❌ Wrong: send first, subscribe after — misses early tokens
await session.sendAndWait({ prompt: "..." });
session.on("assistant.message_delta", handler);  // Too late!
```

### Key Concept

> 💡 **`process.stdout.write()` vs `console.log()`.** The `write()` method outputs text without a trailing newline. Since each delta is just a small chunk (often a word or punctuation), you want them to flow together on one line. `console.log()` adds `\n` after each call, which breaks the streaming illusion.

### ✅ Checkpoint
You can explain what `deltaContent` contains and why `process.stdout.write` is used instead of `console.log`.

---

## Exercise 3: Receive the Complete Message

### Goal
Learn the `assistant.message` event, which fires once with the complete response after all deltas have been sent.

### Steps

**3.1** Run the event explorer:

```bash
npm run events
```

**3.2** In the output, find the `[COMPLETE]` line:

```
  [COMPLETE] +1250ms: Full response received
  Content (first 80 chars): "Why do programmers prefer dark mode? Because light attracts bugs..."
```

**3.3** Open `stream-events.ts` and examine the subscription:

```typescript
session.on("assistant.message", (event) => {
  console.log("Full response:", event.data.content);
});
```

**3.4** Understand the difference between the two events:

| Event | Fires | `event.data` | Use For |
|-------|-------|-------------|---------|
| `assistant.message_delta` | Many times (per chunk) | `deltaContent` (partial) | Real-time display |
| `assistant.message` | Once (at the end) | `content` (complete) | Saving the full response |

**3.5** Note: if you use `sendAndWait`, the return value gives you the same data as `assistant.message`:

```typescript
const response = await session.sendAndWait({ prompt: "..." });
// response.data.content === the same text from assistant.message
```

### Key Concept

> 💡 **Deltas are for display, message is for data.** Use `assistant.message_delta` to show text as it arrives (UX). Use `assistant.message` to capture the final, complete response for storage, processing, or further logic.

### ✅ Checkpoint
You understand that `assistant.message` fires once with the complete text, while `message_delta` fires many times with chunks.

---

## Exercise 4: Detect Response Completion

### Goal
Know exactly when the model is done responding using the `session.idle` event.

### Steps

**4.1** In the `npm run events` output, find the `[IDLE]` line:

```
  [IDLE] +1280ms: Agent loop finished
```

**4.2** Open `stream-events.ts` and examine:

```typescript
session.on("session.idle", () => {
  console.log("Agent loop finished");
});
```

**4.3** Understand when `session.idle` fires:

- **After** all `assistant.message_delta` events
- **After** the `assistant.message` event
- **After** the `assistant.usage` event
- It signals that the **entire agent loop** is done — not just the message

**4.4** Why "agent loop" and not just "response"? In later levels (Level 3+), the model may call tools, which triggers additional processing. `session.idle` waits for the entire cycle, including tool calls and follow-up responses.

**4.5** Common use: print a newline after streaming to separate the response from the next prompt:

```typescript
session.on("session.idle", () => {
  console.log(); // Newline after streaming output
});
```

### Key Concept

> 💡 **`session.idle` means "everything is done."** Unlike `assistant.message` which means "the text is complete," `session.idle` means the entire agent loop — including tool calls, follow-up messages, and finalization — is finished. It's the safest signal for "ready for the next prompt."

### ✅ Checkpoint
You know that `session.idle` fires last, after all other events, and signals the complete end of the agent loop.

---

## Exercise 5: Build a Streaming Printer

### Goal
Combine the three events (delta, message, idle) into a clean, reusable streaming output pattern.

### Steps

**5.1** The complete streaming printer pattern is:

```typescript
// 1. Subscribe to events BEFORE sending
session.on("assistant.message_delta", (event) => {
  process.stdout.write(event.data.deltaContent);  // Stream text
});

session.on("session.idle", () => {
  console.log();  // Newline when done
});

// 2. Send the prompt
await session.sendAndWait({ prompt: "Tell me a story." });
```

**5.2** Run `npm run basic` to see this pattern in action.

**5.3** The order matters! Here's the lifecycle:

```
Your code: session.on(...)        ← Subscribe to events
Your code: sendAndWait(...)       ← Send the prompt
  CLI:     processing...          ← Model generating
  Events:  message_delta (×N)     ← Chunks arrive progressively
  Events:  assistant.message      ← Complete text
  Events:  assistant.usage        ← Token counts
  Events:  session.idle           ← All done
Your code: (sendAndWait returns)  ← Unblocks
```

**5.4** Try building your own streaming printer. Create a temporary file:

```typescript
import { CopilotClient, approveAll } from "@github/copilot-sdk";

const client = new CopilotClient();
const session = await client.createSession({ model: "gpt-4.1", onPermissionRequest: approveAll, streaming: true });

session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("session.idle", () => console.log());

await session.sendAndWait({ prompt: "Write a haiku about TypeScript." });

await client.stop();
process.exit(0);
```

Run it with `npx tsx your-file.ts`.

### Key Concept

> 💡 **Subscribe → Send → Events fire → Idle.** This is the fundamental streaming lifecycle. Every streaming application you build will follow this pattern. Get it into muscle memory.

### ✅ Checkpoint
You can write the 3-event streaming pattern from memory: subscribe to deltas + idle, then send.

---

## Exercise 6: Compare `sendAndWait` vs `send`

### Goal
Understand the two message-sending patterns and know when to use each one.

### Steps

**6.1** Run the comparison script:

```bash
npm run compare
```

**6.2** Observe the two patterns:

```
=== Pattern 1: sendAndWait (blocking) ===
Result: The speed of light is approximately 299,792 kilometers per second.

=== Pattern 2: send (event-driven) ===
The speed of sound is approximately 343 meters per second...
Collected via events: The speed of sound is approximately...
```

**6.3** Open `send-vs-sendandwait.ts` and study both patterns:

**Pattern 1 — `sendAndWait`** (blocking):
```typescript
const response = await session.sendAndWait({ prompt: "..." });
console.log(response?.data.content);  // Available immediately after await
```

**Pattern 2 — `send`** (fire-and-forget):
```typescript
let collected = "";
session.on("assistant.message_delta", (e) => {
  collected += e.data.deltaContent;
});

const done = new Promise<void>((resolve) => {
  session.on("session.idle", () => resolve());
});

session.send({ prompt: "..." });  // Returns immediately!
await done;                        // Wait for idle manually
console.log(collected);
```

**6.4** Compare them side by side:

| Aspect | `sendAndWait` | `send` + events |
|--------|--------------|----------------|
| Blocks? | Yes — waits for full response | No — returns immediately |
| Returns | Response object | `void` |
| Events fire? | Yes (if `streaming: true`) | Yes |
| Use when | Simple scripts, Q&A bots | Interactive UX, progress bars |
| Complexity | Low | Medium |

**6.5** Important nuance: **`sendAndWait` still fires events if streaming is enabled.** The difference is only whether your code blocks on the result.

### Key Concept

> 💡 **`sendAndWait` is `send` + automatic waiting.** Under the hood, `sendAndWait` calls `send` and then waits for `session.idle`. If you're using streaming events for display anyway, `sendAndWait` is usually the right choice — you get events AND the return value.

### ✅ Checkpoint
You can explain when to use `sendAndWait` vs `send` and know that `sendAndWait` still fires events.

---

## Exercise 7: Track All Event Types at Once

### Goal
See the complete event lifecycle by subscribing to every event type simultaneously and observing the exact firing order.

### Steps

**7.1** Run the event explorer:

```bash
npm run events
```

**7.2** Study the output timeline:

```
  [DELTA #1] +820ms: "Why"
  [DELTA #2] +825ms: " do"
  [DELTA #3] +831ms: " programmers"
  [DELTA #4...] (remaining deltas streaming silently)

  [COMPLETE] +1250ms: Full response received
  [USAGE] +1255ms: 28 input + 45 output tokens
  [IDLE] +1260ms: Agent loop finished

📊 Summary: 23 delta events fired
```

**7.3** Draw the event timeline:

```
Time →
  |----[DELTA]--[DELTA]--[DELTA]--...(N times)..--[DELTA]----|
  |                                                           |
  |                                              [COMPLETE]---|
  |                                                [USAGE]----|
  |                                                 [IDLE]----|
```

**7.4** Open `stream-events.ts` and see how all four subscriptions coexist:

```typescript
session.on("assistant.message_delta", (event) => { /* chunks */ });
session.on("assistant.message", (event) => { /* full text */ });
session.on("assistant.usage", (event) => { /* token counts */ });
session.on("session.idle", () => { /* done */ });
```

**7.5** Key observation: the order is **always** the same:
1. `assistant.message_delta` (many times)
2. `assistant.message` (once)
3. `assistant.usage` (once)
4. `session.idle` (once)

### Key Concept

> 💡 **Events have a guaranteed order.** Deltas always come first (streaming), then the complete message, then usage stats, then idle. You can rely on this order when building applications — for example, you know token counts are available before idle fires.

### ✅ Checkpoint
You can draw the event timeline from memory: deltas → message → usage → idle.

---

## Exercise 8: Monitor Token Usage

### Goal
Track how many tokens each prompt consumes using the `assistant.usage` event.

### Steps

**8.1** Run the token usage tracker:

```bash
npm run usage
```

**8.2** Observe per-prompt token counts:

```
--- Prompt: "What is JavaScript? One sentence." ---

JavaScript is a versatile programming language...
  📊 Prompt #1: 18 input + 24 output = 42 tokens
  📈 Running total: 18 input + 24 output = 42 tokens
```

**8.3** Open `token-usage.ts` and examine the handler:

```typescript
session.on("assistant.usage", (event) => {
  const input = event.data.inputTokens;
  const output = event.data.outputTokens;
  totalInput += input;
  totalOutput += output;
});
```

**8.4** Understand the two token types:

| Type | What It Counts | Grows With |
|------|---------------|------------|
| `inputTokens` | Your prompt + conversation history | Each turn (history accumulates) |
| `outputTokens` | The model's response | Response length |

**8.5** Important observation: **input tokens grow with each turn** because the entire conversation history is sent with every prompt. Watch the `inputTokens` value increase across the 3 prompts.

### Key Concept

> 💡 **Input tokens include conversation history.** The first prompt might use 18 input tokens, but the second uses more (because it includes the first Q&A pair), and the third uses even more. This is why long conversations cost more — and why Level 7's "infinite sessions" feature exists.

### ✅ Checkpoint
You know that `assistant.usage` provides `inputTokens` and `outputTokens`, and that input tokens grow as conversation history accumulates.

---

## Exercise 9: Build a Typing Indicator

### Goal
Create a polished UX: show a spinner while waiting for the model, then transition to streaming output when the first token arrives.

### Steps

**9.1** Run the typing indicator demo:

```bash
npm run spinner
```

**9.2** Watch the UX flow:
1. `⠋ thinking...` spinner appears immediately
2. Spinner animates for 1-2 seconds while the model processes
3. Spinner disappears and streaming text begins
4. Text streams to completion

**9.3** Open `typing-indicator.ts` and study the technique:

```typescript
// Start spinner immediately
const spinner = setInterval(() => {
  process.stdout.write(`\r${frame} thinking...`);
}, 80);

// When first delta arrives, kill the spinner
session.on("assistant.message_delta", (event) => {
  if (!firstDeltaReceived) {
    firstDeltaReceived = true;
    clearInterval(spinner);
    process.stdout.write("\r                \r");  // Clear spinner line
  }
  process.stdout.write(event.data.deltaContent);
});
```

**9.4** Key technique — **`\r` (carriage return)** moves the cursor to the beginning of the line without advancing to the next line. This lets you overwrite the spinner text:

```
\r${frame} thinking...   ← Update spinner in place
\r                \r     ← Overwrite with spaces to clear
```

**9.5** The state flag `firstDeltaReceived` ensures the spinner-to-streaming transition happens only once.

### Key Concept

> 💡 **Bridge the gap between "sent" and "first token."** There's always a delay between sending a prompt and receiving the first delta (model processing time). A spinner fills this gap and makes the app feel responsive. The transition point is the first `message_delta` event.

### ✅ Checkpoint
You see the spinner → streaming transition and understand the `\r` carriage return technique for in-place updates.

---

## Exercise 10: Send Multiple Sequential Prompts

### Goal
Send multiple prompts in sequence and observe that each completes fully before the next begins.

### Steps

**10.1** Run the story streamer:

```bash
npm run story
```

**10.2** Observe the 3-part story:

```
--- Part 1: The Opening ---
  ⠋ thinking...
  (streaming text appears)
  📊 [187 total tokens so far]

--- Part 2: The Twist ---
  ⠋ thinking...
  (streaming text appears)
  📊 [412 total tokens so far]

--- Part 3: The Conclusion ---
  ...
```

**10.3** Open `story-streamer.ts` and examine the sequential pattern:

```typescript
await ask("Write the opening paragraph...", "Part 1: The Opening");
await ask("Continue with a twist...", "Part 2: The Twist");
await ask("Write the conclusion...", "Part 3: The Conclusion");
```

**10.4** Key: **`await sendAndWait` ensures ordering.** Each prompt waits for the previous to fully complete (including `session.idle`) before the next one is sent. This guarantees:
- Events from Part 1 never mix with events from Part 2
- The model has Part 1's response in its context when processing Part 2
- Token counts accumulate correctly

**10.5** What happens if you use `send` (non-blocking) instead? The prompts would queue up and events could interleave — which is usually NOT what you want for sequential conversations.

### Key Concept

> 💡 **`await sendAndWait` is your sequencing tool.** For sequential multi-prompt workflows (stories, multi-step analysis, follow-up questions), always `await` each `sendAndWait`. This prevents event interleaving and ensures the model has full context from previous turns.

### ✅ Checkpoint
You ran a 3-prompt sequential story and verified that each part completes before the next begins.

---

## Exercise 11: Build a Live Token Counter

### Goal
Display a running token counter that accumulates across an entire conversation.

### Steps

**11.1** Run the token usage tracker:

```bash
npm run usage
```

**11.2** Watch the running totals:

```
  📊 Prompt #1: 18 input + 24 output = 42 tokens
  📈 Running total: 18 input + 24 output = 42 tokens

  📊 Prompt #2: 62 input + 31 output = 93 tokens
  📈 Running total: 80 input + 55 output = 135 tokens

  📊 Prompt #3: 113 input + 28 output = 141 tokens
  📈 Running total: 193 input + 83 output = 276 tokens
```

**11.3** Open `token-usage.ts` and see the accumulation pattern:

```typescript
let totalInput = 0;
let totalOutput = 0;

session.on("assistant.usage", (event) => {
  totalInput += event.data.inputTokens;
  totalOutput += event.data.outputTokens;
  console.log(`Running total: ${totalInput + totalOutput} tokens`);
});
```

**11.4** Notice how `inputTokens` grows with each prompt — this is the conversation history effect from Exercise 8. The model receives all previous messages plus the new prompt each time.

**11.5** In a production app, you'd use this to implement:
- Token budget alerts ("Warning: 80% of budget consumed")
- Cost estimation (tokens × price per token)
- Session cutoff ("Maximum 4000 tokens per conversation")

### Key Concept

> 💡 **Token tracking is essential for production.** Without it, a runaway conversation can consume thousands of tokens before you notice. Always track cumulative usage in any application that sends multiple prompts.

### ✅ Checkpoint
You see cumulative token totals increasing across prompts and understand the conversation history growth effect.

---

## Exercise 12: Streaming Decision Framework

### Goal
Create a personal reference for choosing the right sending pattern and event subscriptions for any use case.

### Steps

**12.1** Use this decision framework:

**When to use `sendAndWait` (blocking):**
- ✅ Scripts and one-off programs
- ✅ Simple Q&A (send prompt, get answer, done)
- ✅ When you need the full response as a return value
- ✅ Sequential multi-prompt workflows (Exercise 10)
- ✅ When you also want streaming events (they still fire!)

**When to use `send` + events (non-blocking):**
- ✅ When you need the `Promise` to resolve immediately
- ✅ Complex event orchestration (multiple listeners, custom state)
- ✅ When `sendAndWait`'s return value isn't useful to you

**12.2** Which events to subscribe to:

| Scenario | Events You Need |
|----------|----------------|
| Display streaming text | `message_delta` + `session.idle` |
| Capture full response | `assistant.message` (or use `sendAndWait` return) |
| Track costs | `assistant.usage` |
| Full observability | All four events |
| Simple script, no streaming | None (just use `sendAndWait`) |

**12.3** Key gotcha to remember:

> ⚠️ **`sendAndWait` fires events too.** If you have `streaming: true` and subscribe to `message_delta`, the deltas fire *even* with `sendAndWait`. The `await` blocks, but events fire during the wait. This is usually exactly what you want.

**12.4** Review everything you learned in this level by looking at `story-streamer.ts` — it combines every pattern: streaming, usage tracking, typing indicator, and sequential prompts.

### Key Concept

> 💡 **Default to `sendAndWait` + `streaming: true` + event subscriptions.** This gives you the best of both worlds: blocking control flow AND real-time events. Only use bare `send` when you have a specific reason not to block.

### ✅ Checkpoint
You can choose the right sending pattern and event subscriptions for any given use case.

---

## Self-Assessment

Rate yourself 1–3 on each skill:

| # | Skill | 1 | 2 | 3 |
|---|-------|---|---|---|
| 1 | I can enable streaming with `streaming: true` | ☐ | ☐ | ☐ |
| 2 | I can subscribe to `assistant.message_delta` with `process.stdout.write` | ☐ | ☐ | ☐ |
| 3 | I can receive the complete message via `assistant.message` | ☐ | ☐ | ☐ |
| 4 | I can detect completion with `session.idle` | ☐ | ☐ | ☐ |
| 5 | I can write the streaming printer pattern from memory | ☐ | ☐ | ☐ |
| 6 | I can explain `sendAndWait` vs `send` and choose correctly | ☐ | ☐ | ☐ |
| 7 | I can draw the event ordering timeline | ☐ | ☐ | ☐ |
| 8 | I can track token usage with `assistant.usage` | ☐ | ☐ | ☐ |
| 9 | I can build a spinner → streaming transition | ☐ | ☐ | ☐ |
| 10 | I can send sequential prompts without event interleaving | ☐ | ☐ | ☐ |
| 11 | I can track cumulative tokens across a conversation | ☐ | ☐ | ☐ |
| 12 | I can choose the right pattern for a given scenario | ☐ | ☐ | ☐ |

**Scoring:**
```
1 = I need to revisit this
2 = I can do this with reference
3 = I can do this from memory

Score: __/36
  30+ (≥ 83%) → Proceed to Level 3 ✅
  24-29 (67-80%) → Review weak areas, then proceed
  < 24 (< 67%) → Repeat key exercises before continuing
```

---

## What's Next?

In **[Level 3: Tools](../level-3/README.md)**, you'll learn the SDK's most powerful feature — **custom tools**. You'll define functions that the model can call, pass parameters via JSON Schema and Zod, and build a multi-tool travel assistant that the model orchestrates autonomously.
