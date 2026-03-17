---
layout: step
title: "Level 7: Production — Auth, Persistence & Config"
step_number: 7
permalink: /steps/7/
---

# Level 7: Production — Auth, Persistence & Deployment Readiness

> **Risk level:** 🟠 High — BYOK exercises use real API keys. **Never commit keys to source code.** Always use environment variables. Session persistence writes state files to disk.

## Learning Objectives

By the end of this level, you will be able to:

1. Explain the 6-level authentication priority chain and choose the right method
2. Configure BYOK with OpenAI using your own API key
3. Set up BYOK with local Ollama for zero-cost, fully offline development
4. Navigate the critical Azure OpenAI type distinction (native vs Foundry)
5. Implement session persistence with `sessionId` and `resumeSession()`
6. Design structured session IDs for auditing, cleanup, and access control
7. Configure infinite sessions with auto-compaction thresholds
8. Run multiple parallel sessions with different models using `Promise.all`
9. Connect to an externally-managed CLI process via `cliUrl`
10. Implement production error recovery with retry, skip, and abort strategies
11. Build a logging and observability pipeline with debug logs and usage events
12. Combine all production patterns into a deployment-ready standup bot

---

## Prerequisites

- [ ] **Level 6 completed** (you can use MCP servers, custom agents, and skills)
- [ ] Node.js 20+, Copilot CLI installed and authenticated
- [ ] This repository cloned locally
- [ ] (Optional) OpenAI API key for Exercise 2
- [ ] (Optional) Ollama installed for Exercise 3

---

## Workshop Structure

This level contains **12 exercises**. Estimated time: **75–100 minutes**.

| Exercise | Topic | Time |
|----------|-------|------|
| 1 | Authentication Deep Dive | 7 min |
| 2 | BYOK with OpenAI | 7 min |
| 3 | BYOK with Ollama (Local) | 7 min |
| 4 | BYOK with Azure OpenAI | 5 min |
| 5 | Session Persistence Basics | 7 min |
| 6 | Session ID Strategies | 5 min |
| 7 | Infinite Sessions | 7 min |
| 8 | Multiple Parallel Sessions | 5 min |
| 9 | External CLI Mode | 5 min |
| 10 | Error Recovery Patterns | 7 min |
| 11 | Logging and Observability | 7 min |
| 12 | Capstone: Production-Grade Standup Bot | 10 min |

---

## Exercise 1: Authentication Deep Dive

### Goal
Understand the complete authentication priority chain — which method wins when multiple are configured.

### Steps

**1.1** Navigate to the sample app and install dependencies:

```bash
cd workshop/level-7/sample-app
npm install
```

**1.2** Run the auth demo:

```bash
npm run auth
```

**1.3** Observe which environment variables are currently set and the auth priority chain printed.

**1.4** The complete priority chain (highest to lowest):

| Priority | Method | Config |
|:--------:|--------|--------|
| 1 | Explicit token | `new CopilotClient({ githubToken: "gho_..." })` |
| 2 | `COPILOT_GITHUB_TOKEN` | `export COPILOT_GITHUB_TOKEN=gho_...` |
| 3 | `GH_TOKEN` | `export GH_TOKEN=gho_...` |
| 4 | `GITHUB_TOKEN` | `export GITHUB_TOKEN=gho_...` |
| 5 | Stored OAuth | `copilot auth login` (interactive) |
| 6 | GitHub CLI | `gh auth login` |

**1.5** Key deployment scenarios:

| Scenario | Recommended Method |
|----------|-------------------|
| Local development | `copilot auth login` (stored OAuth) |
| CI/CD pipelines | `GITHUB_TOKEN` env var (from secrets) |
| Multi-tenant apps | Explicit `githubToken` (per-user tokens) |
| Docker containers | `COPILOT_GITHUB_TOKEN` env var |

### Key Concept

> 💡 **Higher priority wins silently.** If you set `GITHUB_TOKEN` as an env var AND have `copilot auth login` credentials, the env var wins — and you won't see a warning. Use `logLevel: "debug"` to verify which auth method is actually being used.

### ✅ Checkpoint
You can list all 6 auth methods in priority order and choose the right one for a given deployment scenario.

---

## Exercise 2: BYOK with OpenAI

### Goal
Use your own OpenAI API key instead of a GitHub Copilot subscription.

### Steps

