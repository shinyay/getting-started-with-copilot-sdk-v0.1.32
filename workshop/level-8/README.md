# Level 8: Mastery — Advanced Features & Real-World Projects

> **Risk level:** 🔴 High Awareness — Full autonomy. You are building real applications that may access filesystems, call APIs, and use real credentials. Apply all security and production patterns from previous levels.

## Learning Objectives

By the end of this level, you will be able to:

1. Send images to the model for analysis using `attachments`
2. Subscribe to reasoning events to observe the model's chain-of-thought
3. Configure `reasoningEffort` to balance quality against token cost
4. Use advanced client options (`useLoggedInUser`, `cliPath`) for deployment
5. Build a weather assistant combining streaming + tools + error recovery
6. Build a code review agent combining hooks + MCP + agents + persistence
7. Build an interactive quiz combining tools + system messages + user input
8. Build a documentation assistant combining MCP + skills + persistence
9. Compare models side-by-side using parallel sessions
10. Write testable SDK applications with extracted handlers and assertions
11. Apply a security hardening checklist to any SDK application
12. Design, build, and present your own SDK application from scratch

---

## Prerequisites

- [ ] **Level 7 completed** (you can configure BYOK, persistence, and production patterns)
- [ ] Node.js 20+, Copilot CLI installed and authenticated
- [ ] Level 6 sample-app installed (for MCP exercises: `cd ../level-6/sample-app && npm install`)
- [ ] This repository cloned locally

---

## Workshop Structure

This level contains **12 exercises** in three sections. Estimated time: **90–120 minutes**.

**Section A: Advanced Features** (Exercises 1–4)
| Exercise | Topic | Time |
|----------|-------|------|
| 1 | Image Analysis with Attachments | 7 min |
| 2 | Reasoning Events & Chain-of-Thought | 7 min |
| 3 | `reasoningEffort` Configuration | 5 min |
| 4 | Advanced Client Options | 5 min |

**Section B: Guided Projects** (Exercises 5–8)
| Exercise | Topic | Levels Combined | Time |
|----------|-------|:---------------:|------|
| 5 | Project: Weather Assistant | L2+L3+L7 | 10 min |
| 6 | Project: Code Review Agent | L5+L6+L7 | 10 min |
| 7 | Project: Interactive Quiz | L3+L4 | 10 min |
| 8 | Project: Documentation Assistant | L6+L7 | 10 min |

**Section C: Cross-Cutting Concerns** (Exercises 9–12)
| Exercise | Topic | Time |
|----------|-------|------|
| 9 | Multi-Model Comparison | 7 min |
| 10 | Testing SDK Applications | 10 min |
| 11 | Security Hardening Checklist | 7 min |
| 12 | Capstone: Design & Build Your Own | 15 min |

---

## Section A: Advanced Features

### Exercise 1: Image Analysis with Attachments

#### Goal
Send an image to the model and receive a description of its contents.

#### Steps

**1.1** Navigate to the sample app and install dependencies:

```bash
cd workshop/level-8/sample-app
npm install
```

**1.2** Create a test image (see `sample-images/README.md` for options):

```bash
# Option: download a placeholder image
curl -o sample-images/diagram.png https://via.placeholder.com/400x200.png?text=SDK+Architecture
```

**1.3** Run the image attachment demo:

```bash
npm run image
```

If no image exists, the script prints the configuration reference and exits gracefully.

**1.4** Open `image-attachments.ts` and study the attachment config:

```typescript
await session.sendAndWait({
  prompt: "Describe what you see in this image.",
  attachments: [{ type: "file", path: "./sample-images/diagram.png" }],
});
```

**1.5** Key points:

| Field | Type | Description |
|-------|------|-------------|
| `attachments` | `Array` | List of attachments to include |
| `type` | `"file"` | Currently only file type is supported |
| `path` | `string` | Path to the image file |

**1.6** Supported formats: PNG, JPG, GIF, WebP. Multiple images can be sent in one prompt.

#### Key Concept

> 💡 **Images are just another input.** The `attachments` array lets you include files alongside your text prompt. The model analyzes the image and responds based on what it sees. This enables use cases like diagram analysis, screenshot debugging, and visual documentation review.

#### ✅ Checkpoint
The model described the contents of your image, and you understand the `attachments` config shape.

---

