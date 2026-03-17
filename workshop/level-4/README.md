# Level 4: Interact — Build Conversational Applications

> **Risk level:** 🟡 Low — You're building interactive applications that call tools with hardcoded data. No file system access, no network calls, no destructive operations.

## Learning Objectives

By the end of this level, you will be able to:

1. Build an interactive REPL loop using Node.js `readline/promises`
2. Add real-time streaming to an interactive conversation
3. Integrate custom tools that respond to dynamic user questions
4. Leverage multi-turn conversation memory (session state)
5. Customize the AI's personality using `systemMessage` in append mode
6. Take full control with `systemMessage` in replace mode and understand the tradeoffs
7. Configure `onUserInputRequest` so the agent can ask YOU questions
8. Implement slash commands (`/help`, `/exit`) that are handled locally
9. Handle `SIGINT`/`SIGTERM` signals for graceful shutdown
10. Monitor token usage per turn with running totals
11. Orchestrate multiple complementary tools in natural dialog
12. Combine all interactive patterns into a polished application

---

## Prerequisites

- [ ] **Level 3 completed** (you can define tools, handle parameters, and manage errors)
- [ ] Node.js 20+, Copilot CLI installed and authenticated
- [ ] This repository cloned locally

---

## Workshop Structure

This level contains **12 exercises**. Estimated time: **60–80 minutes**.

| Exercise | Topic | Time |
|----------|-------|------|
| 1 | Build a Basic REPL Loop | 5 min |
| 2 | Add Streaming to the REPL | 5 min |
| 3 | Integrate Custom Tools in the REPL | 7 min |
| 4 | Multi-Turn Conversation Memory | 5 min |
| 5 | System Message Customization (Append Mode) | 7 min |
| 6 | System Message Customization (Replace Mode) | 5 min |
| 7 | User Input Requests — Let the Agent Ask YOU | 10 min |
| 8 | Conversation Commands | 5 min |
| 9 | Graceful Shutdown & Signal Handling | 5 min |
| 10 | Token Usage Monitoring Per Turn | 5 min |
| 11 | Multiple Tools in Natural Dialog | 5 min |
| 12 | Capstone: Polished Interactive Assistant | 7 min |

---

## Exercise 1: Build a Basic REPL Loop

### Goal
Create the foundation for every interactive SDK application — a Read-Eval-Print Loop that reads user input, sends it to the model, and prints the response.

### Steps

**1.1** Navigate to the sample app and install dependencies:

```bash
cd workshop/level-4/sample-app
npm install
```

**1.2** Run the basic REPL:

```bash
npm run repl
```

**1.3** Type a message, press Enter, and see the response. Type `exit` to quit.

**1.4** Open `basic-repl.ts` and study the REPL pattern:

```typescript
import readline from "node:readline/promises";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

while (true) {
  const input = await rl.question("You: ");
  const trimmed = input.trim();

  if (!trimmed) continue;              // Skip empty input
  if (trimmed.toLowerCase() === "exit") break;  // Exit condition

  process.stdout.write("Assistant: ");
  await session.sendAndWait({ prompt: trimmed });
}

rl.close();
```

**1.5** Key elements of the REPL:
- **`readline/promises`** — Node.js built-in for line-by-line input (no raw mode needed)
- **`while (true)`** — Infinite loop, broken by exit condition
- **`rl.question()`** — Awaits one line of user input
- **`rl.close()`** — Clean up readline when done

### Key Concept

> 💡 **REPL = Read-Eval-Print-Loop.** Every interactive SDK application follows this pattern: read user input → send to model → display response → repeat. The `readline/promises` module makes this easy with `await rl.question()`. For more advanced input handling (arrow keys, history), consider using raw-mode stdin with escape sequence parsing.

### ✅ Checkpoint
You can type prompts interactively and get responses. The loop continues until you type `exit`.

---

## Exercise 2: Add Streaming to the REPL

### Goal
Combine the REPL loop with streaming so responses appear token-by-token during interactive conversations.

### Steps

