---
layout: step
title: "Level 5: Hooks — Intercept & Control the Loop"
step_number: 5
permalink: /steps/5/
---

# Level 5: Hooks — Intercept & Control the Agent Loop

> **Risk level:** 🟠 Medium — Hooks can modify tool behavior, suppress errors, and block tool execution. Understand what each hook does before combining them. All tools in this level use hardcoded data, but the patterns apply to production systems with real side effects.

## Learning Objectives

By the end of this level, you will be able to:

1. Use `onSessionStart` to inject project context when a session begins
2. Intercept user prompts with `onUserPromptSubmitted` using `modifiedPrompt` and `additionalContext`
3. Build prompt expansion shortcuts (`/fix`, `/review`, `/explain`) via the prompt hook
4. Gate tool execution with `onPreToolUse` and the `permissionDecision` system
5. Block dangerous tools (shell, bash) with deny rules and clear reasons
6. Modify tool arguments silently with `modifiedArgs` in `onPreToolUse`
7. Transform and redact tool results with `onPostToolUse` and `modifiedResult`
8. Build a compliance-grade audit trail combining pre and post hooks
9. Handle session cleanup with `onSessionEnd` and the `reason` field
10. Implement error recovery strategies (retry, skip, abort) with `onErrorOccurred`
11. Combine all 6 hook types into a coherent lifecycle control system
12. Build a security-aware coding assistant with full hook integration

---

## Prerequisites

- [ ] **Level 4 completed** (you can build interactive apps with tools, system messages, and user input)
- [ ] Node.js 20+, Copilot CLI installed and authenticated
- [ ] This repository cloned locally

---

## Workshop Structure

This level contains **12 exercises**. Estimated time: **70–90 minutes**.

| Exercise | Topic | Time |
|----------|-------|------|
| 1 | Your First Hook: `onSessionStart` | 5 min |
| 2 | `onUserPromptSubmitted` — Intercept Prompts | 5 min |
| 3 | Build Prompt Expansion Shortcuts | 7 min |
| 4 | `onPreToolUse` — Gate Tool Execution | 7 min |
| 5 | Block Dangerous Tools | 5 min |
| 6 | Modify Tool Arguments | 5 min |
| 7 | `onPostToolUse` — Transform Results | 7 min |
| 8 | Audit Logging with Hooks | 7 min |
| 9 | `onSessionEnd` — Lifecycle Cleanup | 5 min |
| 10 | `onErrorOccurred` — Custom Error Handling | 7 min |
| 11 | Combine All 6 Hook Types | 7 min |
| 12 | Capstone: Security-Aware Coding Agent | 7 min |

---

## Exercise 1: Your First Hook: `onSessionStart`

### Goal
Inject project context at the moment a session is created. This context is available to the model for the entire conversation.

### Steps

**1.1** Navigate to the sample app and install dependencies:

```bash
cd workshop/level-5/sample-app
npm install
```

**1.2** Run the session start hook demo:

```bash
npm run start
```

**1.3** Observe: the model knows about TypeScript and functional patterns — information you injected via the hook, not via the prompt.

**1.4** Open `session-start-hook.ts` and study the hook:

```typescript
import { CopilotClient, approveAll } from "@github/copilot-sdk";

const session = await client.createSession({
  model: "gpt-4.1",
  onPermissionRequest: approveAll,
  hooks: {
    onSessionStart: async (input) => {
      console.log(`[onSessionStart] source: "${input.source}"`);
      return {
        additionalContext: "This project uses TypeScript with strict mode...",
      };
    },
  },
});
```

**1.5** The `input.source` field tells you how the session started:

| Source | Meaning |
|--------|---------|
| `"startup"` | Fresh session, first time |
| `"resume"` | Resumed from persistence (Level 7) |
| `"new"` | New session on an existing client |

**1.6** The return value `{ additionalContext: "..." }` is silently added to the model's context. The user never sees it, but the model uses it to inform all responses.

### Key Concept

> 💡 **`onSessionStart` is your initialization hook.** Use it to inject project metadata, user preferences, security policies, or configuration that the model should know about from the first message. It fires once — before any user interaction.

### ✅ Checkpoint
The model references TypeScript and functional patterns without being asked about them, proving the hook injected context successfully.

---

## Exercise 2: `onUserPromptSubmitted` — Intercept Prompts

### Goal
Intercept every user message before it reaches the model. You can modify the prompt, add hidden context, or both.

### Steps

**2.1** Run the prompt hooks demo:

```bash
npm run prompt
```

**2.2** Observe the first test — a normal prompt gets `additionalContext`:

```
📝 [onUserPromptSubmitted] Original prompt: "What is a closure?"
   ↳ Adding context: "User is a senior engineer"
```

**2.3** Open `prompt-hooks.ts` and study the two return types:

**Return `{ modifiedPrompt }`** — replaces the user's prompt entirely:
```typescript
return { modifiedPrompt: "Review this code for security vulnerabilities: auth module" };
```

**Return `{ additionalContext }`** — adds hidden context alongside the original prompt:
```typescript
return { additionalContext: "The user is a senior TypeScript engineer." };
```

**2.4** Key difference:

| Return | User's Prompt | Extra Info | Use When |
|--------|:------------:|:----------:|----------|
| `{ modifiedPrompt }` | Replaced | — | Expanding shortcuts, rewriting |
| `{ additionalContext }` | Kept | Added silently | Adding expertise level, project info |
| `null` | Kept | — | No changes needed |

### Key Concept

> 💡 **`modifiedPrompt` replaces, `additionalContext` supplements.** Use `modifiedPrompt` when you need to completely rewrite what the user said (shortcuts, translations). Use `additionalContext` when you want to add invisible background information without changing the user's words.

### ✅ Checkpoint
You see the hook logging each prompt and understand the difference between `modifiedPrompt` and `additionalContext`.

---

## Exercise 3: Build Prompt Expansion Shortcuts

### Goal
Transform shorthand commands like `/fix` and `/review` into full, detailed prompts — a practical application of `onUserPromptSubmitted`.

### Steps

**3.1** In the `npm run prompt` output, observe the second test:

```
📝 [onUserPromptSubmitted] Original prompt: "/review async error handling patterns"
   ↳ Expanded to: "Review async error handling patterns for security vulnerabilities..."
```

**3.2** Open `prompt-hooks.ts` and study the shortcut logic:

```typescript
onUserPromptSubmitted: async (input) => {
  if (input.prompt.startsWith("/fix")) {
    const target = input.prompt.slice(4).trim();
    return { modifiedPrompt: `Fix the errors in ${target}. Show corrected code.` };
  }
  if (input.prompt.startsWith("/review")) {
    const target = input.prompt.slice(7).trim();
    return { modifiedPrompt: `Review ${target} for security vulnerabilities...` };
  }
  return null; // No changes for non-shortcut prompts
},
```

**3.3** Design your own shortcuts. Good shortcut patterns:

| Shortcut | Expands To |
|----------|-----------|
| `/fix <target>` | "Fix the errors in {target}. Show corrected code and explain." |
| `/review <target>` | "Review {target} for security, performance, and best practices." |
| `/explain <target>` | "Explain {target} step by step, as if teaching a junior developer." |
| `/test <target>` | "Write unit tests for {target} using Jest." |
| `/doc <target>` | "Write JSDoc documentation for {target}." |

**3.4** Note: shortcuts in the prompt hook are different from the `/help` and `/exit` commands in Level 4. Those were handled BEFORE `sendAndWait` (never reaching the SDK). Prompt hook shortcuts go THROUGH the SDK and reach the model as expanded prompts.

### Key Concept

> 💡 **Prompt hooks expand shortcuts into expert-quality prompts.** A user types `/review auth`, and the model receives a detailed, structured review instruction. This is prompt engineering automated — your best prompt templates, triggered by simple shortcuts.

### ✅ Checkpoint
You see `/review` expanded into a full security review instruction and can design your own shortcut patterns.

---

## Exercise 4: `onPreToolUse` — Gate Tool Execution

### Goal
Control whether each tool call is allowed, denied, or requires confirmation. This is the foundation of SDK security.

### Steps

**4.1** Run the pre-tool hook demo:

```bash
npm run pre
```

**4.2** Observe the gating:

```
  🛡️  [onPreToolUse] Tool: "analyze_code"
      Args: {"code":"const x = 1; console.log(x)","language":"javascript"}
      ✏️  Injecting safeMode: true into args
```

**4.3** Open `pre-tool-hook.ts` and study the `permissionDecision` system:

```typescript
onPreToolUse: async (input) => {
  // input.toolName — which tool the model wants to call
  // input.toolArgs — the arguments the model provided

  // Three possible decisions:
  return { permissionDecision: "allow" };   // Let it run
  return { permissionDecision: "deny" };    // Block it
  return { permissionDecision: "ask" };     // Ask user for confirmation
},
```