### Exercise 2: Reasoning Events & Chain-of-Thought

#### Goal
Observe the model's thinking process by subscribing to reasoning events that fire before the main response.

#### Steps

**2.1** Run the reasoning events demo:

```bash
npm run reasoning
```

**2.2** Observe: reasoning tokens may appear (in dim text) before the response. Not all models emit them.

**2.3** Open `reasoning-events.ts` and study the two event types:

```typescript
// Reasoning: model's thinking process (fires BEFORE response)
session.on("assistant.reasoning_delta", (event) => {
  process.stdout.write(event.data.deltaContent); // Streaming thinking
});

session.on("assistant.reasoning", (event) => {
  console.log("Reasoning:", event.data.content); // Complete thinking
});

// Response: the actual answer (fires AFTER reasoning)
session.on("assistant.message_delta", (event) => {
  process.stdout.write(event.data.deltaContent);
});
```

**2.4** Event ordering with reasoning:

```
1. assistant.reasoning_delta  ×N   (thinking chunks — if model supports it)
2. assistant.reasoning         ×1   (complete thinking)
3. assistant.message_delta     ×N   (response chunks)
4. assistant.message           ×1   (complete response)
5. assistant.usage             ×1   (token counts — includes reasoning tokens)
6. session.idle                ×1   (done)
```

**2.5** Use cases for reasoning events:
- **Transparency**: Show users how the model arrived at its answer
- **Debugging**: Understand why the model made a particular decision
- **Quality assurance**: Verify the model's logic before trusting the output

#### Key Concept

> 💡 **Reasoning events reveal the model's thought process.** Like showing your work in math class, reasoning tokens let you see the model's step-by-step logic. This is invaluable for debugging tool selection, validating complex answers, and building trust with users.

#### ✅ Checkpoint
You understand the two reasoning event types and their position in the event timeline (before response events).

---

### Exercise 3: `reasoningEffort` Configuration

#### Goal
Control how much thinking the model does before responding — balancing quality against token cost.

#### Steps

**3.1** Run the reasoning effort demo:

```bash
npm run effort
```

**3.2** Open `reasoning-effort.ts` and see the config:

```typescript
const session = await client.createSession({
  model: "gpt-4.1",
  onPermissionRequest: approveAll,
  reasoningEffort: "high",  // "low" | "medium" | "high"
});
```

**3.3** The tradeoff:

| Effort | Thinking Depth | Quality | Token Cost | Speed |
|--------|:-------------:|:-------:|:----------:|:-----:|
| `"low"` | Minimal | Fast answers | Lower | Faster |
| `"medium"` | Balanced | Good answers | Moderate | Medium |
| `"high"` | Thorough | Best answers | Higher | Slower |

**3.4** When to use each level:

| Scenario | Effort | Why |
|----------|--------|-----|
| Simple Q&A, lookups | `"low"` | Thinking isn't needed |
| General conversation | `"medium"` | Good balance |
| Complex reasoning, math, code analysis | `"high"` | Quality matters more than speed |

**3.5** Note: not all models support `reasoningEffort`. If unsupported, the setting is silently ignored.

#### Key Concept

> 💡 **`reasoningEffort` is a cost-quality dial.** In production, default to `"medium"` for general use. Use `"high"` for tasks where accuracy is critical (security reviews, financial calculations). Use `"low"` for high-volume, low-complexity tasks where speed matters.

#### ✅ Checkpoint
You understand the 3 effort levels and can choose the right one for a given scenario.

---

### Exercise 4: Advanced Client Options

#### Goal
Know all `CopilotClient` constructor options and their deployment use cases.

#### Steps

**4.1** Run the client options reference:

```bash
npm run options
```

**4.2** Study the complete option set:

```typescript
const client = new CopilotClient({
  logLevel: "debug",                         // L1: Logging
  githubToken: "gho_...",                    // L1/L7: Explicit auth
  useLoggedInUser: true,                     // L8: Multi-tenant identity
  cliPath: "/usr/local/bin/copilot",         // L8: Custom CLI path
  cliUrl: "http://localhost:3000",           // L7: External CLI
});
```

**4.3** The two new options:

| Option | Type | Use Case |
|--------|------|----------|
| `useLoggedInUser` | `boolean` | Multi-tenant apps: use the logged-in GitHub user's identity |
| `cliPath` | `string` | Non-standard CLI location: Docker, CI/CD, custom installs |