**2.1** In `basic-repl.ts`, notice streaming is already enabled:

```typescript
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,  // Enables delta events
  onPermissionRequest: approveAll,
});

session.on("assistant.message_delta", (event) => {
  process.stdout.write(event.data.deltaContent);
});

session.on("session.idle", () => {
  console.log("\n");  // Newline + blank line between turns
});
```

**2.2** Run `npm run repl` and notice: the response streams in real time, not all at once.

**2.3** The interaction flow for each turn:

```
User types "Hello" → Enter
  ↓
"Assistant: " prefix printed
  ↓
session.sendAndWait({ prompt: "Hello" })
  ↓
message_delta events fire → text streams progressively
  ↓
session.idle fires → newline printed
  ↓
sendAndWait returns → loop continues
  ↓
"You: " prompt appears again
```

**2.4** Key: event subscriptions happen **once before the loop**, not inside it. The same handlers serve every turn.

### Key Concept

> 💡 **Subscribe once, use for every turn.** Event handlers registered with `session.on()` persist for the lifetime of the session. You don't re-subscribe inside the loop — the same `message_delta` handler fires for every response, regardless of how many turns the conversation has.

### ✅ Checkpoint
You see streaming responses in the REPL and understand that event handlers are registered once outside the loop.

---

## Exercise 3: Integrate Custom Tools in the REPL

### Goal
Add tools to the REPL so the model can call your functions during interactive conversation.

### Steps

**3.1** Run the quiz REPL:

```bash
npm run tools
```

**3.2** Try these prompts in sequence:

```
You: Quiz me on JavaScript
You: I think the answer is D
You: Now quiz me on history
```

**3.3** Open `repl-with-tools.ts` and see the tools:

```typescript
const generateQuiz = defineTool("generate_quiz", {
  description: "Generate a quiz question on a given topic...",
  // ...
});

const checkAnswer = defineTool("check_answer", {
  description: "Check if a quiz answer is correct...",
  // ...
});

const session = await client.createSession({
  tools: [generateQuiz, checkAnswer],  // Available in every turn
  onPermissionRequest: approveAll,
});
```

**3.4** Notice: the model decides to call `generate_quiz` when you say "quiz me" and `check_answer` when you provide an answer. This happens **automatically** based on the tool descriptions — you don't write routing logic.

**3.5** Try a prompt that doesn't need tools:

```
You: What's the capital of France?
```

The model answers from its own knowledge without calling any tools.

### Key Concept

> 💡 **Tools + REPL = dynamic assistant.** The model uses tools when the conversation requires them and answers from its own knowledge when it doesn't. You define the tools once; the model handles all routing across every turn of the conversation.

### ✅ Checkpoint
You had a multi-turn conversation where tools were called dynamically based on what you asked.

---

## Exercise 4: Multi-Turn Conversation Memory

### Goal
Verify that the session automatically maintains conversation history — the model remembers everything from previous turns.

### Steps

**4.1** Run `npm run repl` and have a multi-turn conversation:

```
You: My name is Alex and I'm learning TypeScript.
You: What's a good first project for me?
You: Can you make that suggestion more challenging?
```

**4.2** Notice: the model remembers your name, your language, and its previous suggestion — even though you didn't resend any of that information.

**4.3** How it works:

```
Turn 1: "My name is Alex..."
  → Session stores: [user: "My name is Alex..."]

Turn 2: "What's a good first project?"
  → Session sends: [user: "My name is Alex...", assistant: "...", user: "What's a good..."]
  → Model sees the FULL history

Turn 3: "Make it more challenging"
  → Session sends ALL 5 messages (3 user + 2 assistant)
  → Model knows "it" refers to the project suggestion
```

**4.4** This is why **input tokens grow with each turn** (from Level 2, Exercise 8) — the entire history is sent every time.

### Key Concept

> 💡 **Session = automatic conversation memory.** You never need to manually track or resend previous messages. The session object handles all history management. This is what makes `sendAndWait` different from a stateless API call — every turn builds on the previous ones.