**4.4** The three permission decisions:

| Decision | Effect | Use When |
|----------|--------|----------|
| `"allow"` | Tool runs normally | Safe, read-only tools |
| `"deny"` | Tool is blocked, model gets error | Dangerous tools (shell, file writes) |
| `"ask"` | User is prompted for confirmation | Tools with side effects |

**4.5** When denying, always provide a reason:

```typescript
return {
  permissionDecision: "deny",
  permissionDecisionReason: "Shell access is blocked by security policy",
};
```

### Key Concept

> 💡 **`onPreToolUse` is your security gate.** Every tool call passes through this hook before executing. You can allow, deny, or ask — giving you fine-grained control over what the model can and cannot do. This is what makes the SDK safe for production: the model proposes, your hook disposes.

> 💡 **Permissions vs Hooks.** The `onPermissionRequest` handler runs before any tool execution — it's the first gate. Hooks like `onPreToolUse` run after permission is granted. In production, use `onPermissionRequest` for coarse-grained access control (approve/deny tool categories) and `onPreToolUse` for fine-grained argument inspection.

### ✅ Checkpoint
You see tool calls being logged and gated, and understand the 3 permission decisions (allow, deny, ask).

---

## Exercise 5: Block Dangerous Tools

### Goal
Build a practical security policy: block shell, bash, and file-write tools while allowing read-only operations.

### Steps

**5.1** In `pre-tool-hook.ts`, examine the blocking logic:

```typescript
if (["shell", "bash", "editFile", "execute"].includes(input.toolName)) {
  console.log(`❌ DENIED — dangerous tool blocked`);
  return {
    permissionDecision: "deny",
    permissionDecisionReason: `Tool "${input.toolName}" is blocked for security`,
  };
}
```

**5.2** When a tool is denied:
1. The handler is NOT called
2. The model receives an error message (your `permissionDecisionReason`)
3. The model may try a different approach or explain the limitation to the user

**5.3** Build a tiered security policy:

```typescript
const BLOCKED = ["shell", "bash", "execute", "deleteFile"];
const NEEDS_APPROVAL = ["editFile", "writeFile", "moveFile"];
const ALLOWED = ["read_file", "search_code", "analyze_code"];

if (BLOCKED.includes(input.toolName)) {
  return { permissionDecision: "deny", permissionDecisionReason: "Blocked by policy" };
}
if (NEEDS_APPROVAL.includes(input.toolName)) {
  return { permissionDecision: "ask" };  // User must confirm
}
return { permissionDecision: "allow" };  // Safe by default
```

### Key Concept

> 💡 **Deny with reasons, not silence.** When you block a tool, the `permissionDecisionReason` tells the model WHY it was blocked. The model can then explain the limitation to the user or try an alternative approach, rather than just failing mysteriously.

### ✅ Checkpoint
You can implement a tiered security policy (blocked / needs approval / allowed) using `onPreToolUse`.

---

## Exercise 6: Modify Tool Arguments

### Goal
Silently rewrite tool arguments before execution — useful for injecting flags, normalizing input, or adding safety constraints.

### Steps

**6.1** In `pre-tool-hook.ts`, see how `modifiedArgs` works:

```typescript
if (input.toolName === "analyze_code") {
  return {
    permissionDecision: "allow",
    modifiedArgs: { ...input.toolArgs, safeMode: true },
  };
}
```

**6.2** The handler receives the MODIFIED args (not the original):

```
  🛡️  [onPreToolUse] Injecting safeMode: true
  🔧 [handler] Received args: {"code":"...","language":"javascript","safeMode":true}
```

**6.3** Use cases for argument modification:

| Use Case | Modification |
|----------|-------------|
| Enforce safe mode | Add `safeMode: true` flag |
| Restrict scope | Override path to allowed directory |
| Normalize input | Lowercase city names, trim whitespace |
| Add metadata | Inject `userId`, `timestamp`, `requestId` |

**6.4** Important: the model doesn't know you modified the args. This is a silent, transparent transformation.

### Key Concept

> 💡 **`modifiedArgs` is transparent arg rewriting.** The model sends args, you transform them, and the handler receives the modified version. The model never sees the change. Use this for security constraints (force safe mode), normalization (consistent casing), and metadata injection (audit fields).

### ✅ Checkpoint
You see the handler receiving `safeMode: true` that the model didn't send, proving silent arg injection works.

---

## Exercise 7: `onPostToolUse` — Transform Results