**4.4** Deployment scenario matrix:

| Scenario | Key Options |
|----------|------------|
| Local development | (defaults are fine) |
| CI/CD pipeline | `githubToken` from secrets |
| Docker container | `cliPath` + `githubToken` |
| Multi-tenant app | `githubToken` per user, `useLoggedInUser` |
| Shared CLI server | `cliUrl` + `useLoggedInUser` |

#### Key Concept

> 💡 **Client options configure the infrastructure, session options configure the AI.** Client options (`logLevel`, `githubToken`, `cliPath`, `cliUrl`, `useLoggedInUser`) control HOW the SDK connects to the CLI. Session options (`model`, `tools`, `hooks`, `mcpServers`, etc.) control WHAT the AI does. Separate the two in your mental model.

#### ✅ Checkpoint
You can name all 5 client constructor options and match each to a deployment scenario.

---

## Section B: Guided Projects

### Exercise 5: Project — Weather Assistant (L2+L3+L7)

#### Goal
Build a complete weather assistant that demonstrates streaming, custom tools, and error recovery working together.

#### Steps

**5.1** Run the weather project:

```bash
npm run weather
```

**5.2** Observe: the model calls 3 tools (weather, forecast, alerts), streams the response, and has error recovery via hooks.

**5.3** Open `project-weather.ts` and identify the level combinations:

| Component | Level | Code |
|-----------|:-----:|------|
| Streaming output | L2 | `streaming: true` + `message_delta` handler |
| 3 custom tools | L3 | `get_weather`, `get_forecast`, `get_weather_alerts` |
| Error recovery | L7 | `onErrorOccurred` with retry/skip |
| Token tracking | L2 | `assistant.usage` event |

**5.4** Each tool has a distinct responsibility:
- `get_weather` — current conditions (temperature, humidity)
- `get_forecast` — 3-day outlook
- `get_weather_alerts` — active warnings

**5.5** The model calls all three and synthesizes a comprehensive weather report.

#### Key Concept

> 💡 **Real applications combine multiple levels.** A weather assistant isn't just "tools" — it's streaming (L2) + tools (L3) + error recovery (L7). Every production app is a composition of SDK features from different levels.

#### ✅ Checkpoint
The weather assistant called 3 tools, streamed the response, and has error recovery — demonstrating L2+L3+L7 synthesis.

---

### Exercise 6: Project — Code Review Agent (L5+L6+L7)

#### Goal
Build a security-focused code reviewer that reads files via MCP, uses hooks for permission gating, and persists review sessions.

#### Steps

**6.1** Ensure Level 6 dependencies are installed:

```bash
cd ../level-6/sample-app && npm install && cd ../../level-8/sample-app
```

**6.2** Run the code review project:

```bash
npm run review
```

**6.3** Open `project-code-review.ts` and identify the level combinations:

| Component | Level | Code |
|-----------|:-----:|------|
| Permission hooks | L5 | `onPreToolUse` blocking shell/editFile |
| Audit hooks | L5 | `onPreToolUse` logging all tool calls |
| MCP filesystem | L6 | Read-only access to project docs |
| Custom agent | L6 | "Security Reviewer" persona |
| Session persistence | L7 | `sessionId: "code-review-demo"` |

**6.4** The security reviewer persona shapes the model's focus:

```typescript
prompt: "You are a senior security engineer. Focus on: hardcoded secrets,
injection vulnerabilities, authentication flaws, and data exposure."
```

#### Key Concept

> 💡 **Hooks + MCP + Agents = controlled, specialized AI.** Hooks enforce what the model CAN'T do (block writes), MCP provides what the model CAN access (files), and agents define HOW the model communicates (security focus). This triad is the pattern for every production agent.

#### ✅ Checkpoint
The code review agent read files via MCP, enforced read-only permissions via hooks, and responded with a security-focused persona.

---

### Exercise 7: Project — Interactive Quiz Generator (L3+L4)

#### Goal
Build a quiz app where the model generates questions, the user answers interactively, and the model evaluates responses.

#### Steps

**7.1** Run the quiz project:

```bash
npm run quiz
```

**7.2** Interact with the quiz — answer the model's questions and see scoring.

