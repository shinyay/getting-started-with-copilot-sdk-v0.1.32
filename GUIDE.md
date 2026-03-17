# GitHub Copilot SDK — The Conceptual Guide

> A deep, from-first-principles guide to understanding GitHub Copilot SDK: its architecture, design philosophy, and the patterns that separate demos from production-ready AI applications.

---

## Who This Guide Is For

You're a developer who wants to **build real products** with GitHub Copilot SDK — not just run the getting-started example. You've seen the API surface (`createSession`, `defineTool`, `sendAndWait`) and it looks simple enough. But then the questions start:

- *Why does the SDK spawn a separate CLI process instead of calling the model directly?*
- *What happens when the model calls three tools in parallel — is my handler thread-safe?*
- *The defaults allow the agent to run shell commands — how do I make this safe for production?*
- *BYOK says "Azure" but there are two different `type` values — which one do I use?*
- *What does "infinite sessions" actually mean, and what's in those checkpoint files?*

This guide answers those questions.

## How This Guide Relates to the Workshop

This repository contains two complementary learning paths:

| | **Workshop** (`workshop/`) | **This Guide** (`GUIDE.md`) |
|---|---|---|
| **Style** | Hands-on exercises (96 total) | Conceptual explanations |
| **Approach** | "Build it, then understand it" | "Understand it, then build it right" |
| **Scope** | TypeScript-focused, one concept per exercise | Cross-language, connecting concepts together |
| **Goal** | Learn the API | Learn the design philosophy |

**They're designed to be used together.** Each chapter in this guide links to the specific workshop exercises where you can practice the concept hands-on. Each workshop level links back to the relevant guide chapters for deeper understanding.

You can read them in either order:
- **Workshop-first**: Do the exercises, then read the guide to understand *why* things work the way they do.
- **Guide-first**: Read the concepts, then do the exercises to build muscle memory.

## How to Read This Guide

The guide is organized into **5 parts** and **15 chapters** that build on each other:

- **Part I (Chapters 1–3)**: Read this first. It establishes the mental models everything else depends on.
- **Part II (Chapters 4–6)**: Read when you're building your first real application.
- **Part III (Chapters 7–8)**: Read before you deploy anything to users.
- **Part IV (Chapters 9–12)**: Reference material — read the chapters relevant to your setup.
- **Part V (Chapters 13–15)**: Read when you're designing system architecture or evaluating the SDK.

Each chapter follows a consistent structure:
1. **The concept** explained from first principles
2. **Code examples** (TypeScript primary, cross-language notes where patterns differ)
3. **Design implications** for real products
4. **Gotchas** that will bite you if you don't know about them
5. **Workshop links** to hands-on exercises

---

## Table of Contents

### Part I: Foundations