### Goal
Intercept and modify tool results before they reach the model — essential for redacting sensitive data.

### Steps

**7.1** Run the post-tool hook demo:

```bash
npm run post
```

**7.2** Observe the redaction:

```
  📤 [onPostToolUse] Tool: "get_config"
      Redacted 3 sensitive field(s)
      Modified result: {"host":"db.example.com","password":"[REDACTED]",...}
```

**7.3** Open `post-tool-hook.ts` and study the redaction logic:

```typescript
onPostToolUse: async (input) => {
  // input.toolName, input.toolArgs, input.toolResult
  const result = JSON.parse(JSON.stringify(input.toolResult)); // Deep clone

  // Scan and redact sensitive fields
  const sensitiveKeys = ["password", "secret", "apikey", "token"];
  // ... redaction logic ...

  return { modifiedResult: result };
},
```

**7.4** The return options for `onPostToolUse`:

| Return | Effect |
|--------|--------|
| `{ modifiedResult: {...} }` | Model sees modified data |
| `{ additionalContext: "..." }` | Add context alongside original result |
| `{ suppressOutput: true }` | Hide tool result from model entirely |
| `null` | No changes — pass through |

**7.5** Key: the model never sees the original sensitive data. It receives `[REDACTED]` and works with that.

### Key Concept

> 💡 **`onPostToolUse` is your data firewall.** Tool results may contain passwords, API keys, PII, or internal data that shouldn't be sent to the model. The post hook lets you redact, transform, or suppress results before they leave your application. This is critical for compliance (GDPR, SOC2, HIPAA).

### ✅ Checkpoint
You see passwords and API keys replaced with `[REDACTED]` in the tool results, and the model works with the sanitized data.

---

## Exercise 8: Audit Logging with Hooks

### Goal
Combine `onPreToolUse` and `onPostToolUse` to create a compliance-grade audit trail that records every tool call.

### Steps

**8.1** Run the audit logger:

```bash
npm run audit
```

**8.2** Observe the audit entries:

```
  📥 [PRE]  search_code({"pattern":"console.log"})
  📤 [POST] search_code → completed in 12ms

  📥 [PRE]  read_file({"path":"src/index.ts"})
  📤 [POST] read_file → completed in 8ms
```

**8.3** At the end, a structured audit summary is printed:

```
╔══════════════════════════════════════════════╗
║   📋 Audit Log Summary                       ║
╚══════════════════════════════════════════════╝

  2024-01-15T10:30:45.123Z
    Tool: search_code
    Args: {"pattern":"console.log"}
    Duration: 12ms

Total tool calls: 2
```

**8.4** Open `audit-logger.ts` and study the dual-hook pattern:

```typescript
hooks: {
  onPreToolUse: async (input) => {
    // Record start time
    pendingCalls.set(input.toolName, { startTime: Date.now(), args: input.toolArgs });
    return { permissionDecision: "allow" };
  },
  onPostToolUse: async (input) => {
    // Calculate duration, create audit entry
    const duration = Date.now() - pendingCalls.get(input.toolName).startTime;
    auditLog.push({ timestamp, toolName, args, result, durationMs: duration });
    return null;
  },
},
```

**8.5** In production, you'd send these audit entries to a logging service (CloudWatch, Datadog, Splunk) instead of an in-memory array.

### Key Concept

> 💡 **Pre + post hooks = complete audit trail.** The pre hook captures the request (tool + args + timestamp), the post hook captures the response (result + duration). Together, they create a complete record of every action the model took — essential for compliance, debugging, and cost attribution.

### ✅ Checkpoint
You see a structured audit log with timestamps, tool names, arguments, and durations for every tool call.

---

## Exercise 9: `onSessionEnd` — Lifecycle Cleanup

### Goal
Run cleanup logic when a session ends — print summaries, save metrics, flush audit logs.

### Steps

**9.1** The `onSessionEnd` hook fires when the session completes for any reason. Open `safe-coder.ts` and find:

```typescript
onSessionEnd: async (input) => {
  console.log(`[SESSION END] reason: ${input.reason}`);
  console.log(`Prompts: ${promptCount} | Tool calls: ${auditLog.length} | Tokens: ${totalTokens}`);
  return null;
},
```

**9.2** The `input.reason` tells you WHY the session ended:

| Reason | Meaning |
|--------|---------|
| `"complete"` | Normal completion |
| `"error"` | Session failed with an error |
| `"abort"` | Session was aborted |
| `"timeout"` | Session timed out |
| `"user_exit"` | User explicitly ended the session |