### ✅ Checkpoint
Follow-up prompts correctly reference earlier context, proving the session maintains history automatically.

---

## Exercise 5: System Message Customization (Append Mode)

### Goal
Shape the AI's personality by appending custom instructions to the system prompt while preserving SDK guardrails.

### Steps

**5.1** Run the system message comparison:

```bash
npm run system
```

**5.2** Observe the two responses to the same prompt ("Explain what a variable is"):

```
=== Mode 1: Append — Cheerful math tutor ===
(Friendly, uses analogies and emojis, 3 sentences)

=== Mode 2: Replace — Strict exam proctor ===
(Formal, technical definition only, 2 sentences)
```

**5.3** Open `system-message.ts` and study append mode:

```typescript
const session = await client.createSession({
  model: "gpt-4.1",
  systemMessage: {
    content: "You are a cheerful and encouraging math tutor. Use simple analogies and emojis.",
  },
  // No `mode` specified → defaults to "append"
  onPermissionRequest: approveAll,
});
```

**5.4** Append mode mechanics:

```
Default system prompt (SDK built-in):
  "You are a helpful AI assistant. [guardrails, safety rules, etc.]"

Your addition:
  "You are a cheerful and encouraging math tutor. Use analogies and emojis."

What the model receives (combined):
  "You are a helpful AI assistant. [guardrails] ... You are a cheerful tutor. Use analogies."
```

**5.5** The key benefit: **guardrails are preserved**. The SDK's built-in safety rules remain active alongside your customization.

### Key Concept

> 💡 **Append mode is the recommended default.** It lets you shape the AI's personality, style, and constraints while keeping the SDK's built-in safety guardrails active. Think of it as adding a costume to the assistant — the character changes, but the underlying rules stay.

### ✅ Checkpoint
You see different personality in the response and understand that append mode preserves SDK guardrails.

---

## Exercise 6: System Message Customization (Replace Mode)

### Goal
Understand replace mode — full control over the system prompt, but at the cost of removing all built-in guardrails.

### Steps

**6.1** In the `npm run system` output, compare Mode 1 (append) with Mode 2 (replace):

The replace mode response is noticeably different — the AI behaves purely according to your instructions with no SDK defaults.

**6.2** Open `system-message.ts` and study replace mode:

```typescript
const session = await client.createSession({
  model: "gpt-4.1",
  systemMessage: {
    mode: "replace",  // ← This changes everything
    content: "You are a strict and formal exam proctor. Give only precise, technical definitions.",
  },
  onPermissionRequest: approveAll,
});
```

**6.3** Replace mode mechanics:

```
Default system prompt:     ❌ REMOVED entirely
Your content:              ✅ This is the ONLY system prompt
Guardrails:                ❌ REMOVED — you must add your own
```

**6.4** When to use each mode:

| Mode | Use When | Risk |
|------|----------|------|
| **Append** (default) | Most applications — shape personality, add constraints | Low — guardrails preserved |
| **Replace** | You need complete control over behavior | High — no safety net |

**6.5** If you use replace mode in production, include your own safety instructions:

```typescript
systemMessage: {
  mode: "replace",
  content: `You are a customer support agent for Acme Corp.
Only answer questions about Acme products.
Never reveal internal information.
If asked about competitors, politely decline.
Be professional and concise.`,
},
```

### Key Concept

> 💡 **Replace mode = full power, full responsibility.** When you replace the system prompt, YOU become responsible for safety, appropriate behavior, and guardrails. Most applications should use append mode. Only use replace when you have a specific reason and have added your own safety rules.

> 💡 **Beyond send and sendAndWait.** Starting with SDK v0.1.30, `send()` accepts a `mode` field: `"enqueue"` (default — queues for next turn) and `"immediate"` (steers the current turn). You'll explore these advanced patterns in Level 8.

### ✅ Checkpoint
You understand the critical difference: append adds to guardrails, replace removes them entirely.

---

## Exercise 7: User Input Requests — Let the Agent Ask YOU

### Goal
Configure `onUserInputRequest` so the model can ask the user questions during a conversation — flipping the typical direction of interaction.