**7.3** Open `project-quiz.ts` and identify the level combinations:

| Component | Level | Code |
|-----------|:-----:|------|
| Quiz tools (3) | L3 | `generate_question`, `evaluate_answer`, `get_hint` |
| System message | L4 | "Quiz Master" personality |
| User input requests | L4 | `onUserInputRequest` handler |
| Signal handling | L4 | Ctrl+C shows final score |

**7.4** The quiz flow: model generates → user answers → model evaluates → score updates.

#### Key Concept

> 💡 **`onUserInputRequest` flips the conversation.** In most apps, the user asks and the model answers. The quiz app inverts this — the model drives the conversation. This pattern works for surveys, guided wizards, intake forms, and any agent-driven workflow.

#### ✅ Checkpoint
The quiz generated questions, accepted your answers, evaluated them, and tracked your score — demonstrating L3+L4 synthesis.

---

### Exercise 8: Project — Documentation Assistant (L6+L7)

#### Goal
Build a documentation navigator that reads project docs via MCP, applies review guidelines from a skill directory, and persists sessions.

#### Steps

**8.1** Run the docs project:

```bash
npm run docs
```

**8.2** Open `project-docs.ts` and identify the level combinations:

| Component | Level | Code |
|-----------|:-----:|------|
| MCP filesystem | L6 | Read-only access to sample-docs |
| Custom agent | L6 | "Documentation Helper" persona |
| Skill directory | L6 | docs-review guidelines |
| Session persistence | L7 | `sessionId: "docs-assistant-${date}"` |

**8.3** The combination creates a documentation expert that knows your project's files, follows your team's review standards, and remembers context across sessions.

#### Key Concept

> 💡 **Skills + MCP + Persistence = institutional knowledge.** Skills encode your team's standards. MCP provides access to your codebase. Persistence remembers context. Together, they create an AI that understands your project — not just generic coding knowledge.

#### ✅ Checkpoint
The documentation assistant read files, applied review guidelines, and persisted the session for later resumption.

---

## Section C: Cross-Cutting Concerns

### Exercise 9: Multi-Model Comparison

#### Goal
Compare multiple models side-by-side to evaluate quality, speed, and cost for your use case.

#### Steps

**9.1** Run the comparison:

```bash
npm run compare
```

**9.2** Observe the side-by-side results with timing and token counts:

```
=== gpt-4.1 ===
  (response)
  ⏱️  1850ms | 📊 134 tokens

=== gpt-4.1-mini ===
  (response)
  ⏱️  920ms | 📊 98 tokens

All models completed in 1860ms (parallel)
```

**9.3** Open `multi-model.ts` and study the parallel comparison pattern:

```typescript
const sessions = await Promise.all(
  models.map((model) => client.createSession({ model, onPermissionRequest: approveAll })),
);
const responses = await Promise.all(
  sessions.map((session) => session.sendAndWait({ prompt })),
);
```

**9.4** Build your own comparison criteria:

| Criterion | How to Measure |
|-----------|---------------|
| Quality | Read both responses — which is more accurate/complete? |
| Speed | Compare elapsed milliseconds |
| Cost | Compare total tokens (input + output) |
| Style | Does the tone match your use case? |

#### Key Concept

> 💡 **Model selection is empirical, not theoretical.** Don't assume gpt-4.1 is always better than gpt-4.1-mini. For YOUR prompts and YOUR tools, run a comparison. You may find the smaller model is good enough — at half the cost and twice the speed.
>
> You can now also compare models within a single session using `session.setModel()`, instead of creating parallel sessions. This is great for A/B testing during development.

#### ✅ Checkpoint
You compared 2+ models on the same prompt and have data to make an informed model selection.

---

### Exercise 10: Testing SDK Applications

#### Goal
Write testable SDK applications by extracting tool handlers and hooks as pure functions.

#### Steps

**10.1** Run the tests:

```bash
npm run test
```

**10.2** All 9 tests pass — and NO SDK, CLI, or API calls are made:

```
✅ Tokyo celsius: 22°C
✅ Tokyo fahrenheit: 72°F
✅ Unknown city returns error object
✅ read_file is allowed
✅ shell is denied
✅ bash is denied
✅ /fix expands correctly
✅ /review expands correctly
✅ Normal prompts pass through unchanged
```