- [Chapter 1: What Is Copilot SDK?](#chapter-1-what-is-copilot-sdk) — The problem it solves, agent runtime vs model SDK
- [Chapter 2: Architecture](#chapter-2-architecture) — Client → JSON-RPC → CLI → Provider, deployment topology
- [Chapter 3: Core Primitives](#chapter-3-core-primitives) — Client, Session, Events, reasoningEffort, system messages, image attachments

### Part II: Building with the SDK

- [Chapter 4: Events & Streaming](#chapter-4-events--streaming) — Deltas, ordering, reasoning tokens
- [Chapter 5: Custom Tools](#chapter-5-custom-tools) — Strategic differentiator, definition, results, lifecycle, concurrency
- [Chapter 6: Human-in-the-Loop](#chapter-6-human-in-the-loop) — `ask_user` as a workflow pattern

### Part III: Control & Safety

- [Chapter 7: Session Hooks — The Programmable Policy Engine](#chapter-7-session-hooks--the-programmable-policy-engine) — Intercept, govern, customize (SDK vs repo hooks)
- [Chapter 8: Security & Permissions](#chapter-8-security--permissions) — CLI trust model, path/URL/tool permissions, `--allow-all` decomposition, SDK hooks

### Part IV: Infrastructure

- [Chapter 9: Authentication — The Full Matrix](#chapter-9-authentication--the-full-matrix) — 6 auth methods, priority order, debugging
- [Chapter 10: BYOK Deep Dive](#chapter-10-byok-deep-dive) — Providers, `wireApi`, Azure gotcha, credential rotation
- [Chapter 11: Session Management](#chapter-11-session-management) — Persistence, discovery, cleanup, infinite sessions, workspace artifacts
- [Chapter 12: MCP, Custom Agents & Skills](#chapter-12-mcp-custom-agents--skills) — MCP (local, remote, permissions, debugging), custom agent personas, reusable skill directories

### Part V: Mastery

- [Chapter 13: Production Patterns](#chapter-13-production-patterns) — 11 patterns including CI/automation (K) and enterprise governance (H–J)
- [Chapter 14: Gotchas & Pitfalls](#chapter-14-gotchas--pitfalls) — Cross-cutting reference by language
- [Chapter 15: What Makes It Different](#chapter-15-what-makes-it-different) — vs. other agent frameworks, community SDKs, 5 tradeoffs

### Appendix

- [Workshop Cross-Reference Map](#appendix-workshop-cross-reference-map) — Every guide concept → workshop exercises

---

<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- PART I: FOUNDATIONS                                                -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

# Part I: Foundations

---

## Chapter 1: What Is Copilot SDK?

### The One-Sentence Answer

GitHub Copilot SDK is a **programmable wrapper around the Copilot CLI agent runtime** — it lets you embed the same agentic engine that powers Copilot CLI into your own applications, across TypeScript, Python, Go, and .NET.

### Why That Distinction Matters: "Agent Runtime" vs "Model SDK"

Most LLM SDKs work like this:

```
Your code → HTTP request → Model API → Response text
```

You send a prompt, you get text back. Simple. If you want tool calling, you build the loop yourself: parse the model's tool-call response, execute the function, send the result back, repeat.

Copilot SDK works fundamentally differently:

```
Your code → SDK Client → JSON-RPC → Copilot CLI agent → (plan → tool calls → file edits → more tool calls → response)
```

You send a prompt and the **agent runtime takes over**. It may:
1. Analyze the request and create an internal plan
2. Decide which tools to call (yours, built-in, or MCP)
3. Execute those tools (possibly in parallel)
4. Read the results and decide what to do next
5. Call more tools, ask the user a question, or produce a final response

You don't orchestrate this loop — the runtime does. Your job is to:
- **Define the tools** the agent can use
- **Set the policies** (what's allowed, what needs approval)
- **React to events** (streaming output, tool executions, completion)

This is the core mental shift. You're not calling a model; you're **configuring and supervising an agent**.

### The Agent Loop Visualized

```
┌─────────────────────────────────────────────────┐
│                  Your Application                │
│                                                  │
│  1. Create client + session                      │
│  2. Define tools, hooks, policies                │
│  3. Send prompt                                  │
│  4. React to events (streaming, tool calls)      │
│  5. Agent reaches session.idle → done            │
└──────────────────────┬──────────────────────────┘
                       │ JSON-RPC (stdio or TCP)
┌──────────────────────▼──────────────────────────┐
│              Copilot CLI (server mode)           │
│                                                  │
│  • Receives prompt                               │
│  • Plans actions                                 │
│  • Invokes tools (built-in + your custom tools)  │
│  • Manages context window                        │
│  • Handles compaction for long sessions          │
│  • Routes to model provider                      │
└──────────────────────┬──────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────┐
│          Model Provider (GitHub / BYOK)          │
│  GPT-4.1, GPT-5, Claude, Ollama, etc.           │
└─────────────────────────────────────────────────┘
```

### Technical Preview — What That Means for You

GitHub marks the Copilot SDK as **Technical Preview**. Practically, this means:

- **APIs may change** between releases — pin your SDK version
- **Behaviors may shift** — the agent's planning and tool selection can evolve with CLI updates
- **Not all features are guaranteed stable** — especially newer ones like `wireApi: "responses"`

**Architectural implication:** Design your application with an abstraction layer between your business logic and the SDK. Don't spread `session.on("assistant.message_delta", ...)` across 50 files — centralize your SDK interaction so you can adapt to API changes in one place.

### The Problem It Solves

Before reaching for the SDK, understand the specific engineering problems it eliminates. If you build agentic workflows yourself, you must solve **all six** of these challenges before you even get to your product logic:

1. **Managing context across turns** — tracking conversation history, token counts, and when to summarize/compact so you don't exceed context limits
2. **Orchestrating tool execution** — parsing the model's tool-call responses, executing handlers, sending results back, handling parallel calls, managing timeouts
3. **Multi-step planning and execution** — the model often needs to break a task into steps, execute them sequentially, adapt the plan based on results, and recover from failures
4. **Routing between models and providers** — abstracting over different API shapes (OpenAI, Azure, Anthropic), streaming protocols, and tool-calling formats
5. **Integrating external tool ecosystems** — connecting MCP servers, managing their lifecycles, discovering tools at runtime, handling permissions
6. **Safety boundaries and failure modes** — deciding what the agent is allowed to do, requiring human approval for risky actions, handling crashes, rate limits, and malformed outputs

The SDK's thesis is: **building that platform yourself is the hard part; the SDK gives you the platform primitive.** You supply domain constraints and tools; Copilot supplies the planning engine, tool loop, session semantics, and infrastructure.

### What You Get "For Free"

By using the SDK instead of building your own agent loop, you inherit:

| Capability | You'd otherwise need to… |
|---|---|
| Planning and multi-step execution | Build a ReAct/plan-and-execute loop |
| Tool invocation with retry logic | Parse function-call responses, handle errors |
| Context window management (compaction) | Track token counts, summarize history |
| Session persistence and resume | Serialize/deserialize conversation state |
| File edit semantics | Build diff/patch/apply logic |
| Multi-model support | Abstract over provider-specific APIs |
| Streaming with proper event ordering | Handle SSE/WebSocket chunking |

This is significant. The agent runtime is the same one running in production behind Copilot CLI — it's not a toy.

> 🔗 **Workshop**: [Level 1 — Connect](workshop/level-1/README.md) teaches the basic client → session → send/receive flow.

---

## Chapter 2: Architecture

### The Full Picture

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ Your App     │      │ Copilot CLI  │      │ Model API    │
│              │◄────►│ (subprocess) │◄────►│ (HTTPS)      │
│ SDK Client   │JSON  │              │      │              │
│ + Session(s) │-RPC  │ Agent loop   │      │ GPT / Claude │
│ + Tools      │stdio │ Tool exec    │      │ / Ollama     │
│ + Hooks      │ or   │ Compaction   │      │              │
│              │TCP   │ Persistence  │      │              │
└──────────────┘      └──────────────┘      └──────────────┘
```

There are **three distinct processes** in play, and understanding the boundary between them is critical:

### Layer 1: Your Application (SDK Client)

This is your code. The SDK client:
- **Spawns** the Copilot CLI as a child process (default: stdio transport)
- **Sends** messages via JSON-RPC
- **Receives** events (streaming deltas, tool invocations, completion signals)
- **Executes** your custom tool handlers when the agent calls them
- **Applies** your hooks (pre/post tool, prompt modification, error handling)

The SDK is a **thin coordination layer** — it doesn't contain the agent logic itself.

### Layer 2: Copilot CLI (Agent Runtime)

The CLI process is where the real work happens:
- **Agent loop**: planning, tool selection, multi-step execution
- **Built-in tools**: file read/write, shell execution, Git operations, web search
- **Context management**: tracking token usage, compacting history
- **Session state**: persistence to disk, checkpoint creation
- **Model routing**: forwarding prompts to the configured provider

The CLI is a **standalone binary** — it can run independently (`copilot --headless`), and the SDK talks to it via protocol, not library linking.

### Layer 3: Model Provider

The actual LLM that generates responses and decides tool calls:
- **GitHub-hosted** (default): GPT-4.1, GPT-5, Claude, etc. — requires Copilot subscription
- **BYOK**: Your own OpenAI / Azure / Anthropic / Ollama endpoint — requires API key

### Two Connection Modes

#### Mode A: Subprocess (Default — Recommended)

```typescript
const client = new CopilotClient();  // spawns CLI automatically
```

The SDK starts the CLI as a child process, communicating over **stdio**. This is:
- **Simplest** to set up (zero configuration)
- **Lifecycle-managed** — SDK starts/stops the CLI
- **Isolated** — one CLI per client instance

#### Mode B: External Server

```typescript
const client = new CopilotClient({ cliUrl: "http://localhost:4321" });
```

You run the CLI separately: `copilot --headless --port 4321`, then point the SDK at it. This is useful when:
- **Debugging**: You can inspect CLI logs independently
- **Sharing**: Multiple SDK clients connect to one CLI process
- **Performance**: Avoid subprocess startup cost for short-lived operations
- **Architecture**: Separate "agent backend" from "UI frontend"

> **Go note:** The Go SDK additionally supports TCP transport and has a unique **embedded CLI bundler** — you can compile the CLI binary into your Go application so users don't need to install it separately.

### Two Provider Modes

#### Normal Mode (GitHub-Hosted Models)

```typescript
const session = await client.createSession({
    model: "gpt-4.1",
    onPermissionRequest: approveAll,
});
```

- Requires a **GitHub Copilot subscription** (free tier available)
- Prompts count toward the **premium request quota**
- Model selection includes GitHub's catalog (GPT-4.1, GPT-5, Claude, etc.)
- Authentication via GitHub credentials (multiple methods — see [Chapter 9](#chapter-9-authentication--the-full-matrix))

#### BYOK Mode (Bring Your Own Key)

```typescript
const session = await client.createSession({
    model: "gpt-4",
    provider: { type: "openai", baseUrl: "https://api.openai.com/v1", apiKey: "sk-..." },
    onPermissionRequest: approveAll,
});
```

- **No Copilot subscription required** — you pay the provider directly
- You still need a GitHub token for CLI initialization (but model calls go to your provider)
- Supports OpenAI, Azure, Anthropic, and any OpenAI-compatible endpoint (Ollama, vLLM, etc.)
- **Critical limitation**: static API keys only — no Entra ID, no managed identities, no token refresh

See [Chapter 10](#chapter-10-byok-deep-dive) for the full BYOK deep dive including the Azure endpoint gotcha.

### Why a Subprocess? (Design Rationale)

You might wonder: *why not just embed the agent logic as a library?* The subprocess architecture has specific advantages:

1. **Language independence**: One CLI binary serves all four SDK languages identically
2. **Update independence and automatic parity**: When the CLI is updated, your application automatically inherits improvements — better planning algorithms, new built-in tools, improved compaction strategies, bug fixes — without any code changes on your part. This is a key architectural benefit: the runtime evolves independently of your application.
3. **Crash isolation**: If the agent runtime crashes, your app process survives
4. **Security boundary**: The CLI runs with its own permissions; your app can run with different ones
5. **Resource isolation**: The CLI's memory/CPU usage doesn't compete with your app's event loop

The tradeoff: you now have a **deployment dependency** (the CLI binary must be present), and there's **IPC overhead** (though JSON-RPC over stdio is fast for this use case).

### Deployment Topology Considerations

The SDK architecture has an important implication for deployment: **it's inherently stateful**. The CLI subprocess maintains session state on disk (`~/.copilot/session-state/{sessionId}/`), uses the local filesystem for workspace artifacts, and expects a long-lived process.

This means the SDK is **not a natural fit for serverless/Lambda-style deployments** where processes are ephemeral and stateless. Practical deployment options include:

| Deployment Shape | Approach | Tradeoffs |
|---|---|---|
| **Long-lived container** | Run CLI subprocess alongside your app in a container (Docker, Kubernetes pod) | Simple; requires persistent volume for session state |
| **External CLI server** | Run `copilot --headless --port 4321` as a separate service; SDK connects via TCP | Decouples lifecycle; good for multi-client architectures |
| **Session persistence across restarts** | Use `sessionId` to resume sessions after container restarts | Requires persistent storage; not all state survives |
| **Go embedded CLI** | Bundle CLI binary into your Go app via `go tool bundler` | Zero deployment dependency; Go only |

For enterprise architectures, the "external CLI server" mode is often the best fit — it lets you manage the CLI as infrastructure (monitored, scaled, updated independently) while your SDK clients remain lightweight.

> 🔗 **Workshop**: [Level 1](workshop/level-1/README.md) exercises 1–3 cover client creation; [Level 7](workshop/level-7/README.md) exercise 10 covers external CLI server mode.

---

## Chapter 3: Core Primitives

Everything in the Copilot SDK revolves around three concepts: **Client**, **Session**, and **Events**. Master these and the rest of the SDK is variations on a theme.

### 3.1 Client

A **Client** owns the connection to the Copilot CLI process. It's the entry point for everything.

```typescript
import { CopilotClient, approveAll } from "@github/copilot-sdk";

// Minimal — auto-spawns CLI, auto-starts
const client = new CopilotClient();
```

```typescript
// Full control — configure connection, auth, and logging
const configuredClient = new CopilotClient({
    logLevel: "debug",       // see JSON-RPC traffic
    cliPath: "/usr/local/bin/copilot",  // custom CLI location
    cliUrl: "http://localhost:4321",    // connect to external CLI
    githubToken: process.env.MY_TOKEN,  // explicit auth
    useLoggedInUser: false,  // don't use stored OAuth
});
```

**Client lifecycle rules:**
1. **One client = one CLI connection.** Create multiple clients only if you need multiple CLI processes.
2. **Always call `client.stop()`** when done. Failing to do so **orphans the CLI process** — it keeps running in the background consuming resources.
3. **In Node.js, call `process.exit(0)` after `stop()`** — the event loop may hang otherwise.

**Cross-language equivalents:**

| Operation | TypeScript | Python | Go | .NET |
|---|---|---|---|---|
| Create | `new CopilotClient()` | `CopilotClient()` | `copilot.NewClient(nil)` | `new CopilotClient()` |
| Start | auto | `await client.start()` | `client.Start(ctx)` | auto |
| Stop | `await client.stop()` | `await client.stop()` | `defer client.Stop()` | `await using` (auto) |

> **Python note:** Python requires an explicit `await client.start()` call. The entire SDK is async — always use `asyncio.run(main())`.
>
> **.NET note:** Use `await using var client = new CopilotClient()` for automatic disposal. The `using` pattern calls stop on scope exit.
>
> **Go note:** Use `defer client.Stop()` immediately after `Start` to ensure cleanup.

### 3.2 Session

A **Session** is an ongoing agent conversation — think of it as one "thread" with its own memory, tool context, and workspace state. You can have multiple sessions per client.

```typescript
const session = await client.createSession({
    model: "gpt-4.1",           // required
    streaming: true,             // enable token-by-token output
    tools: [myTool],             // your custom tools
    hooks: { onPreToolUse },     // policy hooks
    mcpServers: { /* ... */ },   // external tool providers
    systemMessage: { content: "You are a code reviewer." },
    reasoningEffort: "medium",   // low | medium | high | xhigh (model-dependent)
    onPermissionRequest: approveAll,
});
```

#### `reasoningEffort` — The Cost/Quality Knob

Some models support a `reasoningEffort` parameter that controls how much "thinking" the model does before responding:

| Value | Behavior | Use Case |
|---|---|---|
| `"low"` | Minimal reasoning, fastest responses | Simple lookups, formatting tasks |
| `"medium"` | Balanced reasoning (default for most models) | General-purpose interactions |
| `"high"` | Extended reasoning, more thorough | Complex code analysis, debugging |
| `"xhigh"` | Maximum reasoning depth | Architecture decisions, security audits |

```typescript
// Quick classification task — don't need deep reasoning
const triageSession = await client.createSession({
    model: "gpt-4.1",
    reasoningEffort: "low",
    onPermissionRequest: approveAll,
});

// Security audit — want maximum thinking depth
const auditSession = await client.createSession({
    model: "gpt-4.1",
    reasoningEffort: "xhigh",
    onPermissionRequest: approveAll,
});
```

> **Note:** Not all models support this parameter. If the model ignores it, behavior is unchanged. This is a cost/quality tradeoff — higher reasoning effort uses more tokens.

#### System Message — How It Really Works

The SDK's system message handling is more nuanced than "set a system prompt." Understanding the internals helps you use it effectively:

**Default behavior (append mode):** The SDK auto-injects several system message sections:
1. **Environment context** — working directory, OS, available tools
2. **Tool instructions** — schemas and usage guidelines for registered tools
3. **Security guardrails** — safety boundaries and responsible use policies
4. **Your custom content** — appended *after* all of the above

```typescript
// Your content is APPENDED after SDK-managed sections
const session = await client.createSession({
    model: "gpt-4.1",
    systemMessage: {
        content: "Always respond in JSON format. Follow our team's coding standards.",
    },
    onPermissionRequest: approveAll,
});
```

**Replace mode (use with care):** You can replace the entire system prompt, but this **removes all SDK guardrails**:

```typescript
// REPLACES everything — including safety boundaries
const session = await client.createSession({
    model: "gpt-4.1",
    systemMessage: {
        mode: "replace",
        content: "You are a helpful assistant for our engineering team.",
    },
    onPermissionRequest: approveAll,
});
```

> ⚠️ **Replace mode strips all built-in guardrails.** Only use this if you're providing your own comprehensive system prompt that includes appropriate safety boundaries. For most applications, append mode (the default) is the right choice.

#### Image Attachments

The SDK supports multimodal interactions — you can send images for the model to analyze:

```typescript
await session.send({
    prompt: "What's in this image?",
    attachments: [{ type: "file", path: "/path/to/screenshot.png" }],
});
```

The agent's built-in `view` tool can also read images from the filesystem, so the agent may read images on its own during tool execution without explicit attachments.

**Key session operations:**

| Operation | What It Does |
|---|---|
| `sendAndWait(opts)` | Send a message, block until the agent is idle |
| `send(opts)` | Send a message, return immediately (use events for output) |
| `setModel(model)` | Switch the model mid-session without creating a new session |
| `abort()` | Cancel in-flight work |
| `getMessages()` | Read conversation history |
| `destroy()` | End the session permanently |

**`sendAndWait` vs `send` — When to use which:**

- **`sendAndWait`**: Best for scripts, CLI tools, and simple request-response flows. It blocks until the agent finishes all tool calls and produces a final response.
- **`send`**: Best for UIs and streaming applications. It returns immediately; you handle output via event listeners. This gives you real-time feedback as the agent works.

**`send()` delivery modes:** The `send()` method supports a `mode` option that controls how messages are delivered:
- **`mode: "immediate"`** (Steering) — Interrupts the agent mid-work. Use when the user wants to redirect the agent while it's still processing (e.g., "stop, do this instead").
- **`mode: "enqueue"`** (Queueing) — Queues the message until the agent is idle. Use when you want to line up the next task without interrupting current work.

```typescript
// Pattern A: Simple script — sendAndWait
const response = await session.sendAndWait({ prompt: "What is 2 + 2?" });
console.log(response?.data.content);

// Pattern B: Streaming UI — send + events
session.on("assistant.message_delta", (e) => renderDelta(e.data.deltaContent));
session.on("session.idle", () => showComplete());
await session.send({ prompt: "Explain this codebase" });
```

**Multiple sessions — independent conversations:**

```typescript
const codeSession = await client.createSession({
    model: "gpt-4.1",
    onPermissionRequest: approveAll,
});
const testSession = await client.createSession({
    model: "gpt-4.1",
    onPermissionRequest: approveAll,
});
// These are fully independent — different history, different tool context
await Promise.all([
    codeSession.sendAndWait({ prompt: "Write a function to sort users" }),
    testSession.sendAndWait({ prompt: "Write tests for the user sort function" }),
]);
```

### 3.3 Events — The Real Output Channel

This is the most important concept to internalize: **events are the primary output mechanism**, not return values.

When you call `send()` or `sendAndWait()`, the agent emits a stream of events representing everything that happens:

```
User sends prompt
  → assistant.message_delta (streaming token)
  → assistant.message_delta (streaming token)
  → assistant.message_delta (streaming token)
  → tool.execution_start (agent decides to call a tool)
  → tool.execution_complete (tool returns result)
  → assistant.message_delta (agent continues with tool result)
  → assistant.message (final complete response)
  → assistant.usage (token counts)
  → session.idle (agent is done — safe to send next message)
```

**Core event taxonomy:**

| Event | When It Fires | What's In It |
|---|---|---|
| `assistant.message_delta` | Each streaming token | `deltaContent` (incremental text) |
| `assistant.message` | Complete response ready | `content` (full text) |
| `assistant.reasoning_delta` | Each reasoning token (model-dependent) | `deltaContent` (thinking text) |
| `assistant.reasoning` | Complete reasoning (model-dependent) | `content` (full reasoning) |
| `assistant.usage` | After response | `inputTokens`, `outputTokens` |
| `session.idle` | Agent finished all work | (none — it's a signal) |
| `tool.execution_error` | A tool handler threw | Error details |
| `session.compaction_start` | Context being compacted | (none) |
| `session.compaction_complete` | Compaction finished | (none) |

**The `session.idle` event is your "turn finished" signal.** Don't rely solely on `assistant.message` — the agent may call multiple tools and produce multiple messages before it's truly done. `session.idle` means: "I have nothing left to do; it's your turn."

**Subscribing to events:**

```typescript
// TypeScript — typed event handlers
session.on("assistant.message_delta", (event) => {
    process.stdout.write(event.data.deltaContent);  // type-safe
});
session.on("session.idle", () => {
    console.log("\n[Agent idle]");
});
```

```python
# Python — enum-based matching
from copilot import PermissionHandler
from copilot.generated.session_events import SessionEventType

def handle(event):
    if event.type == SessionEventType.ASSISTANT_MESSAGE_DELTA:
        sys.stdout.write(event.data.delta_content)
    elif event.type == SessionEventType.SESSION_IDLE:
        print()

session.on(handle)
```

```go
// Go — string-based matching with nil checks
session.On(func(event copilot.SessionEvent) {
    if event.Type == "assistant.message_delta" && event.Data.DeltaContent != nil {
        fmt.Print(*event.Data.DeltaContent)  // pointer — must nil-check
    }
})
```

**Design implication:** If you're building a UI (terminal, web, desktop), treat the SDK as an **event-driven system**. Your architecture should be:
1. Send a prompt (fire-and-forget)
2. React to events (update UI, log, apply policies)
3. Wait for `session.idle` (re-enable input)

This is the right mental model for real applications. "Send prompt, get response string" is a simplification that breaks down as soon as the agent uses tools.

> 🔗 **Workshop**: [Level 1](workshop/level-1/README.md) covers basic send/receive; [Level 2](workshop/level-2/README.md) teaches streaming events in depth; [Level 8](workshop/level-8/README.md) exercises 5–6 cover reasoning events.

---

<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- PART II: BUILDING WITH THE SDK                                    -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

# Part II: Building with the SDK

---

## Chapter 4: Events & Streaming

### Beyond `console.log(response)`

Chapter 3 introduced events as the SDK's output mechanism. This chapter goes deeper: how streaming actually works, what ordering guarantees you get, and how to handle the less obvious event types.

### Delta Events vs Final Events

When streaming is enabled, you get **two representations** of the same content:

```
assistant.message_delta { deltaContent: "The " }
assistant.message_delta { deltaContent: "answer " }
assistant.message_delta { deltaContent: "is " }
assistant.message_delta { deltaContent: "4." }
assistant.message       { content: "The answer is 4." }
```

**Key rules:**
1. **Deltas arrive incrementally** — each contains a fragment of the response
2. **The final event contains the complete text** — you don't need to concatenate deltas yourself (unless you want real-time rendering)
3. **If streaming is disabled**, you only get `assistant.message` with the complete text (no deltas)
4. **Deltas use `process.stdout.write()`** (not `console.log()`) to avoid extra newlines between fragments

### Event Ordering Guarantees

The event stream follows a predictable pattern for each "turn":

```
1. assistant.message_delta(s)     ← streaming tokens (if the agent responds with text)
2. assistant.message              ← complete response
3. assistant.usage                ← token counts for this turn
4. [tool execution if needed]     ← the agent may decide to call tools
5. [more deltas/messages]         ← after tool results, the agent continues
6. session.idle                   ← everything is done
```

**The critical insight**: The agent may produce **multiple message/tool cycles** before reaching `session.idle`. A single prompt might trigger:

```
prompt → response fragment → tool call → tool result → another response → another tool call → final response → idle
```

If you're building a UI, you need to handle this loop, not just "one delta stream → done."

### Reasoning Events

Some models emit "reasoning" or "chain-of-thought" tokens — the model's internal thinking process before producing the visible response:

```typescript
session.on("assistant.reasoning_delta", (e) => {
    // Streaming reasoning tokens — model is "thinking"
    renderThinking(e.data.deltaContent);
});
session.on("assistant.reasoning", (e) => {
    // Complete reasoning text
    logReasoning(e.data.content);
});
```

**Important caveats:**
- Reasoning events are **model-dependent** — not all models emit them
- The content may contain **sensitive intermediate thinking** that you shouldn't expose to end users without review
- Reasoning tokens **count toward token usage** but aren't part of the visible response

### Token Usage Tracking

Every turn emits a `assistant.usage` event with token counts:

```typescript
session.on("assistant.usage", (event) => {
    console.log(`Input: ${event.data.inputTokens}, Output: ${event.data.outputTokens}`);
});
```

**Production uses:**
- **Cost tracking**: Calculate per-session and per-user costs
- **Quota enforcement**: Warn users approaching limits
- **Optimization signals**: If input tokens are consistently high, your context might be bloated

### Practical Streaming Patterns

#### Pattern 1: Terminal Output (Simple)

```typescript
session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("session.idle", () => console.log());  // newline when done
```

#### Pattern 2: Web UI (Buffer + Render)

```typescript
let currentMessage = "";
session.on("assistant.message_delta", (e) => {
    currentMessage += e.data.deltaContent;
    websocket.send(JSON.stringify({ type: "delta", content: currentMessage }));
});
session.on("session.idle", () => {
    websocket.send(JSON.stringify({ type: "complete" }));
    currentMessage = "";
});
```

#### Pattern 3: Logging + Telemetry (Final Events Only)

```typescript
session.on("assistant.message", (e) => {
    logger.info("Response", { content: e.data.content, sessionId });
});
session.on("assistant.usage", (e) => {
    metrics.recordTokens(e.data.inputTokens, e.data.outputTokens);
});
```

### Gotchas

- **Don't assume one delta stream per prompt.** The agent may interleave tool calls between response fragments.
- **Go: `DeltaContent` is a `*string` pointer.** Always nil-check before dereferencing: `if event.Data.DeltaContent != nil { fmt.Print(*event.Data.DeltaContent) }`.
- **Python: use `sys.stdout.write()` + `sys.stdout.flush()`** for real-time streaming. `print()` adds newlines and may buffer.
- **Reasoning events may not appear** even if you subscribe to them — it depends on the model.

> 🔗 **Workshop**: [Level 2](workshop/level-2/README.md) teaches streaming in depth (exercises 1–12); [Level 8](workshop/level-8/README.md) exercises 5–6 cover reasoning events.

---

## Chapter 5: Custom Tools

### Why Tools Are Your Strategic Differentiator

Here's an insight that's easy to miss: **the LLM is commodity; your tools are your moat.** Every company using Copilot SDK (or any agent framework) has access to the same models. What makes your agent application uniquely valuable is the tools you expose — your ticketing system, your CMDB, your build pipeline, your internal APIs, your domain-specific logic.

The SDK's job is to make the "agent calls tools → reads results → continues reasoning → calls more tools" loop a solved primitive, so you can focus entirely on **designing the right tools for your domain.** The quality of your tools — their specificity, their descriptions, their error handling — directly determines how useful the agent is to your users.

This is why tools are the core chapter, not streaming or hooks. Get tools right and the agent becomes powerful; get them wrong and no amount of prompt engineering will save it.

### The Core Power of the SDK

Custom tools are the mechanism by which the agent calls **your code**. You define a function with a name, description, and parameter schema; the model decides *when* to call it based on the description and the user's request.

This is the SDK's killer feature: it transforms a language model from "text generator" into "orchestrator that can take actions in your systems."

### Anatomy of a Tool

Every tool has four parts (plus optional flags):

```typescript
const getCustomer = defineTool("get_customer", {
    // 1. NAME: How the model references it (snake_case convention)
    // 2. DESCRIPTION: How the model decides WHEN to call it
    description: "Look up a customer by their ID. Returns name, email, and plan tier.",

    // 3. PARAMETERS: What the model must provide (JSON Schema)
    parameters: {
        type: "object",
        properties: {
            customerId: { type: "string", description: "The customer's unique ID (e.g., 'cust_abc123')" },
        },
        required: ["customerId"],
    },

    // 4. HANDLER: What runs when the model calls the tool
    handler: async (args: { customerId: string }) => {
        const customer = await db.customers.findById(args.customerId);
        return { name: customer.name, email: customer.email, plan: customer.plan };
    },

    // 5. (Optional) OVERRIDES BUILT-IN: Replace a built-in tool with your version
    // overridesBuiltInTool: true,
});
```

> 💡 **`overridesBuiltInTool: true`** — Set this flag when your custom tool should replace a built-in tool of the same name. For example, you might override the built-in `read` tool to add access control or logging. Without this flag, the SDK raises an error if your tool name collides with a built-in.

**The description matters enormously.** The model uses it to decide *when* to call your tool. A vague description ("Does stuff with customers") means the model won't know when to use it. A specific description ("Look up a customer by their ID. Returns name, email, and plan tier.") gives the model clear signal.

### Tool Definition Across Languages

| Language | API | Parameter Schema |
|---|---|---|
| TypeScript | `defineTool("name", { description, parameters, handler })` | JSON Schema object **or** Zod schema |
| Python | `@define_tool(description="...")` decorator | Pydantic `BaseModel` with `Field(description="...")` |
| Go | `DefineTool("name", "description", func)` | Struct with `json` + `jsonschema` tags |
| .NET | `AIFunctionFactory.Create(func, "name", "description")` | `[Description]` attributes on parameters |

**TypeScript with Zod** (type-safe alternative to raw JSON Schema):

```typescript
import { z } from "zod";

const getCustomer = defineTool("get_customer", {
    description: "Look up a customer by their ID",
    parameters: z.object({
        customerId: z.string().describe("The customer's unique ID"),
    }),
    handler: async (args) => {
        // args is typed as { customerId: string } automatically
        return { name: "Alice", plan: "pro" };
    },
});
```

### The Two-Output Mental Model

When a tool returns a result, there are actually **two audiences** for that result:

1. **The model** — It reads the result to decide what to do next (continue, call another tool, respond to the user)
2. **Your application** — You may want to log, audit, or display the result differently

Most of the time, returning a simple JSON-serializable object serves both audiences. But for advanced cases, some SDKs support richer result objects:

```typescript
// Simple (works for both audiences)
handler: async (args) => {
    return { temperature: "24°C", condition: "sunny" };
}

// Advanced (Go example — separate model-facing vs log-facing output)
// Go's low-level Tool struct supports:
//   TextResultForLLM  — what the model sees
//   ResultType         — metadata
//   SessionLog         — what appears in session logs
```

**Design implication:** Think about what the model *needs* to continue its work vs what *you* need for observability. Keep model-facing results concise and structured; log full details separately.

### Tool Lifecycle Events

During tool execution, the session emits lifecycle events:

```
tool.execution_start    → your handler is about to run
[handler executes]
tool.execution_complete → handler returned a result
```

Or, if something goes wrong:

```
tool.execution_start    → your handler is about to run
[handler throws]
tool.execution_error    → handler threw an exception
```

These events are useful for:
- **Progress indicators**: Show "Calling get_customer..." in the UI
- **Audit logging**: Record every tool invocation with timestamp, args, and result
- **Performance monitoring**: Measure tool execution time

### Concurrency: Tools Can Run in Parallel

The agent may decide to call **multiple tools simultaneously**. For example, if the user asks "What's the weather in Tokyo and London?", the agent might call `get_weather("Tokyo")` and `get_weather("London")` in parallel.

**Your handlers must be:**
- **Thread-safe / concurrency-safe** — No shared mutable state without synchronization
- **Timeout-protected** — A slow handler blocks the entire agent turn
- **Defensively coded** — The model provides the arguments, and LLM-generated input is inherently untrusted

```typescript
// BAD: shared mutable state
let callCount = 0;
handler: async (args) => {
    callCount++;  // race condition if called in parallel
    return { count: callCount };
}

// GOOD: no shared state, or use proper synchronization
handler: async (args) => {
    const result = await db.query(args.customerId);  // db handles concurrency
    return result;
}
```

### Tool Results Must Be JSON-Serializable

The result is sent back to the model via JSON-RPC. This means:
- ✅ Plain objects, arrays, strings, numbers, booleans, null
- ❌ Class instances, circular references, functions, Symbols, BigInt
- ❌ `undefined` values (use `null` instead)

### Gotchas

- **Tool not being called?** Check the `description` — it's likely too vague for the model to know when to use it.
- **Python: define Pydantic models at module level** if you use `from __future__ import annotations`. Defining them inside functions breaks schema generation.
- **Go: use `jsonschema` tag (not `json`)** for parameter descriptions: `City string \`json:"city" jsonschema:"The city name"\``.
- **.NET: `[Description]` attribute is required** for the model to understand parameters.
- **Don't make tools too broad.** A tool called `do_everything(action: string)` defeats the purpose — the model won't know how to use it. Make tools narrow and specific.

> 🔗 **Workshop**: [Level 3](workshop/level-3/README.md) teaches tool definition from scratch (exercises 1–12, covering JSON Schema, Zod, multi-tool, error handling).

---

## Chapter 6: Human-in-the-Loop

### `ask_user` as a Workflow Pattern

Most agent demos run autonomously: prompt in, response out. But real-world agents need to **ask questions**. "Which environment should I deploy to?" "This will delete 47 records — proceed?" "What's the customer's email?"

The Copilot SDK supports this via the **User Input Request** mechanism — the agent can pause its execution, ask the user a question, receive an answer, and continue.

### How It Works

1. You configure an `onUserInputRequest` handler when creating the session
2. This enables the `ask_user` built-in tool for the agent
3. During execution, the agent can decide to ask the user a question
4. Your handler is called with the question (and optional choices)
5. You present it to the user, collect the answer, and return it
6. The agent continues with the answer as context

```typescript
const session = await client.createSession({
    model: "gpt-4.1",
    onUserInputRequest: async (request, invocation) => {
        // request.question: "Which database should I query?"
        // request.choices: ["production", "staging", "development"] (optional)
        // request.allowFreeform: true/false

        console.log(`\nAgent asks: ${request.question}`);
        if (request.choices) {
            request.choices.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));
        }

        const answer = await getUserInput();  // your UI/CLI input logic
        return { answer, wasFreeform: true };
    },
    onPermissionRequest: approveAll,
});
```

### The Workflow Pattern

`ask_user` transforms agents from "batch processors" into **interactive workflows**:

```
User: "Deploy my app"
  → Agent: "Which environment?" (ask_user)
  ← User: "staging"
  → Agent: runs deployment tools
  → Agent: "Deployment complete. Run integration tests?" (ask_user)
  ← User: "yes"
  → Agent: runs test tools
  → Agent: "All tests passed. Promote to production?" (ask_user)
  ← User: "not yet"
  → Agent: "Understood. Staging deployment is ready. Let me know when you want to promote."
  → session.idle
```

This is fundamentally different from a simple chatbot — the agent has **agency** (it decides what to do) but checks in with the human at **decision points**.

### Design Considerations

**Where does the UI live?** Your `onUserInputRequest` handler is the bridge between the agent and your user interface. It could:
- Read from `stdin` (CLI tool)
- Send a WebSocket message and wait for a response (web app)
- Show a native dialog (desktop app)
- Post a Slack message and wait for a reaction (bot)

**Timeout handling**: What if the user never responds? The handler blocks the agent, so consider:
- Setting a timeout and returning a default answer
- Returning a "skip" answer that tells the agent to proceed without this information
- Aborting the session if the user doesn't respond within a reasonable time

**Choice validation**: If the agent provides `choices`, validate the user's answer against them before returning.

### Cross-Language Notes

| Language | Handler Config | Request Fields |
|---|---|---|
| TypeScript | `onUserInputRequest: async (request, invocation) => {...}` | `question`, `choices`, `allowFreeform` |
| Python | `on_user_input_request: async (request, invocation) => {...}` | `question`, `choices`, `allow_freeform` |
| Go | `OnUserInputRequest` in session config | Similar structure |
| .NET | `OnUserInputRequest` delegate | Similar structure |

### Gotchas

- **The handler must return `{ answer, wasFreeform }`** — the `wasFreeform` field tells the agent whether the user picked from choices or typed freely.
- **Don't forget to handle the case where `choices` is `undefined`** — the agent may ask open-ended questions.
- **Long-running agents need this** — without `ask_user`, the agent must either guess or fail when it encounters ambiguity.

> 🔗 **Workshop**: [Level 4](workshop/level-4/README.md) teaches user input requests (exercises 4–6), interactive REPL patterns (exercises 7–9), and signal handling for long-running sessions.

---

<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- PART III: CONTROL & SAFETY                                        -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

# Part III: Control & Safety

---

## Chapter 7: Session Hooks — The Programmable Policy Engine

### Beyond Logging: Hooks as Control Plane

Hooks are the SDK's mechanism for intercepting and governing the agent at every stage of its execution. Most tutorials present them as "logging middleware." That undersells them. Hooks are your **programmable policy engine** — the layer where you enforce rules, inject context, transform behavior, and maintain safety.

### The Six Hook Types

| Hook | When It Fires | What You Can Do |
|---|---|---|
| `onPreToolUse` | Before any tool executes | Allow/deny/ask, modify args, add context, suppress output |
| `onPostToolUse` | After any tool executes | Modify result, add context, suppress output, audit |
| `onUserPromptSubmitted` | When the user sends a message | Rewrite prompt, add context, implement shortcuts |
| `onSessionStart` | Session begins | Inject environment context, initialize state |
| `onSessionEnd` | Session ends | Cleanup, save metrics, persist state |
| `onErrorOccurred` | Error anywhere in the pipeline | Retry, skip, abort, notify user |

### `onPreToolUse` — The Most Important Hook

This is where you control **what the agent is allowed to do**. Every tool invocation passes through this hook before execution.

```typescript
hooks: {
    onPreToolUse: async (input) => {
        // input.toolName: "shell", "write", "get_customer", etc.
        // input.toolArgs: { command: "rm -rf /", ... }

        // DENY dangerous operations
        if (input.toolName === "shell" && input.toolArgs.command?.includes("rm")) {
            return {
                permissionDecision: "deny",
                permissionDecisionReason: "Destructive shell commands are not allowed",
            };
        }

        // ASK for confirmation on writes
        if (input.toolName === "write") {
            return {
                permissionDecision: "ask",  // triggers user confirmation
            };
        }

        // ALLOW everything else
        return { permissionDecision: "allow" };
    },
}
```

**The three permission decisions:**

| Decision | Effect |
|---|---|
| `"allow"` | Tool executes immediately, no user interaction |
| `"deny"` | Tool is blocked; agent is told why and must find another approach |
| `"ask"` | User is prompted for confirmation before the tool runs |

**Beyond allow/deny — other `onPreToolUse` capabilities:**

```typescript
// Modify tool arguments before execution
return { modifiedArgs: { ...input.toolArgs, environment: "staging" } };

// Inject additional context the agent will see
return {
    permissionDecision: "allow",
    additionalContext: "Note: this customer is on the enterprise plan",
};

// Suppress tool output from the agent's context
return { permissionDecision: "allow", suppressOutput: true };
```

### `onPostToolUse` — Audit and Transform Results

Fires after every tool execution. Use it for:

```typescript
hooks: {
    onPostToolUse: async (input) => {
        // input.toolName, input.toolArgs, input.toolResult

        // Audit logging
        auditLog.write({
            tool: input.toolName,
            args: input.toolArgs,
            result: input.toolResult,
            timestamp: Date.now(),
        });

        // Redact sensitive data from results before the model sees them
        if (input.toolResult?.includes?.("password")) {
            return { modifiedResult: input.toolResult.replace(/password=\S+/g, "password=***") };
        }

        return null;  // no modifications
    },
}
```

### `onUserPromptSubmitted` — Prompt Engineering at Runtime

Intercept and transform user messages before the agent processes them:

```typescript
hooks: {
    onUserPromptSubmitted: async (input) => {
        // Expand shorthand commands
        if (input.prompt.startsWith("/fix")) {
            return { modifiedPrompt: "Find and fix the errors in: " + input.prompt.slice(4) };
        }

        // Inject context every time
        return {
            additionalContext: `Current project: ${projectName}\nEnvironment: ${env}`,
        };
    },
}
```

### `onSessionStart` / `onSessionEnd` — Lifecycle Management

```typescript
hooks: {
    onSessionStart: async (input) => {
        // input.source: "startup" | "resume" | "new"
        return { additionalContext: "This project uses React 19 + TypeScript 5.4" };
    },
    onSessionEnd: async (input) => {
        // input.reason: "complete" | "error" | "abort" | "timeout" | "user_exit"
        await saveSessionMetrics(sessionId, input.reason);
        return null;
    },
}
```

### `onErrorOccurred` — Resilience

```typescript
hooks: {
    onErrorOccurred: async (input) => {
        // input.error (string), input.errorContext, input.recoverable

        if (input.errorContext === "model_call" && input.error.includes("rate")) {
            return {
                errorHandling: "retry",
                retryCount: 3,
                userNotification: "Rate limit hit — retrying...",
            };
        }

        if (input.errorContext === "tool_execution") {
            return {
                errorHandling: "skip",
                userNotification: `Tool failed: ${input.error}. Continuing without it.`,
            };
        }

        return null;  // default handling
    },
}
```

### The Policy Engine Pattern

Combine hooks into a coherent security policy:

```typescript
const securityPolicy = {
    onPreToolUse: async (input) => {
        // Layer 1: Blocklist (never allow)
        const blocked = ["shell(rm)", "shell(curl)", "shell(wget)"];
        if (blocked.some(b => matchesToolPattern(b, input))) {
            return { permissionDecision: "deny", permissionDecisionReason: "Blocked by policy" };
        }

        // Layer 2: Allowlist (auto-approve)
        const autoApproved = ["get_customer", "search_docs", "read"];
        if (autoApproved.includes(input.toolName)) {
            return { permissionDecision: "allow" };
        }

        // Layer 3: Everything else requires human approval
        return { permissionDecision: "ask" };
    },

    onPostToolUse: async (input) => {
        // Audit everything
        await auditLog.record(input);
        return null;
    },

    onErrorOccurred: async (input) => {
        // Alert on security-relevant errors
        if (input.errorContext === "tool_execution") {
            await alerting.notify(`Tool error: ${input.toolName}: ${input.error}`);
        }
        return null;
    },
};
```

This three-layer pattern (blocklist → allowlist → ask) maps directly to how security policies work in firewalls, IAM systems, and authorization frameworks. It's the right mental model for governing an autonomous agent.

### Gotchas

- **Hooks run synchronously in the agent loop** — a slow hook blocks the agent. Keep them fast; offload heavy work (logging, API calls) asynchronously.
- **Return `null` to indicate "no changes"** — don't return an empty object, which may be interpreted differently.
- **`onPreToolUse` applies to ALL tools**, including built-in ones (shell, write, read, etc.), not just your custom tools.
- **The `ask` decision requires a user input handler** — if you haven't configured `onUserInputRequest`, "ask" will likely fail or behave unexpectedly.

### SDK Hooks vs. Repository-Level Hooks

There are **two separate hook systems** and it's important not to confuse them:

| Aspect | SDK Programmatic Hooks | Repo-Level Hooks |
|---|---|---|
| **Where defined** | In your application code (SDK session config) | In `.github/hooks/` files within a repository |
| **How executed** | In-process — your handler function runs in your app | Out-of-process — Copilot CLI runs shell commands |
| **Scope** | Per-session, per-application | Per-repository, applies to any Copilot CLI session in that repo |
| **Trigger points** | Same: `preToolUse`, `postToolUse`, `sessionStart`, etc. | Same trigger point names |
| **Best for** | Dynamic, context-aware policies in your SDK application | Static, repository-wide policies (linting before commit, etc.) |

Repo-level hooks are configured via YAML files in `.github/hooks/` and documented in [GitHub Docs — Hooks Configuration](https://docs.github.com/en/copilot/reference/hooks-configuration). When building with the SDK, you'll primarily use programmatic hooks — but be aware that repo-level hooks may also fire if the CLI is working inside a repository that has them configured.

> 🔗 **Workshop**: [Level 5](workshop/level-5/README.md) teaches all 6 hook types with 12 progressive exercises.

---

## Chapter 8: Security & Permissions

### The Three Layers of Defense

Security in Copilot SDK is not one mechanism — it's three layers working together:

```
Layer 3: SDK Hooks (your code)         ← most flexible, your policy
Layer 2: CLI Tool Flags (--allow/deny) ← CLI-level permissions
Layer 1: CLI Trust Model (folder)      ← foundational sandbox
```

Each layer adds a different kind of protection. Relying on only one is insufficient.

### Layer 1: CLI Trust Model

When Copilot CLI starts, it operates with an implicit trust model:

- **Scoped to the current directory tree** — the CLI can read, modify, and execute files within and below the working directory
- **Asks permission for access outside the directory** — attempting to read `/etc/passwd` triggers a confirmation
- **Asks permission before modifying files** (in interactive mode)

**SDK implication:** When your application spawns the CLI, it inherits the working directory of your process. **Choose carefully** — a CLI started from `/` has a much larger attack surface than one started from `./workspace/session-123/`.

```typescript
// GOOD: Scoped to a narrow workspace
const client = new CopilotClient();
// Set working directory before creating sessions, or use cwd in CLI config

// RISK: Broad scope
// Starting from project root gives the agent access to all project files
```

### Layer 2: CLI Permission Flags

Copilot CLI has a comprehensive permission model with **three independent dimensions**: tools, paths, and URLs.

#### Tool Permissions

```bash
# Allow all tools (the default when using the SDK)
copilot --allow-all-tools

# Allow specific tools only
copilot --allow-tool 'read' --allow-tool 'get_customer'

# Deny specific tools (deny always takes precedence over allow)
copilot --deny-tool 'shell(rm)' --deny-tool 'shell(curl)'

# MCP-specific permissions
copilot --allow-tool 'MCP_SERVER_NAME' --deny-tool 'MCP_SERVER_NAME(dangerous_tool)'
```

#### Path Permissions

By default, the CLI can access:
- **Current working directory + subdirectories**
- **System temp directory**

```bash
# Disable path verification (access any path)
copilot --allow-all-paths

# Disallow temp directory access (tighter sandbox)
copilot --disallow-temp-dir
```

#### URL Permissions

```bash
# Disable URL verification (allow requests to any URL)
copilot --allow-all-urls
```

#### The `--allow-all` Decomposition (Critical for Security Reviews)

The `--allow-all` flag (also known as `--yolo`) is actually shorthand for **three combined permissions**:

```
--allow-all  =  --allow-all-tools  +  --allow-all-paths  +  --allow-all-urls
```

This means that when the SDK documentation says it operates "as if `--allow-all` was passed," it implies:
1. **All tools** are enabled without confirmation
2. **All filesystem paths** are accessible (not just cwd)
3. **All URLs** can be requested without verification

Understanding this decomposition is essential for security hardening — you might want to allow all tools but restrict paths, or allow paths but restrict URLs.

#### Passing CLI Flags from the SDK

```typescript
// TypeScript/Node — cliArgs for additional CLI arguments
const client = new CopilotClient({
    cliArgs: ["--deny-tool", "shell(rm)", "--disallow-temp-dir"],
});
```

```csharp
// .NET — CliArgs
var client = new CopilotClient(new CopilotClientOptions {
    CliArgs = ["--deny-tool", "shell(rm)", "--disallow-temp-dir"],
});
```

> **Python/Go note:** These SDKs have more limited `cliArgs` support. For advanced CLI configuration, run the CLI manually with your desired flags and connect via `cli_url` / `CLIUrl`.

**This default is designed for development and demos.** For production, you should either:
- Use SDK hooks (Layer 3) to add approval logic
- Configure the CLI with restricted flags via `cliArgs`
- Or run the CLI externally with explicit permission configuration

### Layer 3: SDK Hooks (Your Policy Engine)

This is where you implement **your application's specific security policy** (detailed in [Chapter 7](#chapter-7-session-hooks--the-programmable-policy-engine)). The hooks give you:

- **Fine-grained control** per tool, per argument, per context
- **Programmatic decisions** (not just static allow/deny lists)
- **Audit trail** (onPostToolUse logs everything)
- **User confirmation** ("ask" decision with onUserInputRequest)

### Defense in Depth: Combining the Layers

```
User prompt: "Clean up old deployment artifacts"

Layer 1 (CLI Trust): Only files in ./workspace/ are accessible ✓
Layer 2 (CLI Flags): shell(rm) is not explicitly denied ⚠️
Layer 3 (SDK Hook): onPreToolUse checks:
  - Is the command destructive? → "ask" (require user confirmation)
  - Is the target inside workspace? → "allow"
  - Is the target outside workspace? → "deny"
```

### Practical Security Checklist

For any application that runs with real user data or in production:

- [ ] **Scope the working directory** — don't give the CLI access to your entire filesystem
- [ ] **Implement `onPreToolUse`** — at minimum, block destructive shell commands
- [ ] **Log tool executions** — use `onPostToolUse` for an audit trail
- [ ] **Validate tool arguments** — LLM-generated input is untrusted; sanitize in your handlers
- [ ] **Set timeouts on tool handlers** — prevent the agent from hanging on a slow tool
- [ ] **Consider `onUserInputRequest`** — humans should approve irreversible actions
- [ ] **Review MCP server permissions** — external tools may have broad capabilities

### The "Allow All" Problem

The SDK's default of operating as if `--allow-all` was passed is intentional — it lets you get started quickly without configuration. But understanding the decomposition (`--allow-all` = `--allow-all-tools` + `--allow-all-paths` + `--allow-all-urls`), this means:

- The agent **can run arbitrary shell commands** (including destructive ones) — `--allow-all-tools`
- The agent **can read/write files anywhere**, not just the working directory — `--allow-all-paths`
- The agent **can make network requests to any URL** — `--allow-all-urls`
- MCP tools (if configured) run with whatever permissions the MCP server has

For demos and development, this is fine. For anything user-facing, **you must add restrictions.** Your options, from lightest to heaviest:

1. **SDK hooks only** — `onPreToolUse` for fine-grained, context-aware policy (Chapter 7)
2. **CLI flags via `cliArgs`** — static allow/deny rules at startup
3. **External CLI with explicit flags** — run CLI manually with your permission config
4. **All three combined** — defense in depth (recommended for production)

> 🔗 **Workshop**: [Level 5](workshop/level-5/README.md) exercise 3 implements tool approval policies; exercises 5–6 cover argument modification and output suppression for security.

---

<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- PART IV: INFRASTRUCTURE                                           -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

# Part IV: Infrastructure

---

## Chapter 9: Authentication — The Full Matrix

### Why Auth Is Complicated

Authentication in Copilot SDK is more nuanced than "pass an API key." The SDK supports **six different auth methods** with a specific **priority order**, and many debugging headaches come from not understanding which credential the SDK is actually using.

### The Six Auth Methods

#### 1. Explicit `githubToken` (Highest Priority)

```typescript
const client = new CopilotClient({
    githubToken: "ghu_xxxxxxxxxxxx",
    useLoggedInUser: false,  // don't mix with stored credentials
});
```

- You obtain a token yourself (OAuth flow, GitHub App, PAT)
- Passed directly to the client constructor
- **Supported token types:** `gho_` (OAuth), `ghu_` (user), `github_pat_` (fine-grained PAT)
- **Not supported:** classic PAT (`ghp_`) — this is a common gotcha

#### 2. HMAC Keys (Internal/Enterprise)

The SDK checks for `CAPI_HMAC_KEY` or `COPILOT_HMAC_KEY` environment variables. This is primarily for internal GitHub infrastructure and enterprise deployments.

#### 3. Direct API Token

The SDK checks for `GITHUB_COPILOT_API_TOKEN` + `COPILOT_API_URL` environment variables. Used in CI/CD and GitHub Actions contexts.

#### 4. Environment Variable Tokens

Checked in this order:
```bash
COPILOT_GITHUB_TOKEN    # Copilot-specific (highest priority)
GH_TOKEN                # GitHub CLI compatible
GITHUB_TOKEN            # Standard GitHub env var (lowest priority)
```

This is the most common method for **automation, CI/CD, and scripting**.

#### 5. Stored OAuth Credentials (Copilot CLI Login)

```bash
copilot auth login  # one-time interactive setup
```

Credentials are stored in the system keychain. The SDK automatically uses them if no higher-priority auth is available. This is the recommended method for **local development**.

#### 6. GitHub CLI Credentials (Lowest Priority)

```bash
gh auth status  # verify existing GitHub CLI login
```

If you've authenticated with GitHub CLI (`gh`), the SDK can use those credentials as a fallback.

### The Priority Order (Critical for Debugging)

```
1. githubToken (constructor)        ← explicit wins
2. CAPI_HMAC_KEY / COPILOT_HMAC_KEY ← enterprise HMAC
3. GITHUB_COPILOT_API_TOKEN         ← direct API
4. COPILOT_GITHUB_TOKEN             ← env var (copilot-specific)
5. GH_TOKEN                         ← env var (gh-compatible)
6. GITHUB_TOKEN                     ← env var (standard)
7. Stored OAuth (copilot auth)      ← keychain
8. gh auth credentials              ← GitHub CLI fallback
```

**Why this matters:** If you have `GITHUB_TOKEN` set in your shell (common in CI environments) but you want to use a specific user's Copilot subscription, the env var will take priority over stored OAuth credentials. The fix: use `COPILOT_GITHUB_TOKEN` (higher priority) or pass `githubToken` explicitly.

### Debugging Auth Issues

```typescript
// Enable debug logging to see which auth method is being used
const client = new CopilotClient({ logLevel: "debug" });
```

**Common symptoms and causes:**

| Symptom | Likely Cause |
|---|---|
| "Not authenticated" | No valid credential found in any method |
| Wrong user account | An env var is set that you forgot about |
| "Subscription required" | Token is valid but doesn't have Copilot access |
| "Rate limit exceeded" | Using a shared token with limited quota |
| Works locally, fails in CI | CI has `GITHUB_TOKEN` set (Actions default) but no Copilot subscription |

### Auth for BYOK

When using BYOK (Chapter 10), you still need GitHub auth for CLI initialization, but model API calls use your provider's credentials. The two auth paths are independent:

```typescript
const session = await client.createSession({
    model: "gpt-4",
    provider: {
        type: "openai",
        apiKey: process.env.OPENAI_API_KEY,  // for model calls
    },
    onPermissionRequest: approveAll,
});
// GitHub auth (env var or OAuth) is still needed for CLI startup
```

> 🔗 **Workshop**: [Level 7](workshop/level-7/README.md) exercises 1–4 cover BYOK providers and auth configuration.

---

## Chapter 10: BYOK Deep Dive

### Why BYOK Matters

BYOK (Bring Your Own Key) lets you use the Copilot SDK's agent runtime **without a Copilot subscription** — you point it at your own model provider and pay them directly. This is especially important for:

- **Enterprise environments** that mandate specific model providers or data residency
- **Cost optimization** with volume pricing on your own OpenAI/Azure account
- **Local development** with Ollama (completely free, fully offline)
- **Model experimentation** — compare GPT-4.1, Claude, and local models using the same SDK code

### Provider Configuration

```typescript
const session = await client.createSession({
    model: "gpt-4",  // REQUIRED with BYOK — the SDK won't guess
    provider: {
        type: "openai",                          // provider type
        baseUrl: "https://api.openai.com/v1",    // API endpoint
        apiKey: process.env.OPENAI_API_KEY,      // static credential
        wireApi: "completions",                  // API format (default)
    },
    onPermissionRequest: approveAll,
});
```

### Supported Provider Types

| Provider | `type` | `baseUrl` | Notes |
|---|---|---|---|
| **OpenAI** | `"openai"` | `https://api.openai.com/v1` | Standard setup |
| **Azure OpenAI (native)** | `"azure"` | `https://my-resource.openai.azure.com` | Host only — no path! |
| **Azure AI Foundry** | `"openai"` | `https://your-resource.openai.azure.com/openai/v1/` | Full path including `/openai/v1/` |
| **Anthropic** | `"anthropic"` | `https://api.anthropic.com` | Claude models |
| **Ollama (local)** | `"openai"` | `http://localhost:11434/v1` | No apiKey needed |
| **vLLM, LiteLLM, etc.** | `"openai"` | Your endpoint URL | Any OpenAI-compatible server |

### The Azure Endpoint Gotcha

This is the single most common BYOK mistake. Azure has **two different endpoint formats**, and they require **different `type` values**:

#### Native Azure OpenAI

```typescript
// The URL is the HOST ONLY — no /openai/v1 path
provider: {
    type: "azure",  // ← "azure", NOT "openai"
    baseUrl: "https://my-resource.openai.azure.com",
    apiKey: process.env.AZURE_OPENAI_KEY,
}
```

#### Azure AI Foundry (OpenAI-Compatible)

```typescript
// The URL INCLUDES /openai/v1/ — it's an OpenAI-compatible endpoint
provider: {
    type: "openai",  // ← "openai", NOT "azure"
    baseUrl: "https://your-resource.openai.azure.com/openai/v1/",
    apiKey: process.env.AZURE_OPENAI_KEY,
}
```

**How to tell which one you have:** Look at the endpoint URL your Azure portal gives you. If it ends at the hostname (`.azure.com`), use `type: "azure"`. If it includes a path like `/openai/v1/`, use `type: "openai"`.

### `wireApi`: Chat Completions vs Responses API

The `wireApi` (or `wire_api` in Python) controls which API format the SDK uses to talk to the model:

| Value | API | When to Use |
|---|---|---|
| `"completions"` (default) | Chat Completions (`/chat/completions`) | GPT-4, GPT-4.1, most models |
| `"responses"` | Responses API (`/responses`) | GPT-5 series, models that require/prefer it |

```typescript
// For GPT-5 series models
provider: {
    type: "openai",
    baseUrl: "https://api.openai.com/v1",
    apiKey: process.env.OPENAI_API_KEY,
    wireApi: "responses",  // required for GPT-5
}
```

**When in doubt, use the default (`"completions"`)** — it works with the vast majority of models. Only switch to `"responses"` if the model documentation specifically requires it.

### Static Credentials — The Hard Limitation

BYOK supports **only static API keys and bearer tokens**. This means:

- ❌ **No Microsoft Entra ID** (Azure AD) authentication
- ❌ **No managed identities** (Azure VM, AKS, etc.)
- ❌ **No token refresh** — bearer tokens aren't auto-renewed
- ❌ **No federated identity** (OIDC, SAML)

**If you need Entra ID or managed identity:** You must implement a token refresh layer outside the SDK (e.g., a proxy that accepts static keys and forwards requests with Entra tokens to Azure).

**Credential rotation:** Since the SDK doesn't refresh tokens, you need to:
1. Set short-lived API keys (if your provider supports it)
2. Rotate them via your deployment pipeline
3. Restart sessions after key rotation

### Local Development with Ollama

Ollama is the easiest way to experiment with BYOK — free, local, no API key:

```bash
# Setup
ollama pull llama3
ollama serve  # starts on port 11434
```

```typescript
const session = await client.createSession({
    model: "llama3",
    provider: {
        type: "openai",
        baseUrl: "http://localhost:11434/v1",
        // no apiKey needed
    },
    onPermissionRequest: approveAll,
});
```

This is great for:
- **Testing tool definitions rapidly** without API costs
- **Offline development** (airplane mode friendly)
- **Privacy-sensitive workflows** where data can't leave the machine

**Limitation:** Local models are significantly less capable than GPT-4.1/Claude for tool calling and multi-step reasoning. Use Ollama for testing SDK plumbing, not for evaluating agent quality.

> 🔗 **Workshop**: [Level 7](workshop/level-7/README.md) exercises 1–4 cover BYOK for OpenAI, Azure, Anthropic, and Ollama.

---

## Chapter 11: Session Management

### The Problem: Context Windows Are Finite

Every LLM has a context window — a maximum number of tokens it can process at once. A long conversation, a large file, or several tool calls can exhaust this window quickly. When it fills up, the model can't see older context, and the conversation effectively "forgets" earlier work.

Copilot SDK solves this with **infinite sessions**, **persistence**, and **workspace artifacts**.

### Session Persistence

Sessions are automatically persisted to disk at:

```
~/.copilot/session-state/{sessionId}/
```

This means:
- Sessions **survive process restarts** — you can resume a conversation later
- Each session has its own **isolated workspace** on disk
- You can have **multiple sessions** without them interfering

#### Resuming a Session

```typescript
// Create with a stable, meaningful ID
const session = await client.createSession({
    sessionId: "user-alice-code-review-42",
    model: "gpt-4.1",
    onPermissionRequest: approveAll,
});
await session.sendAndWait({ prompt: "Analyze my codebase" });

// ... later, even after process restart ...
const resumed = await client.resumeSession("user-alice-code-review-42");
await resumed.sendAndWait({ prompt: "What did we find earlier?" });
```

**Session ID best practices:**
- Use **structured IDs**: `{userId}-{task}-{timestamp}` for easy auditing and cleanup
- Make them **deterministic** for the same logical conversation (so you can resume)
- Don't use random UUIDs unless you have another way to look up the session

**What persists:** conversation history, tool results, agent plan, session artifacts.
**What doesn't persist:** API keys (must re-provide for BYOK), in-memory tool state (closures, database connections), event listeners.

#### Session Discovery and Cleanup

Beyond creating and resuming sessions, the SDK provides operations for session lifecycle management:

```typescript
// List all sessions with metadata
const sessions = await client.listSessions();
for (const s of sessions) {
    console.log(`${s.sessionId} | ${s.summary ?? "no summary"}`);
    console.log(`  cwd: ${s.cwd}, branch: ${s.branch}`);
    console.log(`  repo: ${s.repository}, gitRoot: ${s.gitRoot}`);
}

// Delete a session (removes all data from disk)
await client.deleteSession("user-alice-code-review-42");
```

**`listSessions()` returns rich metadata** for each session:

| Field | Description |
|---|---|
| `sessionId` | The session identifier |
| `summary` | Agent-generated summary of the conversation (if available) |
| `cwd` | Working directory when session was created |
| `gitRoot` | Git repository root (if applicable) |
| `repository` | Repository name |
| `branch` | Git branch name |
| Timestamps | Creation and last-activity timestamps |

This metadata enables powerful management patterns:
- **Dashboard views**: show users their active sessions with summaries
- **Garbage collection**: delete sessions older than N days
- **Context restoration**: resume the right session based on current repo/branch
- **Audit trails**: track which sessions touched which repositories

See [Pattern I: Session Governance](#pattern-i-session-governance-for-multi-tenant) for multi-tenant session management patterns.

### Infinite Sessions

Infinite sessions are the SDK's answer to context window exhaustion. When enabled (which is the **default**), the SDK automatically compacts older context when approaching the window limit.

#### How Compaction Works

```
1. Conversation grows...
2. Token usage reaches backgroundCompactionThreshold (default: 80%)
3. SDK begins background compaction:
   - Summarizes older conversation history
   - Preserves recent context and important state
   - Creates a checkpoint
4. If token usage reaches bufferExhaustionThreshold (default: 95%):
   - Agent blocks until compaction completes
5. Compaction finishes → agent continues with compacted context
```

#### Compaction Events

```typescript
session.on("session.compaction_start", () => {
    showStatus("Compacting memory...");
});
session.on("session.compaction_complete", () => {
    showStatus("Ready");
});
```

#### Tuning Compaction

```typescript
const session = await client.createSession({
    model: "gpt-4.1",
    infiniteSessions: {
        enabled: true,
        backgroundCompactionThreshold: 0.80,  // start compacting at 80%
        bufferExhaustionThreshold: 0.95,       // block at 95%
    },
    onPermissionRequest: approveAll,
});
```

- **Lower `backgroundCompactionThreshold`** = compaction starts earlier, less risk of blocking
- **Higher `bufferExhaustionThreshold`** = more context before blocking, but risk of hitting hard limits
- **Set `enabled: false`** to disable infinite sessions entirely (sessions will fail when context is exhausted)

### Workspace Artifacts

When infinite sessions are enabled, the session workspace contains:

```
~/.copilot/session-state/{sessionId}/
├── checkpoints/    ← compaction checkpoints (historical state snapshots)
├── plan.md         ← the agent's current plan (externalized reasoning)
└── files/          ← files the agent is working with
```

**`plan.md`** is particularly interesting — it's the agent's externalized plan. If you're building a developer tool, you could:
- Show this to the user ("Here's what the agent is planning")
- Let the user edit it ("Actually, skip step 3")
- Use it for debugging ("Why did the agent do X?")

**`checkpoints/`** contains snapshots created during compaction. These are the agent's "long-term memory" — compacted summaries of older conversation segments.

**Design implication:** If you're building a UI, consider exposing these artifacts. They provide transparency into the agent's state and enable powerful debugging capabilities.

### Session Lifecycle

| State | Description |
|---|---|
| **New** | Session just created, no history |
| **Active** | Session is processing a prompt or tool calls |
| **Idle** | Session finished work, waiting for next prompt |
| **Compacting** | Background compaction in progress |
| **Resumed** | Session restored from persistence |
| **Destroyed** | Session permanently ended |

### Gotchas

- **Session cleanup**: Old sessions accumulate on disk. Implement periodic cleanup of `~/.copilot/session-state/` for long-running applications.
- **Compaction loses detail**: Compacted history is a summary — the agent may not remember exact details from much earlier in the conversation.
- **Resuming requires the same model**: If you created a session with `gpt-4.1`, resume it with the same model for best results.
- **Event listeners aren't persisted**: After resuming, you must re-attach your event handlers.

> 🔗 **Workshop**: [Level 7](workshop/level-7/README.md) exercises 5–9 cover session persistence, infinite sessions, and workspace artifacts.

---

## Chapter 12: MCP, Custom Agents & Skills

### What MCP Gives You

**Model Context Protocol (MCP)** is a standard for connecting external tools to AI models. Instead of defining every tool in your application code, you can connect to **MCP servers** that expose tools via a standardized protocol.

The Copilot SDK supports MCP natively — you configure MCP servers in the session, and the agent can discover and call their tools just like your custom tools.

**Why use MCP instead of custom tools?**
- **Reusability**: MCP servers are shared across applications (community ecosystem)
- **Separation of concerns**: Tool implementation lives in a separate process
- **Ecosystem**: Hundreds of pre-built MCP servers for GitHub, databases, filesystems, APIs
- **Standardization**: Tools defined once, usable by any MCP-compatible client

### Two Transport Types

#### Local (stdio) — Spawns a Subprocess

```typescript
const session = await client.createSession({
    model: "gpt-4.1",
    mcpServers: {
        "filesystem": {
            type: "local",
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
            tools: ["*"],        // expose all tools from this server
            timeout: 30000,      // 30s startup timeout
            env: { DEBUG: "true" },
            cwd: "./servers",
        },
    },
    onPermissionRequest: approveAll,
});
```

The SDK spawns the MCP server as a child process and communicates via stdio. Use this for:
- **Local tools** that need filesystem access
- **Development** where you're building/testing MCP servers
- **Single-machine deployments** where everything runs together

#### Remote (HTTP/SSE) — Connects to a Running Server

```typescript
const session = await client.createSession({
    model: "gpt-4.1",
    mcpServers: {
        "github": {
            type: "http",
            url: "https://api.githubcopilot.com/mcp/",
            headers: { "Authorization": `Bearer ${githubToken}` },
            tools: ["*"],
        },
    },
    onPermissionRequest: approveAll,
});
```

Use this for:
- **Cloud-hosted MCP servers** (GitHub's official MCP endpoint, etc.)
- **Shared infrastructure** where one MCP server serves multiple clients
- **Enterprise deployments** with centralized tool management

### The `tools` Configuration — Critical

The `tools` array in MCP config controls **which tools from the server are exposed to the agent**:

```typescript
tools: ["*"],                              // ALL tools (opt-in required!)
tools: [],                                 // NO tools (server connected but tools hidden)
tools: ["read_file", "list_directory"],     // specific tools only
```

**Important:** `tools: ["*"]` is **opt-in** — if you forget to set it, no tools from that MCP server will be available to the agent. This is a common source of "why isn't the agent using my MCP tools?" debugging.

### MCP Permissions with CLI Flags

For enterprise and production deployments, you can control MCP tool permissions at the CLI level:

```bash
# Allow all tools from a specific MCP server
copilot --allow-tool 'filesystem'

# Deny a specific tool from an MCP server
copilot --deny-tool 'filesystem(delete_file)'

# Allow MCP server but deny destructive tools
copilot --allow-tool 'github' --deny-tool 'github(create_issue)'
```

**Combined with SDK hooks**: You can use CLI flags for coarse-grained control and SDK `onPreToolUse` hooks for fine-grained, context-aware decisions.

### Multi-Server Configuration

You can connect to multiple MCP servers simultaneously:

```typescript
mcpServers: {
    "filesystem": {
        type: "local",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem", "./workspace"],
        tools: ["*"],
    },
    "github": {
        type: "http",
        url: "https://api.githubcopilot.com/mcp/",
        headers: { "Authorization": `Bearer ${token}` },
        tools: ["*"],
    },
    "database": {
        type: "local",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-sqlite", "./data.db"],
        tools: ["read_query"],  // read-only access
    },
}
```

The agent sees tools from all configured servers and can use them together in a single conversation. Tool names are namespaced by server to avoid conflicts.

### Popular MCP Servers

| Server | Package | What It Provides |
|---|---|---|
| Filesystem | `@modelcontextprotocol/server-filesystem` | Read/write/search files |
| GitHub | `https://api.githubcopilot.com/mcp/` | Issues, PRs, repos, code search |
| SQLite | `@modelcontextprotocol/server-sqlite` | Database queries |
| Puppeteer | `@modelcontextprotocol/server-puppeteer` | Browser automation |

Browse the full ecosystem at [github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers).

### MCP as Enterprise Integration Strategy

Beyond "another way to add tools," MCP represents a **standardization layer** for enterprise architectures. Think of it as the difference between writing bespoke REST client code for every internal API vs. having a standardized integration contract.

**Why enterprises should think about MCP architecturally:**

| Aspect | Custom Tools | MCP Servers |
|---|---|---|
| **Coupling** | Tools are compiled into your application | Tools live in separate processes with defined interfaces |
| **Schema** | You define JSON Schema in your app code | MCP server self-describes its tools at runtime |
| **Auth** | Handled in your tool handler code | Per-server auth configuration (API keys, bearer tokens, headers) |
| **Lifecycle** | Tied to your application process | Independent — can be upgraded, restarted, scaled separately |
| **Reusability** | Only in your app | Any MCP-compatible client can use the same server |
| **Team ownership** | Your team owns tool + business logic | Platform team can own MCP server; app teams consume it |

**The enterprise pattern:** Expose your internal systems (ticketing, CMDB, monitoring, CI/CD, data warehouse) as MCP servers with explicit schemas and auth boundaries. Application teams connect to them via session config without knowing the implementation details. The MCP server becomes the **integration contract** between the agent platform and your enterprise systems.

This decoupling is particularly valuable when multiple agent applications (different teams, different use cases) need access to the same enterprise systems — each connects to the shared MCP server rather than reimplementing the integration.

### Gotchas

- **`tools: ["*"]` is required** to expose any MCP tools — forgetting it means the agent can't see them.
- **MCP servers are separate processes** — they can crash independently. Consider monitoring them in production.
- **Permissions apply to the MCP server process** — if the filesystem MCP server has access to `/`, the agent can read any file through it.
- **Timeout matters for local servers** — some MCP servers take time to initialize (installing npm packages, etc.). Set a generous `timeout`.

### Debugging MCP Servers

When MCP integration "mysteriously fails," you can debug it **deterministically without the LLM in the loop** by testing the MCP protocol handshake manually.

#### Step 1: Test the Initialize Handshake

Send a JSON-RPC `initialize` request to verify the server starts and responds:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | npx -y @modelcontextprotocol/server-filesystem /tmp
```

Expected: a JSON response with `serverInfo`, `capabilities`, and `protocolVersion`.

#### Step 2: List Available Tools

After initialization, send a `tools/list` request:

```bash
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | npx -y @modelcontextprotocol/server-filesystem /tmp
```

Expected: a response with a `tools` array containing each tool's `name`, `description`, and `inputSchema`.

#### Common MCP Debugging Scenarios

| Symptom | Likely Cause | Debug Step |
|---|---|---|
| Agent never calls MCP tools | `tools: []` or `tools` missing | Check session config — set `tools: ["*"]` |
| MCP server timeout on startup | Server takes too long to initialize | Increase `timeout`; test with manual handshake |
| "Connection refused" from remote MCP | Wrong URL or server not running | `curl` the MCP endpoint directly |
| Tools listed but agent errors on call | Schema mismatch or server bug | Test with manual `tools/call` JSON-RPC request |
| Server starts but no tools appear | Server `initialize` succeeds but `tools/list` returns empty | Run `tools/list` manually to verify |

> **Tip:** The SDK's `logLevel: "debug"` also shows MCP JSON-RPC traffic, which can help identify where the communication breaks down.

### Custom Agents — Specialized AI Personas

Beyond tools and MCP, the SDK lets you define **custom agent personas** — specialized AI characters with their own system prompts and expertise. While the default Copilot agent is general-purpose, custom agents let you create focused personas for specific tasks.

```typescript
const session = await client.createSession({
    model: "gpt-4.1",
    customAgents: [{
        name: "security-reviewer",
        displayName: "Security Reviewer",
        description: "Reviews code changes for security vulnerabilities",
        prompt: "You are an expert security code reviewer. Focus on: SQL injection, XSS, auth bypass, secret exposure, and insecure dependencies. Be specific about the vulnerability and suggest a fix.",
    }],
    onPermissionRequest: approveAll,
});
```

**When custom agents shine:**

| Use Case | Agent Persona |
|---|---|
| Code review bot | Security-focused reviewer with specific standards |
| Documentation assistant | Technical writer familiar with your project's style guide |
| Ops incident responder | SRE persona that follows your runbook patterns |
| Onboarding helper | Patient mentor that explains codebase conventions |

**Key considerations:**
- The `description` tells the runtime *when* to invoke this persona (analogous to tool descriptions)
- The `prompt` extends (not replaces) the default system prompt — your persona guidance is additive
- You can define multiple custom agents in a single session — the runtime selects the appropriate one based on context

### Custom Skills — Reusable Prompt/Tool Packages

**Skills** are the SDK's answer to "how do I share domain context and tool configurations across sessions and projects?" A skill is a directory containing prompts, tool definitions, and configuration that gets loaded into a session.

```typescript
const session = await client.createSession({
    model: "gpt-4.1",
    skillDirectories: ["./skills/code-review", "./skills/documentation"],
    disabledSkills: ["experimental-feature"],  // selectively disable
    onPermissionRequest: approveAll,
});
```

**Skill directory structure:**

```
skills/code-review/
├── skill.json          # { "name": "code-review", ... }
├── prompts/
│   └── system.md       # System prompt additions (markdown)
└── tools/
    └── lint.json       # Tool definitions
```

**Why skills matter for enterprise:**
- **Reusability**: Package domain expertise once, use across many sessions and applications
- **Version control**: Skills live in your repo — they're reviewed, tested, and versioned like code
- **Team sharing**: One team creates a "security review" skill; all teams use it
- **Separation of concerns**: Domain experts write the prompts and tool schemas; engineers wire them into sessions

**CI/automation with skills:** A TechCommunity example shows skills used in GitHub Actions workflows — placing a `.copilot_skills/` directory in the repo and referencing it via `skillDirectories` in session config. This lets scheduled agent tasks operate with domain-specific context without hardcoding it into the script.

> 🔗 **Workshop**: [Level 6](workshop/level-6/README.md) exercises 1–4 cover MCP server configuration (local and remote); exercises 5–6 cover custom agent personas; exercises 7–8 cover skill directories.

---

<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- PART V: MASTERY                                                   -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

# Part V: Mastery

---

## Chapter 13: Production Patterns

### The Patterns That Make Real Projects Succeed

These patterns emerge from taking the SDK concepts (tools, hooks, events, sessions) and composing them into robust, maintainable applications. Each addresses a specific challenge you'll face when building real products.

### Pattern A: Hook-Based Policy Engine

**Problem:** The agent can run arbitrary tools by default. You need to control what's allowed based on user role, context, and risk level.

**Solution:** Implement `onPreToolUse` as a three-layer policy (see [Chapter 7](#chapter-7-session-hooks--the-programmable-policy-engine)):

```
Layer 1: Blocklist → always deny (destructive operations)
Layer 2: Allowlist → always allow (safe read-only operations)
Layer 3: Ask       → everything else requires human approval
```

**When to use:** Any application where the agent acts on behalf of users, especially in enterprise or multi-tenant environments.

### Pattern B: Narrow, Well-Described Tools

**Problem:** The model ignores your tool, calls it incorrectly, or calls the wrong tool.

**Solution:** Design tools that are:
- **Single-purpose**: `get_customer_by_id` not `customer_operations`
- **Clearly described**: The description should answer "when would you use this?"
- **Strictly typed**: Use Zod/Pydantic/struct tags for parameter validation
- **Defensively implemented**: Validate inputs (the model generates them — untrusted)

```typescript
// BAD: Vague tool that the model won't know when to use
defineTool("data", {
    description: "Does data operations",
    parameters: { type: "object", properties: { action: { type: "string" } } },
    handler: async (args) => { /* ... */ },
});

// GOOD: Specific tool with clear intent
defineTool("get_customer_by_email", {
    description: "Look up a customer by their email address. Returns customer ID, name, plan tier, and signup date. Use when you need customer information for support or billing queries.",
    parameters: {
        type: "object",
        properties: {
            email: { type: "string", description: "Customer's email (e.g., alice@example.com)" },
        },
        required: ["email"],
    },
    handler: async (args) => {
        if (!args.email?.includes("@")) throw new Error("Invalid email format");
        return await db.customers.findByEmail(args.email);
    },
});
```

### Pattern C: `session.idle` as Turn Boundary

**Problem:** You try to process the "response" from `sendAndWait`, but the agent made multiple tool calls and the return value only contains the last message.

**Solution:** Don't rely on the return value of `sendAndWait` as your only output channel. Use `session.idle` as the definitive "turn is complete" signal, and collect all output via events:

```typescript
const outputs: string[] = [];

session.on("assistant.message", (e) => {
    outputs.push(e.data.content);  // collect all messages
});

session.on("session.idle", () => {
    // NOW process all outputs — the turn is truly complete
    processAllOutputs(outputs);
    outputs.length = 0;  // reset for next turn
});

await session.sendAndWait({ prompt: "Analyze and fix the code" });
```

**When to use:** Any application where the agent's response involves tool calls (which is most real-world applications).

### Pattern D: Surface Workspace Artifacts in UX

**Problem:** The agent is doing work, but users can't see what it's planning or what files it's modified.

**Solution:** Expose the session workspace artifacts to your UI:

```typescript
// Read the agent's plan
const plan = fs.readFileSync(
    path.join(session.workspacePath, "plan.md"), "utf-8"
);
showInSidebar(plan);

// Show compaction status
session.on("session.compaction_start", () => showStatus("Compacting memory..."));
session.on("session.compaction_complete", () => showStatus("Ready"));

// List files the agent has created/modified
const files = fs.readdirSync(path.join(session.workspacePath, "files"));
showInFileExplorer(files);
```

**When to use:** Developer tools, IDEs, and applications where transparency into the agent's process builds trust.

### Pattern E: Centralized SDK Abstraction

**Problem:** SDK is in Technical Preview, APIs may change. You have `session.on(...)` calls scattered across 50 files.

**Solution:** Create a thin wrapper that centralizes all SDK interaction:

```typescript
// copilot-service.ts — single point of SDK integration
export class CopilotService {
    private client: CopilotClient;

    async createAgent(config: AgentConfig): Promise<AgentSession> {
        const session = await this.client.createSession({
            model: config.model,
            tools: config.tools,
            hooks: this.buildHooks(config.policies),
            streaming: true,
            onPermissionRequest: approveAll,
        });
        return new AgentSession(session);  // your wrapper
    }
}

// rest of your app uses CopilotService, never imports from @github/copilot-sdk
```

**When to use:** Any application that plans to survive SDK version upgrades.

### Pattern F: Token-Aware Cost Management

**Problem:** Users run up unexpected costs because there's no visibility into token usage.

**Solution:** Track and enforce token budgets per session:

```typescript
let totalTokens = { input: 0, output: 0 };
const TOKEN_BUDGET = 100_000;

session.on("assistant.usage", (event) => {
    totalTokens.input += event.data.inputTokens;
    totalTokens.output += event.data.outputTokens;

    if (totalTokens.input + totalTokens.output > TOKEN_BUDGET) {
        session.abort();
        notifyUser("Session budget exceeded");
    }
});
```

### Pattern G: Graceful Error Recovery

**Problem:** Tool failures crash the agent or produce confusing output.

**Solution:** Combine `onErrorOccurred` hook with defensive tool handlers:

```typescript
hooks: {
    onErrorOccurred: async (input) => {
        if (input.recoverable && input.errorContext === "tool_execution") {
            return { errorHandling: "skip", userNotification: `Skipped failed tool: ${input.error}` };
        }
        if (input.errorContext === "model_call") {
            return { errorHandling: "retry", retryCount: 2 };
        }
        return null;
    },
}
```

### Pattern H: Tool Surface Minimization

**Problem:** The SDK defaults to "allow all" built-in tools. The agent can read files, run shell commands, make web requests, and modify the filesystem — a broad attack surface for production applications.

**Solution:** Explicitly control which tools exist (not just which are allowed):

```typescript
const session = await client.createSession({
    model: "gpt-4.1",

    // Whitelist: ONLY these built-in tools are available
    availableTools: ["read", "search_files", "list_directory"],

    // OR blacklist: everything EXCEPT these
    excludedTools: ["shell", "write", "web_request"],

    // For MCP: expose specific tools only
    mcpServers: {
        "database": {
            type: "local",
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-sqlite", "./data.db"],
            tools: ["read_query"],  // NOT ["*"] — only read, never write
        },
    },
    onPermissionRequest: approveAll,
});
```

**Key distinction:** `availableTools`/`excludedTools` controls **what tools exist in the agent's universe**. Hooks (`onPreToolUse`) control **whether an existing tool is allowed to run in context**. Both layers matter:
- Surface minimization = "the agent doesn't even know `shell` exists"
- Hook-based policy = "the agent knows about `shell` but needs approval to use it"

**When to use:** Any production application. Decide the tool surface at design time, not at runtime.

### Pattern I: Session Governance for Multi-Tenant

**Problem:** In multi-tenant applications (SaaS, shared platforms), sessions from different users/tenants must be isolated, auditable, and have clear lifecycle boundaries.

**Solution:** Enforce structured session IDs and lifecycle policies:

```typescript
// Structured session IDs for auditing and cleanup
const sessionId = `${tenantId}-${userId}-${taskType}-${Date.now()}`;

const session = await client.createSession({
    sessionId,
    model: "gpt-4.1",
    hooks: {
        onSessionStart: async (input) => {
            await auditLog.write({ event: "session_start", tenantId, userId, sessionId });
            return { additionalContext: `Tenant: ${tenantId}. Only access ${tenantId} resources.` };
        },
        onSessionEnd: async (input) => {
            await auditLog.write({ event: "session_end", reason: input.reason, sessionId });
            // Cleanup: delete session workspace if policy requires it
            if (policy.cleanupOnEnd) {
                await fs.rm(session.workspacePath, { recursive: true });
            }
            return null;
        },
    },
    onPermissionRequest: approveAll,
});

// Lifecycle boundary: abort sessions that exceed time limits
setTimeout(() => session.abort(), policy.maxSessionDurationMs);
```

**When to use:** Any multi-user or multi-tenant application. Define clear answers to: "how long can a session live?", "who can access which sessions?", and "what happens to session artifacts when it's done?"

### Pattern J: MCP as Integration Contract

**Problem:** Multiple agent applications across different teams need access to the same enterprise systems (JIRA, ServiceNow, internal APIs). Each team builds bespoke tool integrations.

**Solution:** Standardize enterprise system access through shared MCP servers:

```typescript
// Team A's agent: customer support bot
const supportAgent = await client.createSession({
    mcpServers: {
        "ticketing": { type: "http", url: TICKETING_MCP_URL, tools: ["search_tickets", "update_ticket"] },
        "customer-db": { type: "http", url: CUSTOMER_MCP_URL, tools: ["get_customer", "get_history"] },
    },
    onPermissionRequest: approveAll,
});

// Team B's agent: ops incident responder
const opsAgent = await client.createSession({
    mcpServers: {
        "ticketing": { type: "http", url: TICKETING_MCP_URL, tools: ["create_ticket", "escalate"] },
        "monitoring": { type: "http", url: MONITORING_MCP_URL, tools: ["get_alerts", "get_metrics"] },
    },
    onPermissionRequest: approveAll,
});
// Same ticketing MCP server, different tool subsets per use case
```

**When to use:** Organizations with multiple agent initiatives. The platform team owns MCP servers as infrastructure; application teams consume them via session config.

See [Chapter 12 — MCP as Enterprise Integration Strategy](#chapter-12-mcp-integration) for the full architectural rationale.

### Pattern K: CI/Automation Deployment

**Problem:** You want to run agent workflows in CI/CD pipelines (GitHub Actions, scheduled jobs) — not just in interactive developer environments.

**Solution:** Install Copilot CLI + SDK in the pipeline, authenticate via environment variables, and optionally use Skills for domain-specific behavior:

```yaml
# .github/workflows/agent-task.yml
name: Scheduled Agent Task
on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9am
  workflow_dispatch:       # Manual trigger

jobs:
  run-agent:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Copilot CLI
        run: |
          curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
          # Install copilot CLI (follow official install docs)

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install SDK
        run: npm install @github/copilot-sdk

      - name: Run agent workflow
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npx tsx ./scripts/weekly-report-agent.ts
```

```typescript
// scripts/weekly-report-agent.ts
import { CopilotClient, approveAll } from "@github/copilot-sdk";

const client = new CopilotClient();
const session = await client.createSession({
    model: "gpt-4.1",
    skillDirectories: ["./.copilot_skills/weekly-report"],  // domain context
    tools: [createIssueTool, fetchMetricsTool],
    onPermissionRequest: approveAll,
});

await session.sendAndWait({
    prompt: "Generate this week's engineering status report and create a GitHub issue with the summary.",
});

await client.stop();
process.exit(0);
```

**Key considerations for CI deployments:**
- **Auth**: Use `GITHUB_TOKEN` or `COPILOT_GITHUB_TOKEN` environment variables (no interactive login)
- **Statefulness**: Each CI run is ephemeral — don't rely on session persistence across runs
- **Skills**: Use `skillDirectories` with a `.copilot_skills/` directory in your repo to inject domain-specific prompts and context
- **Timeouts**: Set pipeline-level timeouts; agent sessions can run longer than expected
- **Cost awareness**: Scheduled agents consume premium requests — budget accordingly

**When to use:** Automated code reviews, scheduled report generation, dependency update bots, documentation freshness checks — any agent task that benefits from running on a schedule or as part of a pipeline.

> 🔗 **Workshop**: Patterns are applied throughout the workshop. [Level 5](workshop/level-5/README.md) focuses on hooks-as-policy; [Level 8](workshop/level-8/README.md) capstone projects combine all patterns.

---

## Chapter 14: Gotchas & Pitfalls

A consolidated reference of every gotcha mentioned in this guide plus additional ones. Organized by scope.

### All Languages

| Gotcha | Details |
|---|---|
| **Always call `client.stop()`** | Failing to stop the client orphans the CLI process — it keeps running in the background |
| **`model` is required with BYOK** | The SDK throws an error if you use a `provider` without specifying `model` |
| **Tool `description` quality** | The model uses the description to decide *when* to call your tool. Vague description = tool rarely called |
| **Tool handlers must return JSON-serializable data** | No class instances, circular references, functions, BigInt, or undefined |
| **`sendAndWait` vs `send`** | `sendAndWait` blocks until `session.idle`. Use `send` + events for real-time UIs |
| **Default is "allow all" tools** | The SDK enables all built-in tools by default — shell, file write, Git, web requests |
| **Session cleanup** | Old sessions accumulate at `~/.copilot/session-state/`. Implement periodic cleanup |
| **Compaction loses detail** | Compacted context is a summary — old conversation details may be lost |
| **Tools can run in parallel** | Your handlers must be concurrency-safe. No shared mutable state without synchronization |
| **MCP `tools: ["*"]` is opt-in** | If you forget to set `tools` in MCP config, no MCP tools are available |
| **Azure endpoint `type` confusion** | Native Azure: `type: "azure"` (host only). Azure AI Foundry: `type: "openai"` (full path) |
| **Classic PAT (`ghp_`) not supported** | Use fine-grained PAT (`github_pat_`), OAuth, or `copilot auth login` |
| **Package names changed since announcement** | Early changelog (Jan 14, 2026) used `@github/copilot-cli-sdk`, `copilot`, `copilot-cli-sdk-go`. Current names differ — always follow the repo README for the latest package names |
| **SDK billing** | SDK usage counts toward the same **premium request quota** as Copilot CLI — budget accordingly for automated/high-volume use |
| **`onPermissionRequest` is mandatory** | Since v0.1.28, the SDK denies all permissions by default. Every `createSession()` call must include `onPermissionRequest`. Use the `approveAll` convenience handler for development; implement granular permission logic for production |

### TypeScript-Specific

| Gotcha | Details |
|---|---|
| **Call `process.exit(0)` after `client.stop()`** | The Node.js event loop may hang if you don't exit explicitly |
| **Zod schemas are supported** | `defineTool` accepts Zod objects for type-safe parameters — often better than raw JSON Schema |
| **Typed event handlers** | `session.on("assistant.message", handler)` gives full TypeScript inference — use it |
| **ESM imports** | Ensure your `package.json` has `"type": "module"` or use `.mts` extension |

### Python-Specific

| Gotcha | Details |
|---|---|
| **Fully async** | All SDK methods are `async`. Always use `asyncio.run(main())` |
| **`from __future__ import annotations` breaks Pydantic** | If you use this import, define Pydantic models at **module level**, not inside functions |
| **Use `sys.stdout.write()` + `flush()`** | `print()` adds newlines and may buffer, breaking streaming output |
| **Event type comparison** | Use `event.type == SessionEventType.ASSISTANT_MESSAGE_DELTA` (enum) or `.value` for string comparison |
| **Low-level tool API exists** | If Pydantic feels heavy, use `Tool(name=..., parameters={...}, handler=...)` directly |

### Go-Specific

| Gotcha | Details |
|---|---|
| **Nil-check `DeltaContent` and `Content`** | These are `*string` pointers. Always check `!= nil` before dereferencing |
| **Pointer fields for optional booleans** | Use `copilot.Bool(false)` helper for `AutoStart`, `AutoRestart`, `UseLoggedInUser` |
| **`jsonschema` struct tag** | Use `jsonschema:"description"` (not `json`) for tool parameter descriptions |
| **Channel pattern for completion** | Use `done := make(chan bool)` + `close(done)` with `session.On` for synchronization |
| **Embedded CLI bundler** | Go uniquely supports `go tool bundler` to embed the CLI binary in your application |

### .NET-Specific

| Gotcha | Details |
|---|---|
| **`await using`** | Use it for both `CopilotClient` and sessions — ensures proper cleanup |
| **`AIFunctionFactory.Create()`** | Tools use `Microsoft.Extensions.AI`. Add `[Description]` attributes to parameters |
| **Pattern matching for events** | Use `if (ev is AssistantMessageDeltaEvent deltaEvent)` for type-safe handling |
| **ILogger integration** | Pass a `LoggerFactory`-created logger to `CopilotClientOptions` for structured logging |

> 🔗 **Workshop**: Each level's cheat sheet includes a gotchas section specific to that level's concepts.

---

## Chapter 15: What Makes It Different

### Copilot SDK vs. Other Agent Frameworks

The landscape of agent frameworks is crowded — LangChain, LlamaIndex, CrewAI, AutoGen, Semantic Kernel, and many others. Where does Copilot SDK fit?

### The Opinionated Advantages

#### 1. Production-Tested Agent Runtime

You're not building an agent loop from scratch. The Copilot CLI runtime — the same engine behind GitHub Copilot CLI — handles:
- Multi-step planning and execution
- Tool invocation with error recovery
- Context window management and compaction
- File edit semantics (diff/patch/apply)

This is code that runs at GitHub scale. You inherit it for free.

#### 2. Multi-Model Without Code Changes

Switch models by changing one string:

```typescript
// Same code, different model — just change the model name
await client.createSession({
    model: "gpt-4.1",
    onPermissionRequest: approveAll,
});
await client.createSession({
    model: "gpt-5",
    onPermissionRequest: approveAll,
});
await client.createSession({
    model: "claude-sonnet-4.5",
    onPermissionRequest: approveAll,
});
```

With most agent frameworks, switching models requires adapting to different API shapes, tool-calling formats, and streaming protocols. Copilot SDK abstracts all of that behind the CLI layer.

#### 3. Event-Driven by Design

Most frameworks give you a request-response interface and add streaming as an afterthought. Copilot SDK is **event-driven from the ground up**:
- Every tool call, every token, every state transition is an event
- You can build real-time UIs naturally
- Logging, metrics, and debugging all hook into the event stream

#### 4. Four-Language Parity

TypeScript, Python, Go, and .NET all talk to the same CLI via the same JSON-RPC protocol. Features are identical across languages — you choose based on your platform, not based on SDK maturity.

#### A Note on Community SDKs

Beyond the four official SDKs, community-maintained SDKs exist for languages including **Java, Rust, C++, and Clojure**. These are listed in the Copilot SDK repository but come with an explicit warning: **they are not supported by GitHub.** If you need an SDK for a language not officially covered, these community projects may be useful starting points, but expect differences in feature coverage, API stability, and documentation quality.

#### 5. Built-In Infrastructure

Session persistence, infinite sessions, compaction, workspace artifacts — these are first-class features, not plugins you bolt on. For long-running agent applications, this infrastructure is essential and hard to build yourself.

### The Tradeoffs

#### 1. CLI Dependency

Your application requires the Copilot CLI binary to be installed and accessible. This is a deployment concern:
- CI/CD pipelines need the CLI installed
- Docker images need to include it
- Users of your tool need it on their PATH

(Go mitigates this with the embedded CLI bundler.)

#### 2. Less Customizable Agent Loop

You can't modify the core agent planning/execution logic — it's in the CLI binary. You can only **influence** it (via tools, hooks, system messages). If you need radically different agent behavior (custom planning algorithms, novel tool selection strategies), you may outgrow the SDK.

#### 3. Technical Preview Churn

APIs and behaviors can change. The agent's decision-making may shift with CLI updates. This is fine for internal tools; it's a risk for products you ship to customers.

#### 4. Default Permissions Are Broad

The "allow all tools" default is great for development but requires active hardening for production. Other frameworks often start with zero permissions.

#### 5. Stateful Architecture

The SDK assumes a long-lived process with filesystem access and session state on disk. This may not align with serverless, ephemeral compute, or horizontally-scaled stateless architectures. If your deployment model is "spin up a container, handle one request, discard" — the SDK's session persistence and CLI subprocess model will fight you. See [Chapter 2 — Deployment Topology](#chapter-2-architecture) for practical options.

### When to Use Copilot SDK

✅ **Good fit:**
- Applications that need **code-generation and file-editing** capabilities (the CLI excels at these)
- **Developer tools** (IDEs, CLI assistants, code review bots)
- **Enterprise integrations** that benefit from MCP + hook-based governance
- Projects where you want an agent **quickly** without building infrastructure
- Teams that already use **GitHub ecosystem** (Copilot, Actions, MCP)

⚠️ **Less ideal:**
- Applications with **custom agent planning** requirements
- **Minimal-dependency** environments where the CLI binary is unacceptable
- **Non-coding** agent tasks (customer support, sales) where file-editing capabilities aren't needed
- Applications requiring **Entra ID / managed identity** auth (BYOK limitation)

### The One-Line Summary

Copilot SDK is for developers who want **the power of an agent runtime without building one** — and who are willing to accept an opinionated architecture (CLI subprocess, event-driven, broad defaults) in exchange for rapid development and production-grade infrastructure.

> 🔗 **Workshop**: The [Level 8 capstone projects](workshop/level-8/README.md) push the boundaries of what's possible and help you evaluate whether the SDK fits your specific use case.

---

<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- APPENDIX                                                          -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

# Appendix

---

## Appendix: Workshop Cross-Reference Map

Every guide concept mapped to the workshop exercises where you can practice it hands-on.

### Part I: Foundations

| Guide Chapter | Workshop Level | Exercises |
|---|---|---|
| Ch 1: What Is Copilot SDK? | [Level 1 — Connect](workshop/level-1/README.md) | All (foundational understanding) |
| Ch 2: Architecture (subprocess) | [Level 1](workshop/level-1/README.md) | Ex 1–3 (client creation) |
| Ch 2: Architecture (external CLI) | [Level 7](workshop/level-7/README.md) | Ex 10 (external server mode) |
| Ch 3: Client lifecycle | [Level 1](workshop/level-1/README.md) | Ex 1–3 (create, send, stop) |
| Ch 3: Session operations | [Level 1](workshop/level-1/README.md) | Ex 4–6 (session config, send patterns) |
| Ch 3: Events | [Level 2](workshop/level-2/README.md) | Ex 1–4 (event subscription) |

### Part II: Building with the SDK

| Guide Chapter | Workshop Level | Exercises |
|---|---|---|
| Ch 4: Streaming deltas | [Level 2 — Stream](workshop/level-2/README.md) | Ex 1–4 (delta handling) |
| Ch 4: Token usage | [Level 2](workshop/level-2/README.md) | Ex 9–10 (usage events) |
| Ch 4: Reasoning events | [Level 8 — Mastery](workshop/level-8/README.md) | Ex 5–6 (reasoning deltas) |
| Ch 5: Tool definition | [Level 3 — Tools](workshop/level-3/README.md) | Ex 1–4 (defineTool, JSON Schema) |
| Ch 5: Zod schemas | [Level 3](workshop/level-3/README.md) | Ex 5–6 (Zod patterns) |
| Ch 5: Multi-tool | [Level 3](workshop/level-3/README.md) | Ex 7–8 (multiple tools) |
| Ch 5: Error handling in tools | [Level 3](workshop/level-3/README.md) | Ex 9–10 (tool errors) |
| Ch 6: User input requests | [Level 4 — Interact](workshop/level-4/README.md) | Ex 4–6 (ask_user) |
| Ch 6: Interactive REPL | [Level 4](workshop/level-4/README.md) | Ex 7–9 (REPL patterns) |

### Part III: Control & Safety

| Guide Chapter | Workshop Level | Exercises |
|---|---|---|
| Ch 7: onPreToolUse | [Level 5 — Hooks](workshop/level-5/README.md) | Ex 1–3 (pre-tool hooks) |
| Ch 7: onPostToolUse | [Level 5](workshop/level-5/README.md) | Ex 4–6 (post-tool hooks) |
| Ch 7: onUserPromptSubmitted | [Level 5](workshop/level-5/README.md) | Ex 7–8 (prompt hooks) |
| Ch 7: Lifecycle hooks | [Level 5](workshop/level-5/README.md) | Ex 9–10 (session start/end) |
| Ch 7: Error hooks | [Level 5](workshop/level-5/README.md) | Ex 11–12 (error handling) |
| Ch 8: Security policies | [Level 5](workshop/level-5/README.md) | Ex 3 (tool approval policy) |

### Part IV: Infrastructure

| Guide Chapter | Workshop Level | Exercises |
|---|---|---|
| Ch 9: Authentication | [Level 1](workshop/level-1/README.md) | Ex 7–8 (auth setup) |
| Ch 10: BYOK providers | [Level 7 — Production](workshop/level-7/README.md) | Ex 1–4 (OpenAI, Azure, Anthropic, Ollama) |
| Ch 11: Session persistence | [Level 7](workshop/level-7/README.md) | Ex 5–7 (persist, resume) |
| Ch 11: Infinite sessions | [Level 7](workshop/level-7/README.md) | Ex 8–9 (compaction, tuning) |
| Ch 12: MCP (local) | [Level 6 — Context](workshop/level-6/README.md) | Ex 1–2 (local MCP servers) |
| Ch 12: MCP (remote) | [Level 6](workshop/level-6/README.md) | Ex 3–4 (remote MCP, GitHub) |
| Ch 12: Custom agents | [Level 6](workshop/level-6/README.md) | Ex 5–6 (specialized AI personas) |
| Ch 12: Skills | [Level 6](workshop/level-6/README.md) | Ex 7–8 (reusable skill directories) |

### Part V: Mastery

| Guide Chapter | Workshop Level | Exercises |
|---|---|---|
| Ch 13: Production patterns | [Level 8 — Mastery](workshop/level-8/README.md) | Ex 9–12 (capstone projects) |
| Ch 14: Gotchas | All levels | Each level's cheat sheet |
| Ch 15: Framework comparison | [Level 8](workshop/level-8/README.md) | Ex 9–12 (capstone evaluation) |

---

## References

| Resource | Link |
|---|---|
| Copilot SDK Repository | [github.com/github/copilot-sdk](https://github.com/github/copilot-sdk) |
| Node.js/TypeScript SDK | [nodejs/README.md](https://github.com/github/copilot-sdk/blob/main/nodejs/README.md) |
| Python SDK | [python/README.md](https://github.com/github/copilot-sdk/blob/main/python/README.md) |
| Go SDK | [go/README.md](https://github.com/github/copilot-sdk/blob/main/go/README.md) |
| .NET SDK | [dotnet/README.md](https://github.com/github/copilot-sdk/blob/main/dotnet/README.md) |
| Getting Started Guide | [docs/getting-started.md](https://github.com/github/copilot-sdk/blob/main/docs/getting-started.md) |
| Authentication Docs | [docs/auth/index.md](https://github.com/github/copilot-sdk/blob/main/docs/auth/index.md) |
| BYOK Docs | [docs/auth/byok.md](https://github.com/github/copilot-sdk/blob/main/docs/auth/byok.md) |
| Hooks Docs | [docs/hooks/overview.md](https://github.com/github/copilot-sdk/blob/main/docs/hooks/overview.md) |
| MCP Docs | [docs/mcp/overview.md](https://github.com/github/copilot-sdk/blob/main/docs/mcp/overview.md) |
| MCP Debugging Guide | [docs/mcp/debugging.md](https://github.com/github/copilot-sdk/blob/main/docs/mcp/debugging.md) |
| Debugging Guide | [docs/debugging.md](https://github.com/github/copilot-sdk/blob/main/docs/debugging.md) |
| MCP Servers Directory | [github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) |
| Copilot CLI Installation | [docs.github.com](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli) |
| Copilot CLI Configuration | [docs.github.com](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-cli/set-up-copilot-cli/configure-copilot-cli) |
| Copilot SDK Announcement | [GitHub Blog](https://github.blog/news-insights/company-news/build-an-agent-into-any-app-with-the-github-copilot-sdk/) |
| Copilot SDK Changelog | [GitHub Changelog](https://github.blog/changelog/2026-01-14-copilot-sdk-in-technical-preview/) |
| Hooks Tutorial | [docs.github.com](https://docs.github.com/en/copilot/tutorials/copilot-cli-hooks) |
| Repository-Level Hooks | [docs.github.com](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/use-hooks) |

---

*This guide accompanies the [Workshop](workshop/README.md) — 96 hands-on exercises across 8 levels. Together they provide both the conceptual understanding and practical skills to build production-ready applications with GitHub Copilot SDK.*