### Steps

**7.1** Run the user input request demo:

```bash
npm run input
```

**7.2** Watch what happens: instead of YOU asking the model, the **model asks YOU** a question. You type your answer, and the model continues based on it.

**7.3** Open `user-input-request.ts` and study the handler:

```typescript
const session = await client.createSession({
  model: "gpt-4.1",
  onUserInputRequest: async (request) => {
    // request.question: what the model wants to ask
    // request.choices: optional multiple-choice options
    // request.allowFreeform: whether free text is accepted
    // Note: a second parameter `invocation` is also available with { sessionId }

    const answer = await rl.question(`🤖 Agent asks: ${request.question}\n   > `);
    return { answer: answer.trim(), wasFreeform: true };
  },
  onPermissionRequest: approveAll,
});
```

**7.4** The flow:

```
1. You send: "Give me a personalized study plan. Ask me what I need."
2. Model decides it needs information → calls the built-in ask_user tool
3. SDK invokes YOUR onUserInputRequest handler
4. Handler displays the question and reads your input
5. Handler returns { answer: "your input", wasFreeform: true }
6. Model receives your answer and continues generating
```

**7.5** The `request` object can include choices for multiple-choice:

```typescript
onUserInputRequest: async (request) => {
  if (request.choices && request.choices.length > 0) {
    // Show numbered choices
    request.choices.forEach((choice, i) => console.log(`  ${i + 1}. ${choice}`));
    const answer = await rl.question("Your choice: ");
    return { answer, wasFreeform: false };
  }
  // Freeform
  const answer = await rl.question(`${request.question}\n> `);
  return { answer, wasFreeform: true };
},
```

### Key Concept

> 💡 **`onUserInputRequest` makes conversations bidirectional.** In a normal chat, the user asks and the model answers. With this handler, the model can also ask the user — creating dialog flows like surveys, quizzes, guided wizards, and interactive tutorials. The SDK's built-in `ask_user` tool triggers your handler automatically.

### ✅ Checkpoint
The model asked you a question, you answered, and the model continued with your input. You understand the `request` → `{ answer, wasFreeform }` flow.

---

## Exercise 8: Conversation Commands

### Goal
Implement slash commands that are handled locally — before reaching the model.

### Steps

**8.1** Run the commands demo:

```bash
npm run commands
```

**8.2** Try the slash commands:

```
You: /help
  → Shows available commands (local, not sent to model)

You: /usage
  → Shows token count (local)

You: Hello, what can you help me with?
  → Sent to model, streamed response

You: /exit
  → Exits cleanly
```

**8.3** Open `conversation-commands.ts` and study the command handling:

```typescript
while (true) {
  const input = await rl.question("You: ");
  const trimmed = input.trim();

  // Handle commands locally — don't send to model
  if (trimmed.startsWith("/")) {
    if (cmd === "/help") { showHelp(); }
    else if (cmd === "/usage") { console.log(`Tokens: ${totalTokens}`); }
    else if (cmd === "/exit") { break; }
    continue;  // ← Skip sending to model
  }

  // Regular message — send to model
  await session.sendAndWait({ prompt: trimmed });
}
```

**8.4** The key pattern: **check for commands BEFORE `sendAndWait`**. Commands starting with `/` are handled by your code and never reach the model. Everything else goes to the model.

### Key Concept

> 💡 **Commands are local logic, not model prompts.** Slash commands give users control over the application itself (help, settings, exit) without wasting tokens or confusing the model. Parse them before `sendAndWait` and use `continue` to skip the model call.

### ✅ Checkpoint
`/help` shows the command list without calling the model, and regular messages are sent normally.

---

## Exercise 9: Graceful Shutdown & Signal Handling

### Goal
Handle Ctrl+C (SIGINT) properly so the CLI subprocess is cleaned up and no orphaned processes remain.

### Steps

**9.1** In `conversation-commands.ts`, examine the signal handler:

```typescript
process.on("SIGINT", async () => {
  console.log("\n\n👋 Shutting down gracefully...");
  rl.close();
  await client.stop();
  process.exit(0);
});
```