**10.3** Open `test-tools.ts` and study the 3 testing patterns:

**Pattern 1 — Test tool handlers:**
```typescript
// Extract handler as a standalone function
async function weatherHandler(args: { city: string }) { ... }

// Test directly — no SDK needed
const result = await weatherHandler({ city: "Tokyo" });
assert.deepEqual(result, { city: "Tokyo", temperature: 22, units: "celsius" });
```

**Pattern 2 — Test hooks:**
```typescript
async function preToolUseHook(input: { toolName: string }) { ... }

const allow = await preToolUseHook({ toolName: "read_file" });
assert.equal(allow.permissionDecision, "allow");
```

**Pattern 3 — Test prompt expansion:**
```typescript
async function promptHook(input: { prompt: string }) { ... }

const fix = await promptHook({ prompt: "/fix the auth module" });
assert.equal(fix?.modifiedPrompt, "Fix the errors in the auth module");
```

**10.4** The key insight: **extract logic from SDK config into standalone functions**. Then test those functions directly.

**10.5** Testing best practices:

| Practice | Why |
|----------|-----|
| Extract handlers as standalone functions | Testable without SDK |
| Test with mock inputs | No API calls, fast, deterministic |
| Assert return shapes | `{ error }`, `{ permissionDecision }`, `null` |
| Test edge cases | Unknown input, missing optional fields |
| Use `assert.deepEqual` for objects | Structural equality |

#### Key Concept

> 💡 **Testable SDK apps = extracted functions.** Don't bury logic inside `defineTool` or `hooks`. Extract handler functions, test them with mock inputs, and then pass them to the SDK. Your tests run instantly (no API calls) and catch bugs before deployment.

#### ✅ Checkpoint
All 9 tests passed without any SDK, CLI, or API calls, and you understand the 3 testing patterns.

---

### Exercise 11: Security Hardening Checklist

#### Goal
Review and apply a comprehensive security checklist to any SDK application.

#### Steps

**11.1** Use this checklist for every production SDK application:

**Authentication & Secrets:**
- [ ] No API keys in source code (use `process.env`)
- [ ] `.env` is in `.gitignore`
- [ ] BYOK keys are rotated regularly
- [ ] Explicit `githubToken` used in multi-tenant apps (not shared credentials)

**Tool Restrictions:**
- [ ] `onPreToolUse` blocks `shell`, `bash`, `execute`, `editFile`
- [ ] MCP servers use tool filtering (not `tools: ["*"]` in production)
- [ ] `excludedTools` or `availableTools` restricts built-in tools
- [ ] `permissionDecisionReason` provided for all denials

> ⚠️ **Never use `approveAll` in production.** Implement granular permission handlers that approve specific tools and deny dangerous ones.

**Data Protection:**
- [ ] `onPostToolUse` redacts PII, passwords, API keys from tool results
- [ ] Sensitive data never reaches the model (redact BEFORE it's sent)
- [ ] Session persistence doesn't store secrets (they don't persist anyway)

**Error Handling:**
- [ ] `onErrorOccurred` implements retry for transient failures
- [ ] Fatal errors abort cleanly (not silently ignored)
- [ ] `userNotification` provides friendly messages

**Observability:**
- [ ] Audit trail via pre/post tool hooks
- [ ] Token usage tracked per session
- [ ] Session IDs are structured and auditable
- [ ] Old sessions cleaned up regularly

**Shutdown:**
- [ ] `SIGINT` handler calls `client.stop()` + `process.exit(0)`
- [ ] `try-catch-finally` ensures `client.stop()` on error paths
- [ ] MCP servers have `timeout` configured

**11.2** Apply this checklist to the Level 7 `standup-bot.ts`:

```bash
cd ../level-7/sample-app
cat standup-bot.ts
# Review against each checklist item
```

**11.3** Note items the standup bot satisfies and any gaps.

#### Key Concept

> 💡 **Security is a checklist, not a feature.** You don't add security in one exercise — you apply it across every layer: auth, tools, hooks, data, errors, and shutdown. This checklist should be your final review step before any SDK application goes to production.

#### ✅ Checkpoint
You've reviewed the security checklist and can identify which items apply to a given application.

---

### Exercise 12: Capstone — Design, Build & Present Your Own

#### Goal
Design and build your own SDK application from scratch — the ultimate test of mastery.