**2.1** Run the BYOK OpenAI demo:

```bash
npm run openai
```

If you don't have an API key, the script prints the configuration reference and exits gracefully.

**2.2** To run with a real key:

```bash
export OPENAI_API_KEY=sk-your-key-here
npm run openai
```

**2.3** Open `byok-openai.ts` and study the `provider` config:

```typescript
import { CopilotClient, approveAll } from "@github/copilot-sdk";

const session = await client.createSession({
  model: "gpt-4",          // model is REQUIRED with BYOK
  onPermissionRequest: approveAll,
  provider: {
    type: "openai",
    baseUrl: "https://api.openai.com/v1",
    apiKey: process.env.OPENAI_API_KEY,
  },
});
```

**2.4** Critical BYOK rules:

| Rule | Why |
|------|-----|
| `model` is **required** | SDK throws without it (can't auto-detect with BYOK) |
| `onPermissionRequest: approveAll` is **required** | Since v0.1.32, sessions won't execute tools without a permission handler |
| Never hardcode `apiKey` | Use `process.env.OPENAI_API_KEY` |
| `type` must match provider | `"openai"` for OpenAI, `"azure"` for native Azure |

### Key Concept

> 💡 **BYOK = freedom from Copilot subscription.** With `provider` config, you use any OpenAI-compatible API directly. The SDK still provides tools, hooks, streaming, and the full agent runtime — you're just swapping the model backend. No Copilot subscription needed.

### ✅ Checkpoint
You understand the `provider` config shape and know that `model` is required with BYOK.

---

## Exercise 3: BYOK with Ollama (Local)

### Goal
Run LLMs locally on your own hardware — zero cost, fully offline, unlimited experimentation.

### Steps

**3.1** Run the Ollama demo:

```bash
npm run ollama
```

The script auto-detects whether Ollama is running and lists available models.

**3.2** If Ollama isn't installed:

```bash
# macOS
brew install ollama

# Or download from https://ollama.com

# Pull a model
ollama pull llama3

# Ollama starts automatically on http://localhost:11434
```

**3.3** Open `byok-ollama.ts` and study the config:

```typescript
onPermissionRequest: approveAll,       // Required since v0.1.32
provider: {
  type: "openai",                      // Ollama uses OpenAI-compatible protocol
  baseUrl: "http://localhost:11434/v1", // Local endpoint
  // No apiKey needed — it's your own hardware
},
```

**3.4** Key insight: Ollama speaks the **OpenAI-compatible API**, so `type` is `"openai"` (not a separate `"ollama"` type). The SDK doesn't know or care that it's talking to a local model.

**3.5** Why Ollama is valuable for SDK development:
- **Zero cost** — no API charges for experimentation
- **Fully offline** — works without internet
- **Fast iteration** — test tool definitions rapidly without rate limits
- **Privacy** — data never leaves your machine

### Key Concept

> 💡 **Ollama = your local AI lab.** Use it to test tool definitions, hook logic, and application flows without spending API credits. The experience is identical to cloud models — the SDK doesn't distinguish between local and remote. Switch to a cloud model for production by changing 2 lines of config.

### ✅ Checkpoint
You know the Ollama provider config (type: `"openai"`, baseUrl: `localhost:11434/v1`, no apiKey) and why local LLMs are valuable for development.

---

## Exercise 4: BYOK with Azure OpenAI

### Goal
Navigate the critical distinction between Azure's two endpoint styles — getting this wrong is the #1 Azure BYOK error.

### Steps

**4.1** Run the Azure config reference:

```bash
npm run azure
```

**4.2** Study the two styles side by side:

**Style 1 — Native Azure OpenAI:**
```typescript
onPermissionRequest: approveAll,                  // Required since v0.1.32
provider: {
  type: "azure",                                  // ← "azure" NOT "openai"
  baseUrl: "https://my-resource.openai.azure.com", // Host only — NO /openai/v1
  apiKey: process.env.AZURE_OPENAI_KEY,
}
```

**Style 2 — Azure AI Foundry:**
```typescript
onPermissionRequest: approveAll,                                // Required since v0.1.32
provider: {
  type: "openai",                                              // ← "openai" NOT "azure"
  baseUrl: "https://your-resource.openai.azure.com/openai/v1/", // Full path WITH /openai/v1/
  apiKey: process.env.AZURE_AI_FOUNDRY_KEY,
}
```

**4.3** The decision matrix:

| Your Endpoint URL | Contains `/openai/v1/`? | Use `type` |
|-------------------|:----------------------:|-----------|
| `https://resource.openai.azure.com` | No | `"azure"` |
| `https://resource.openai.azure.com/openai/v1/` | Yes | `"openai"` |

**4.4** Wrong type = connection error. There's no helpful error message — it just fails.

### Key Concept

> 💡 **Check the URL path to choose the type.** If your Azure endpoint URL ends with just the host (no path), use `type: "azure"`. If it includes `/openai/v1/`, use `type: "openai"`. This is the single most common BYOK configuration error.

### ✅ Checkpoint
You can determine the correct `type` value by looking at your Azure endpoint URL.

---

## Exercise 5: Session Persistence Basics

### Goal
Save and resume conversations across application restarts using `sessionId` and `resumeSession()`.

### Steps

**5.1** Run the persistence demo:

```bash
npm run persist
```

**5.2** Observe the two phases:

```
=== Phase 1: Initial session ===
(Sends: "Remember my name is Alex and I like TypeScript")
--- Client stopped (simulating restart) ---

=== Phase 2: Resumed session ===
(Asks: "What's my name and favorite language?")
(Model answers correctly — context was persisted!)
```

**5.3** Open `session-persist.ts` and study the key APIs:

```typescript
import { CopilotClient, approveAll } from "@github/copilot-sdk";

// Phase 1: Create with a stable sessionId
const session1 = await client.createSession({
  sessionId: "demo-user-standup-2024-01-15",  // ← Enables persistence
  model: "gpt-4.1",
  onPermissionRequest: approveAll,
});
await session1.sendAndWait({ prompt: "Remember this..." });
await client1.stop();

// Phase 2: Resume later (even after restart)
const session2 = await client2.resumeSession("demo-user-standup-2024-01-15");
await session2.sendAndWait({ prompt: "What did I say?" });
```

**5.4** Where data is stored:

```
~/.copilot/session-state/
└── demo-user-standup-2024-01-15/
    ├── conversation history
    ├── tool results
    └── agent plan
```

**5.5** What persists vs what doesn't:

| Persists ✅ | Doesn't Persist ❌ |
|-------------|-------------------|
| Conversation history | API keys (re-provide for BYOK) |
| Tool results | In-memory tool state |
| Agent plan + artifacts | Event handler registrations |

### Key Concept

> 💡 **`sessionId` + `resumeSession()` = conversation memory across restarts.** This is what makes the SDK suitable for production: scheduled bots can resume where they left off, users can return to conversations, and long-running tasks survive process restarts.
>
> 💡 **Mid-session model switching.** Since v0.1.30, you can change the model without creating a new session: `await session.setModel("gpt-4.1-mini")`. This is useful for switching to a cheaper model for simple follow-up questions.

### ✅ Checkpoint
You resumed a conversation that preserved context across a client stop/restart cycle.

---

## Exercise 6: Session ID Strategies

### Goal
Design session IDs that enable auditing, cleanup, and access control.

### Steps

**6.1** Good session ID patterns:

| Pattern | Example | Benefit |
|---------|---------|---------|
| `{userId}-{task}-{date}` | `alice-standup-2024-01-15` | Easy to find, audit, clean up |
| `{teamId}-{feature}-{pr}` | `frontend-review-pr-42` | Links to project context |
| `{service}-{requestId}` | `api-req-abc123` | Correlates with other systems |

**6.2** Anti-patterns:

| ❌ Anti-Pattern | Why It's Bad |
|----------------|-------------|
| Random UUIDs (`a1b2c3d4-...`) | Can't find, can't audit, can't clean up |
| Reusing same ID forever | Old context contaminates new conversations |
| User input as ID | Injection risk, unpredictable characters |
| No date component | Can't implement retention policies |

**6.3** In `session-persist.ts`, see the structured pattern:

```typescript
const sessionId = `${userId}-standup-${date}`;
// → "demo-user-standup-2024-01-15"
```

**6.4** Cleanup strategy: periodically delete old session directories:

```bash
# Delete sessions older than 30 days
find ~/.copilot/session-state/ -maxdepth 1 -mtime +30 -exec rm -rf {} \;
```

### Key Concept

> 💡 **Session IDs are your audit trail.** A structured ID like `alice-standup-2024-01-15` tells you WHO (alice), WHAT (standup), and WHEN (2024-01-15). Random UUIDs tell you nothing. Design IDs for the person who'll debug a problem at 3 AM.

### ✅ Checkpoint
You can design a session ID pattern for a given use case and explain why random UUIDs are an anti-pattern.

---

## Exercise 7: Infinite Sessions

### Goal
Configure automatic context compaction for conversations that might exceed the model's context window.

### Steps

**7.1** Run the infinite session demo:

```bash
npm run infinite
```

**7.2** Observe token counts growing across prompts. With enough prompts, compaction would kick in.

**7.3** Open `infinite-session.ts` and study the config:

```typescript
infiniteSessions: {
  enabled: true,
  backgroundCompactionThreshold: 0.80,  // Start compacting at 80% context
  bufferExhaustionThreshold: 0.95,       // Block at 95% until compacted
},
```

**7.4** How compaction works:

```
Context window: [████████████████████░░░░░] 80% → compaction starts
                [████████░░░░░░░░░░░░░░░░░] older messages summarized
                [████████████████░░░░░░░░░] new messages added to summary
```

**7.5** The two thresholds:

| Threshold | Value | Effect |
|-----------|------:|--------|
| `backgroundCompactionThreshold` | 0.80 | Start compacting in background (non-blocking) |
| `bufferExhaustionThreshold` | 0.95 | Block new messages until compaction finishes |

**7.6** When to use infinite sessions:
- ✅ Long-running automated agents
- ✅ Multi-day conversations (with persistence)
- ✅ Support bots with extensive history
- ❌ Short scripts (overhead not worth it)
- ❌ Single-prompt Q&A

### Key Concept

> 💡 **Infinite sessions prevent context overflow.** Without them, a long conversation fills the context window and fails. With them, older messages are automatically summarized to make room. The model loses some detail from early messages but can continue indefinitely.

### ✅ Checkpoint
You understand the two thresholds (80% background, 95% blocking) and when to enable infinite sessions.

---

## Exercise 8: Multiple Parallel Sessions

### Goal
Run independent conversations simultaneously using `Promise.all` — useful for model comparison and parallel workloads.

### Steps

**8.1** Run the parallel sessions demo:

```bash
npm run parallel
```

**8.2** Observe: both responses arrive at roughly the same time, because they ran in parallel:

```
=== gpt-4.1 ===
  Keep it simple and avoid premature optimization.

=== gpt-4.1-mini ===
  Write clean, maintainable code with good tests.

Both completed in 1850ms (parallel, not sequential)
```

**8.3** Open `parallel-sessions.ts` and study the pattern:

```typescript
const session1 = await client.createSession({ model: "gpt-4.1", onPermissionRequest: approveAll });
const session2 = await client.createSession({ model: "gpt-4.1-mini", onPermissionRequest: approveAll });

const [response1, response2] = await Promise.all([
  session1.sendAndWait({ prompt }),
  session2.sendAndWait({ prompt }),
]);
```

**8.4** Key: sessions are **completely independent**. They don't share conversation history, tools, or hooks.

**8.5** Use cases:
- **Model comparison**: Same prompt → different models → compare quality/speed
- **Parallel workloads**: Different tasks running simultaneously
- **A/B testing**: Two system messages → compare behavior

### Key Concept

> 💡 **Parallel sessions share a client but nothing else.** Each session has its own conversation history, tool set, and hook configuration. `Promise.all` lets you run them concurrently — much faster than sequential for independent tasks.

### ✅ Checkpoint
You ran two sessions in parallel and understand that they're independent (no shared state).

---

## Exercise 9: External CLI Mode

### Goal
Connect to a separately-running CLI process instead of having the SDK spawn one.

### Steps

**9.1** Run the config reference:

```bash
npm run external
```

**9.2** Study the two-step process:

**Step 1** — Start the CLI externally:
```bash
copilot --headless --port 3000
```

**Step 2** — Connect from your code:
```typescript
const client = new CopilotClient({
  cliUrl: "http://localhost:3000",
});
```

**9.3** When to use external CLI mode:

| Scenario | Benefit |
|----------|---------|
| Multiple SDK clients | Share one CLI process (save memory) |
| Debugging | Inspect CLI logs independently |
| Containers | CLI as a sidecar, app in main container |
| Load testing | One CLI handles concurrent connections |

**9.4** Compare with default mode:

| Aspect | Default | External |
|--------|---------|----------|
| CLI lifecycle | SDK manages (auto start/stop) | You manage |
| Config | `new CopilotClient()` | `new CopilotClient({ cliUrl })` |
| Complexity | Simple | More setup |
| Best for | Development, single apps | Production, multi-client |

### Key Concept

> 💡 **External CLI separates concerns.** The default mode (SDK spawns CLI) is perfect for development. External mode (you manage CLI) is for production scenarios where you need resource sharing, independent lifecycle management, or container orchestration.

### ✅ Checkpoint
You can explain when external CLI mode is preferable and know the two-step setup (headless CLI + cliUrl).

---

## Exercise 10: Error Recovery Patterns

### Goal
Implement production-grade error recovery that retries transient failures, skips non-critical errors, and aborts gracefully.

### Steps

**10.1** Run the error recovery demo:

```bash
npm run recovery
```

**10.2** Open `error-recovery.ts` and study the strategy matrix:

```typescript
onErrorOccurred: async (input) => {
  // Rate limits → retry
  if (input.errorContext === "model_call" && input.error.includes("rate")) {
    return { errorHandling: "retry", retryCount: 3 };
  }
  // Tool failures → skip
  if (input.errorContext === "tool_execution" && input.recoverable) {
    return { errorHandling: "skip" };
  }
  // System errors → abort
  if (input.errorContext === "system") {
    return { errorHandling: "abort" };
  }
  return null;
},
```

**10.3** Production recovery matrix:

| Context | Error Type | Strategy | `retryCount` |
|---------|-----------|----------|:------------:|
| `model_call` | Rate limit | Retry | 3 |
| `model_call` | Network timeout | Retry | 2 |
| `tool_execution` | Handler threw | Skip | — |
| `system` | CLI crashed | Abort | — |
| `user_input` | Invalid input | Skip | — |

**10.4** Always include `userNotification` so the user knows what's happening:

```typescript
return {
  errorHandling: "retry",
  retryCount: 3,
  userNotification: "Rate limit hit. Retrying in a moment...",
};
```

### Key Concept

> 💡 **Error recovery turns fragile demos into reliable applications.** Without `onErrorOccurred`, a single rate limit kills your app. With it, the app retries automatically, skips non-critical failures, and shuts down gracefully on fatal errors — all while keeping the user informed.

### ✅ Checkpoint
You can implement a recovery strategy matrix that matches error context to the right response (retry/skip/abort).

---

## Exercise 11: Logging and Observability

### Goal
Build a structured logging pipeline combining debug logs, usage events, and custom audit hooks.

### Steps

**11.1** The three layers of observability:

**Layer 1 — Debug logging** (SDK-level):
```typescript
const client = new CopilotClient({ logLevel: "debug" });
// Shows ALL JSON-RPC traffic — useful for debugging, too verbose for production
```

**Layer 2 — Usage events** (per-response):
```typescript
session.on("assistant.usage", (e) => {
  log(`Tokens: ${e.data.inputTokens} in + ${e.data.outputTokens} out`);
});
```

**Layer 3 — Custom audit hooks** (per-tool):
```typescript
hooks: {
  onPreToolUse: async (input) => {
    log(`Tool called: ${input.toolName}(${JSON.stringify(input.toolArgs)})`);
    return { permissionDecision: "allow" };
  },
}
```

**11.2** In `standup-bot.ts`, all three layers work together:

```typescript
// Log array for structured logging
const logs: string[] = [];
function log(msg: string) {
  logs.push(`${new Date().toISOString()} ${msg}`);
}
```

**11.3** Production logging checklist:

| What to Log | Where | Why |
|------------|-------|-----|
| Session start/end | `onSessionStart`/`End` | Lifecycle tracking |
| Every prompt | `onUserPromptSubmitted` | Audit trail |
| Every tool call | `onPreToolUse` | Security audit |
| Token usage | `assistant.usage` | Cost management |
| Errors | `onErrorOccurred` | Debugging |

**11.4** In production, send logs to a logging service instead of an array:

```typescript
// Instead of: logs.push(entry)
// Use:        await cloudwatch.putLogEvents(entry)
//             await datadog.log(entry)
//             console.log(JSON.stringify(entry))  // for container stdout
```

### Key Concept

> 💡 **Observability = debug logs + usage events + audit hooks.** Debug logs show wire protocol (development). Usage events track costs (always). Audit hooks record actions (compliance). Layer all three for a production application that's debuggable, cost-aware, and auditable.

### ✅ Checkpoint
You can describe the 3 observability layers and know what to log at each lifecycle point.

---

## Exercise 12: Capstone: Production-Grade Standup Bot

### Goal
Experience every Level 7 concept combined into a deployment-ready application.

### Steps

**12.1** Run the standup bot:

```bash
npm run standup
```

**12.2** Have a standup conversation:

```
Assistant: Good morning! Let's start the standup. What did you work on yesterday?

You: I fixed the authentication bug and reviewed 3 PRs
  → record_today_plan tool called

You: Today I'll work on the API rate limiting feature
  → record_today_plan tool called

You: I'm blocked on the database migration — need DBA approval
  → flag_blocker tool called

You: exit
  → Summary printed: plan items, blockers, token count
```

**12.3** Open `standup-bot.ts` and identify all Level 7 features:

| Feature | Config/Code | Production Pattern |
|---------|------------|-------------------|
| Session persistence | `sessionId: "team-standup-${date}"` | Resume yesterday's context |
| Structured session ID | `{team}-standup-{date}` | Auditable, cleanable |
| Custom tools (3) | `get_yesterday_items`, `record_today_plan`, `flag_blocker` | Standup workflow |
| Error recovery | `onErrorOccurred` with retry | Handle transient failures |
| Structured logging | `log()` function with timestamps | Audit trail |
| Usage tracking | `assistant.usage` events | Cost monitoring |
| Signal handling | `process.on("SIGINT")` | Clean shutdown with summary |

**12.4** Try pressing Ctrl+C at any point — you'll get a clean summary:

```
📋 Standup Summary:
  Yesterday: not recorded
  Today: API rate limiting feature
  Blockers: database migration — need DBA approval

📊 Session: 4 turns, 523 tokens
📋 Log entries: 8
```

### Key Concept

> 💡 **Production readiness = auth + persistence + error recovery + logging.** A production SDK application handles authentication gracefully, persists conversations, recovers from errors, and logs everything. The standup bot demonstrates all four — it could run as a daily cron job, a Slack bot, or a CI/CD step.

### ✅ Checkpoint
You ran the standup bot, saw persistence + tools + error recovery + logging working together, and understand how to deploy it.

---

## Self-Assessment

Rate yourself 1–3 on each skill:

| # | Skill | 1 | 2 | 3 |
|---|-------|---|---|---|
| 1 | I can list the 6 auth methods in priority order | ☐ | ☐ | ☐ |
| 2 | I can configure BYOK with OpenAI | ☐ | ☐ | ☐ |
| 3 | I can set up BYOK with Ollama (local) | ☐ | ☐ | ☐ |
| 4 | I can choose the right Azure `type` based on the URL | ☐ | ☐ | ☐ |
| 5 | I can persist and resume sessions with `sessionId` | ☐ | ☐ | ☐ |
| 6 | I can design structured session IDs | ☐ | ☐ | ☐ |
| 7 | I can configure infinite sessions with compaction thresholds | ☐ | ☐ | ☐ |
| 8 | I can run parallel sessions with `Promise.all` | ☐ | ☐ | ☐ |
| 9 | I can connect to an external CLI with `cliUrl` | ☐ | ☐ | ☐ |
| 10 | I can implement retry/skip/abort error recovery | ☐ | ☐ | ☐ |
| 11 | I can build a 3-layer observability pipeline | ☐ | ☐ | ☐ |
| 12 | I can build a production-grade application | ☐ | ☐ | ☐ |

**Scoring:**
```
1 = I need to revisit this
2 = I can do this with reference
3 = I can do this from memory

Score: __/36
  30+ (≥ 83%) → Proceed to Level 8 ✅
  24-29 (67-80%) → Review weak areas, then proceed
  < 24 (< 67%) → Repeat key exercises before continuing
```

---

## What's Next?

In **[Level 8: Mastery](../level-8/README.md)**, you'll learn the remaining advanced SDK features — **image attachments**, **reasoning events**, and **reasoning effort control** — then build 4 substantial real-world projects that synthesize everything from Levels 1–7. This is the capstone level: design, build, and present your own SDK application.