**9.2** Run `npm run commands` and press **Ctrl+C** at any point. You should see:

```
👋 Shutting down gracefully...
```

**9.3** Why this matters — without the signal handler:
- Ctrl+C kills your Node.js process immediately
- The Copilot CLI subprocess keeps running as an orphan
- Over time, orphaned CLI processes accumulate and consume resources

**9.4** The cleanup order matters:

```typescript
// 1. Close readline (stops stdin reading)
rl.close();

// 2. Stop the CLI subprocess (sends shutdown signal)
await client.stop();

// 3. Exit Node.js
process.exit(0);
```

**9.5** You can also handle `SIGTERM` (sent by process managers like Docker):

```typescript
process.on("SIGTERM", async () => {
  await client.stop();
  process.exit(0);
});
```

### Key Concept

> 💡 **Always handle SIGINT in interactive apps.** Any REPL or long-running SDK application should register a `process.on("SIGINT", ...)` handler that calls `client.stop()`. This is the interactive equivalent of the `try-catch-finally` pattern from Level 1, Exercise 11.

### ✅ Checkpoint
Ctrl+C exits cleanly with a goodbye message and no orphaned processes.

---

## Exercise 10: Token Usage Monitoring Per Turn

### Goal
Display token costs after each turn so users understand the cumulative cost of a conversation.

### Steps

**10.1** In the capstone `study-buddy.ts`, notice the per-turn display:

```
Assistant: (streaming response)
  [187 tokens this turn | Score: 1/2]
```

**10.2** The pattern:

```typescript
let turnTokens = 0;

session.on("assistant.usage", (e) => {
  turnTokens = e.data.inputTokens + e.data.outputTokens;
});

session.on("session.idle", () => {
  console.log(`  [${turnTokens} tokens this turn]`);
});
```

**10.3** Remember from Level 2: **input tokens grow each turn** because the full conversation history is resent. A 10-turn conversation's last turn may use 5–10× more input tokens than the first turn.

**10.4** In production, you might use this for:
- **Budget alerts**: "Warning: 80% of your token budget used"
- **Automatic cutoff**: End conversation after N tokens
- **Cost display**: Show estimated cost per turn in $

### Key Concept

> 💡 **Per-turn monitoring prevents runaway costs.** In an interactive application, users can have long conversations without realizing the growing cost. Displaying token counts after each turn teaches cost awareness and lets you implement budgets.

### ✅ Checkpoint
You see token counts displayed after each turn in the REPL.

---

## Exercise 11: Multiple Tools in Natural Dialog

### Goal
Orchestrate complementary tools that work together naturally during a conversation.

### Steps

**11.1** The `study-buddy.ts` capstone has 4 tools that form a quiz workflow:

| Tool | Purpose | When Called |
|------|---------|-----------|
| `generate_quiz` | Creates a question with choices | User says "quiz me on X" |
| `check_answer` | Records if answer was correct | User provides an answer |
| `get_hint` | Provides a clue without revealing answer | User asks for a hint |
| `get_score` | Returns current quiz score | User asks "what's my score?" |

**11.2** Run `npm run buddy` and try this flow:

```
You: Quiz me on JavaScript
  → Model calls generate_quiz → presents question

You: I think it's D
  → Model calls check_answer → tells you if correct

You: Give me a hint for the next one
  → Model calls get_hint → provides clue

You: /score
  → Local command shows score immediately
```

**11.3** Notice: the model chains tool calls naturally. When you answer a quiz question, the model calls `check_answer`, then might call `generate_quiz` for the next question — all in one turn.

**11.4** The key to good multi-tool orchestration:
- **Each tool has a clear, non-overlapping description**
- **Tools complement each other** (generate → check → hint → score)
- **The system message guides the model** on when/how to use them

### Key Concept

> 💡 **System message + tools = application behavior.** The system message tells the model HOW to use your tools ("when the user answers, call check_answer"). The tools provide WHAT the model can do. Together, they define your application's behavior without traditional if-else logic.