#### Steps

**12.1** Choose a project idea (or create your own):

| Idea | Levels Used | Complexity |
|------|:-----------:|:----------:|
| Meeting summarizer (reads notes, generates action items) | L3+L4+L7 | Medium |
| Code documentation generator (reads code via MCP, writes docs) | L3+L6 | Medium |
| DevOps assistant (monitors builds, alerts on failures) | L3+L5+L7 | High |
| Multi-language translator (BYOK with different providers) | L3+L7+L8 | High |
| Personal knowledge base (MCP + persistence + search) | L6+L7 | High |

**12.2** Write a one-page proposal:

```markdown
# Project: [Name]

## Problem: What does this solve?
## Users: Who is this for?
## SDK Features: Which levels/features are used?
## Tools: What custom tools are needed?
## Architecture: How do the components fit together?
```

**12.3** Implement it. Use the sample apps from previous levels as starting templates.

**12.4** Self-review using the security checklist from Exercise 11.

**12.5** Present your project: explain the architecture, demonstrate the key features, and share what you learned.

#### Key Concept

> 💡 **Mastery = building without a tutorial.** This exercise has no starter code and no step-by-step guide. You design the architecture, choose the features, write the code, and validate the security. If you can do this, you've mastered the Copilot SDK.

#### ✅ Checkpoint
You have a working application with a proposal document, and it passes the security checklist.

---

## Self-Assessment

Rate yourself 1–3 on each skill:

| # | Skill | 1 | 2 | 3 |
|---|-------|---|---|---|
| 1 | I can send images with `attachments` | ☐ | ☐ | ☐ |
| 2 | I can subscribe to reasoning events | ☐ | ☐ | ☐ |
| 3 | I can configure `reasoningEffort` and explain the tradeoff | ☐ | ☐ | ☐ |
| 4 | I can name all client constructor options | ☐ | ☐ | ☐ |
| 5 | I can build a multi-tool assistant with error recovery | ☐ | ☐ | ☐ |
| 6 | I can build an agent with hooks + MCP + persistence | ☐ | ☐ | ☐ |
| 7 | I can build an interactive app with onUserInputRequest | ☐ | ☐ | ☐ |
| 8 | I can build a docs assistant with MCP + skills | ☐ | ☐ | ☐ |
| 9 | I can compare models using parallel sessions | ☐ | ☐ | ☐ |
| 10 | I can write tests for tool handlers and hooks | ☐ | ☐ | ☐ |
| 11 | I can apply the security hardening checklist | ☐ | ☐ | ☐ |
| 12 | I can design and build my own SDK application | ☐ | ☐ | ☐ |

**Scoring:**
```
1 = I need to revisit this
2 = I can do this with reference
3 = I can do this from memory

Score: __/36
  30+ (≥ 83%) → You've mastered the Copilot SDK! 🎉
  24-29 (67-80%) → Review weak areas, then revisit
  < 24 (< 67%) → Repeat key exercises and projects
```

---

## 🎉 Congratulations!

You've completed all 8 levels of the Copilot SDK Workshop — **96 exercises** covering every major feature of the SDK.

### Your Journey

```
Level 1: Connect    →  "Hello, world" — your first API call
Level 2: Stream     →  Real-time token streaming
Level 3: Tools      →  Custom functions the model calls
Level 4: Interact   →  System messages, user input, REPL
Level 5: Hooks      →  6 hook types for lifecycle control
Level 6: Context    →  MCP servers, agents, skills
Level 7: Production →  BYOK, persistence, error recovery
Level 8: Mastery    →  Advanced features, real projects, testing
```

### What's Next?

- **Build real applications** using the patterns from Level 8
- **Explore other languages** — Python, Go, and .NET SDKs have identical capabilities
- **Contribute** — found a bug or have an improvement? Open a PR!
- **Stay updated** — the SDK is in Technical Preview; new features are added regularly

### Resources

- [Copilot SDK Repository](https://github.com/github/copilot-sdk)
- [Getting Started Guide](https://github.com/github/copilot-sdk/blob/main/docs/getting-started.md)
- [MCP Servers Directory](https://github.com/modelcontextprotocol/servers)
- [SDK Cookbook](https://github.com/github/awesome-copilot/blob/main/cookbook/copilot-sdk)