**9.3** Use cases for `onSessionEnd`:

| Task | Code |
|------|------|
| Print summary | `console.log("Total tokens:", totalTokens)` |
| Flush audit log | `await sendToLoggingService(auditLog)` |
| Save session state | `await fs.writeFile("state.json", ...)` |
| Report metrics | `await reportMetrics({ duration, tokens })` |

**9.4** Important: `onSessionEnd` does NOT return a modified result — it's purely for side effects. Return `null`.

### Key Concept

> 💡 **`onSessionEnd` is your finally block.** Like `finally` in try-catch-finally, this hook runs regardless of how the session ended. Use it for cleanup, metrics, and finalization that must always happen — even on errors or timeouts.

### ✅ Checkpoint
You understand the 5 `reason` values and know that `onSessionEnd` is for side effects only (return `null`).

---

## Exercise 10: `onErrorOccurred` — Custom Error Handling

### Goal
Implement custom error recovery strategies: retry transient failures, skip non-critical errors, and abort on fatal ones.

### Steps

**10.1** Run the error hook demo:

```bash
npm run error
```

**10.2** Observe the safe operation succeeding and the dangerous one triggering the error hook:

```
  ⚠️  [onErrorOccurred]
      Error: Simulated operation failure: connection timeout
      Context: tool_execution
      Recoverable: true
      → Skipping failed tool
```

**10.3** Open `error-hook.ts` and study the recovery strategies:

```typescript
onErrorOccurred: async (input) => {
  // input.error — error message (string)
  // input.errorContext — "model_call" | "tool_execution" | "system" | "user_input"
  // input.recoverable — whether the SDK thinks recovery is possible

  if (input.errorContext === "model_call") {
    return { errorHandling: "retry", retryCount: 3, userNotification: "Retrying..." };
  }
  if (input.errorContext === "tool_execution") {
    return { errorHandling: "skip", userNotification: "A tool failed." };
  }
  return { errorHandling: "abort" };
},
```

**10.4** The three recovery strategies:

| Strategy | Effect | Use For |
|----------|--------|---------|
| `"retry"` | Try the operation again (up to `retryCount`) | Rate limits, timeouts, transient failures |
| `"skip"` | Skip the failed operation, continue | Non-critical tool failures |
| `"abort"` | Stop the entire session | Fatal errors, security violations |

**10.5** The `errorContext` field helps you choose the right strategy:

| Context | Typical Errors | Recommended Strategy |
|---------|---------------|---------------------|
| `"model_call"` | Rate limits, network timeouts | Retry with backoff |
| `"tool_execution"` | Handler threw an exception | Skip or retry |
| `"system"` | CLI crash, connection lost | Abort |
| `"user_input"` | Invalid input | Skip |

### Key Concept

> 💡 **Match recovery strategy to error context.** Rate limits are transient (retry). Tool failures may be non-critical (skip). System errors are usually fatal (abort). The `errorContext` + `recoverable` fields give you the information to make the right choice automatically.

### ✅ Checkpoint
You see the error hook fire, choose a strategy based on `errorContext`, and the conversation continues (or stops) accordingly.

---

## Exercise 11: Combine All 6 Hook Types

### Goal
See all 6 hooks working together in a single session, forming a complete lifecycle control system.

### Steps

**11.1** Run the capstone safe-coder:

```bash
npm run safe
```

**11.2** Send a prompt like: "Read the index.ts file and review it for security issues"

**11.3** Observe all 6 hooks firing in order:

```
  📋 [SESSION START] source: startup              ← onSessionStart
  📝 [PROMPT] "Read the index.ts file..."         ← onUserPromptSubmitted
  ✅ [PRE-TOOL] Allowed: read_file                ← onPreToolUse
  🔒 [POST-TOOL] Redacted secrets from result     ← onPostToolUse
  (streaming response)
  📋 [SESSION END] reason: complete                ← onSessionEnd
```

**11.4** The hook execution order:

```
Session lifecycle:
  onSessionStart                    ← Once at start

Per-message lifecycle:
  onUserPromptSubmitted             ← Every time user sends a message
    onPreToolUse                    ← Before each tool call
    onPostToolUse                   ← After each tool call
    onErrorOccurred                 ← If anything fails

  onSessionEnd                      ← Once at end
```

**11.5** Open `safe-coder.ts` and trace how each hook contributes to the whole:
- **Start**: injects security policy context
- **Prompt**: expands `/review` shortcuts
- **Pre-tool**: blocks shell, allows reads
- **Post-tool**: redacts passwords/API keys
- **Error**: retries transient failures
- **End**: prints audit summary