### ✅ Checkpoint
You experienced a multi-tool conversation flow (generate → answer → check → hint → score) driven entirely by the model.

---

## Exercise 12: Capstone: Polished Interactive Assistant

### Goal
Experience the fully integrated Level 4 application — everything from Levels 1–4 combined into a production-quality interactive assistant.

### Steps

**12.1** Run the study buddy capstone:

```bash
npm run buddy
```

**12.2** Explore all the features:

```
You: /help              → Slash commands
You: Quiz me on science → Tools + streaming
(Answer the question)   → check_answer tool
You: Give me a hint     → get_hint tool
You: /score             → Local score display
(Press Ctrl+C)          → Graceful shutdown with final score
```

**12.3** Open `study-buddy.ts` and identify every Level 1–4 concept:

| Concept | Level | Where in Code |
|---------|:-----:|--------------|
| CopilotClient + session | L1 | Client/session creation |
| `client.stop()` + `process.exit(0)` | L1 | Cleanup |
| Streaming events | L2 | `message_delta` + `session.idle` |
| Token usage tracking | L2 | `assistant.usage` handler |
| Custom tools (4 of them) | L3 | `defineTool` definitions |
| Tool orchestration | L3 | Model chains tool calls |
| REPL loop | L4 | `while (true)` + `rl.question` |
| System message (append) | L4 | Quiz master personality |
| `onUserInputRequest` | L4 | Agent asks user questions |
| Slash commands | L4 | `/help`, `/score`, `/topic`, `/exit` |
| Signal handling | L4 | `process.on("SIGINT", ...)` |

**12.4** Reflect: you've gone from "print 4" (Level 1) to a fully interactive, multi-tool, personality-customized, agent-driven application in 4 levels.

### Key Concept

> 💡 **This is the SDK's sweet spot.** The combination of streaming + tools + system messages + user input requests creates applications that feel alive — the model decides when to call tools, asks for clarification when needed, and maintains a consistent personality throughout. Every real SDK application builds on this foundation.

### ✅ Checkpoint
You ran the study buddy, used all features (tools, commands, agent questions, streaming), and can identify which level each concept comes from.

---

## Self-Assessment

Rate yourself 1–3 on each skill:

| # | Skill | 1 | 2 | 3 |
|---|-------|---|---|---|
| 1 | I can build a REPL loop with `readline/promises` | ☐ | ☐ | ☐ |
| 2 | I can add streaming to an interactive conversation | ☐ | ☐ | ☐ |
| 3 | I can integrate tools into a REPL | ☐ | ☐ | ☐ |
| 4 | I can explain how multi-turn memory works | ☐ | ☐ | ☐ |
| 5 | I can use `systemMessage` in append mode | ☐ | ☐ | ☐ |
| 6 | I can explain the tradeoff of replace mode | ☐ | ☐ | ☐ |
| 7 | I can configure `onUserInputRequest` | ☐ | ☐ | ☐ |
| 8 | I can implement slash commands parsed before `sendAndWait` | ☐ | ☐ | ☐ |
| 9 | I can handle SIGINT for graceful shutdown | ☐ | ☐ | ☐ |
| 10 | I can display per-turn token usage | ☐ | ☐ | ☐ |
| 11 | I can orchestrate multiple complementary tools | ☐ | ☐ | ☐ |
| 12 | I can build a polished interactive assistant | ☐ | ☐ | ☐ |

**Scoring:**
```
1 = I need to revisit this
2 = I can do this with reference
3 = I can do this from memory

Score: __/36
  30+ (≥ 83%) → Proceed to Level 5 ✅
  24-29 (67-80%) → Review weak areas, then proceed
  < 24 (< 67%) → Repeat key exercises before continuing
```

---

## What's Next?

In **[Level 5: Hooks](../level-5/README.md)**, you'll learn to intercept and control every stage of the SDK's agent loop. You'll master all 6 hook types — from blocking dangerous tools with `onPreToolUse` to building full audit trails with combined hooks — and build a security-aware coding assistant.