### Key Concept

> 💡 **Hooks are composable middleware.** Each hook handles one concern (security, logging, context, errors). Together, they form a pipeline that controls every aspect of the agent loop. Like Express middleware or React hooks, they're powerful because they're independent and composable.

### ✅ Checkpoint
You see all 6 hooks firing in the correct order during a single conversation and understand each one's role.

---

## Exercise 12: Capstone: Security-Aware Coding Agent

### Goal
Experience the full Level 5 application — all 6 hooks orchestrating a production-quality security code reviewer.

### Steps

**12.1** Run the safe-coder capstone:

```bash
npm run safe
```

**12.2** Try these interactions:

```
You: Read the index.ts file
  → read_file allowed, secrets REDACTED from result

You: /review the authentication code
  → Prompt expanded to full security review instruction

You: Analyze the code for vulnerabilities
  → analyze_code tool called with security focus

(Press Ctrl+C)
  → Final audit log printed with all tool calls
```

**12.3** Open `safe-coder.ts` and identify all the features:

| Feature | Source Level | Hook/API Used |
|---------|:-----------:|---------------|
| CopilotClient + session | L1 | Client creation |
| Streaming | L2 | `message_delta` events |
| Token tracking | L2 | `assistant.usage` events |
| Custom tools (3) | L3 | `defineTool` |
| System message | L4 | `systemMessage` |
| REPL loop | L4 | `readline/promises` |
| Signal handling | L4 | `process.on("SIGINT")` |
| `onSessionStart` | L5 | Context injection |
| `onUserPromptSubmitted` | L5 | Shortcuts, context |
| `onPreToolUse` | L5 | Permission gating |
| `onPostToolUse` | L5 | Secret redaction |
| `onSessionEnd` | L5 | Audit summary |
| `onErrorOccurred` | L5 | Error recovery |

**12.4** This is the most complex sample app so far — 231 lines combining everything from Levels 1–5 into a cohesive application.

### Key Concept

> 💡 **Hooks turn the SDK into a controlled, auditable platform.** Without hooks, the model runs freely — calling any tool, seeing any data, failing silently. With hooks, you control permissions, redact secrets, log everything, and recover from errors. This is what makes the SDK production-ready.

### ✅ Checkpoint
You ran the full safe-coder, saw all 6 hooks working together, and can identify which level each feature comes from.

---

## Self-Assessment

Rate yourself 1–3 on each skill:

| # | Skill | 1 | 2 | 3 |
|---|-------|---|---|---|
| 1 | I can use `onSessionStart` to inject context | ☐ | ☐ | ☐ |
| 2 | I can intercept prompts with `onUserPromptSubmitted` | ☐ | ☐ | ☐ |
| 3 | I can build `/fix` and `/review` shortcuts | ☐ | ☐ | ☐ |
| 4 | I can gate tools with `permissionDecision` (allow/deny/ask) | ☐ | ☐ | ☐ |
| 5 | I can block dangerous tools with deny rules | ☐ | ☐ | ☐ |
| 6 | I can modify tool arguments with `modifiedArgs` | ☐ | ☐ | ☐ |
| 7 | I can redact sensitive data with `onPostToolUse` | ☐ | ☐ | ☐ |
| 8 | I can build an audit trail with pre+post hooks | ☐ | ☐ | ☐ |
| 9 | I can handle session cleanup with `onSessionEnd` | ☐ | ☐ | ☐ |
| 10 | I can implement retry/skip/abort error strategies | ☐ | ☐ | ☐ |
| 11 | I can combine all 6 hooks into a lifecycle pipeline | ☐ | ☐ | ☐ |
| 12 | I can build a security-aware agent with full hook integration | ☐ | ☐ | ☐ |

**Scoring:**
```
1 = I need to revisit this
2 = I can do this with reference
3 = I can do this from memory

Score: __/36
  30+ (≥ 83%) → Proceed to Level 6 ✅
  24-29 (67-80%) → Review weak areas, then proceed
  < 24 (< 67%) → Repeat key exercises before continuing
```

---

## What's Next?

In **[Level 6: Context](../level-6/README.md)**, you'll extend the SDK with external tool ecosystems via **MCP servers** (Model Context Protocol), define specialized **custom agents** with unique personas, and load reusable **skill directories** — connecting your applications to the broader AI tooling ecosystem.
