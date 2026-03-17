# Level 5 — Quick Reference Card

## Hook Types Overview

| Hook | When It Fires | Input Fields | Key Returns |
|------|--------------|-------------|-------------|
| `onSessionStart` | Once at session creation | `source` | `{ additionalContext }` |
| `onUserPromptSubmitted` | Every user message | `prompt` | `{ modifiedPrompt }` / `{ additionalContext }` |
| `onPreToolUse` | Before each tool call | `toolName`, `toolArgs` | `{ permissionDecision }` / `{ modifiedArgs }` |
| `onPostToolUse` | After each tool call | `toolName`, `toolArgs`, `toolResult` | `{ modifiedResult }` / `{ suppressOutput }` |
| `onSessionEnd` | Once at session end | `reason` | `null` (side effects only) |
| `onErrorOccurred` | On any error | `error`, `errorContext`, `recoverable` | `{ errorHandling }` / `{ retryCount }` |

## Hook Execution Order

```
onSessionStart                      ← Once at start

  onUserPromptSubmitted             ← Per message
    onPreToolUse                    ← Per tool call (before)
    onPostToolUse                   ← Per tool call (after)
    onErrorOccurred                 ← If anything fails

onSessionEnd                        ← Once at end
```

## `onSessionStart`

```typescript
onSessionStart: async (input) => {
  // input.source: "startup" | "resume" | "new"
  return { additionalContext: "Project uses TypeScript." };
}
```

## `onUserPromptSubmitted`

```typescript
onUserPromptSubmitted: async (input) => {
  // input.prompt — the user's message
  if (input.prompt.startsWith("/fix")) {
    return { modifiedPrompt: `Fix the errors in ${input.prompt.slice(4)}` };
  }
  return { additionalContext: "User is a senior engineer." };
  // return null;  ← no changes
}
```

| Return | User's Prompt | Extra Info |
|--------|:------------:|:----------:|
| `{ modifiedPrompt }` | Replaced | — |
| `{ additionalContext }` | Kept | Added silently |
| `null` | Kept | — |

## `onPreToolUse`

```typescript
onPreToolUse: async (input) => {
  // input.toolName, input.toolArgs

  // Block dangerous tools
  if (["shell", "bash"].includes(input.toolName)) {
    return { permissionDecision: "deny", permissionDecisionReason: "Blocked" };
  }

  // Modify arguments
  return { permissionDecision: "allow", modifiedArgs: { ...input.toolArgs, safe: true } };
}
```

| Decision | Effect |
|----------|--------|
| `"allow"` | Tool runs (optionally with `modifiedArgs`) |
| `"deny"` | Tool blocked, model gets `permissionDecisionReason` |
| `"ask"` | User prompted for confirmation |

## `onPostToolUse`

```typescript
onPostToolUse: async (input) => {
  // input.toolName, input.toolArgs, input.toolResult
  const result = JSON.parse(JSON.stringify(input.toolResult));
  // Redact sensitive fields...
  return { modifiedResult: result };
  // return { suppressOutput: true };  ← hide result from model
  // return null;  ← no changes
}
```

## `onSessionEnd`

```typescript
onSessionEnd: async (input) => {
  // input.reason: "complete" | "error" | "abort" | "timeout" | "user_exit"
  console.log(`Session ended: ${input.reason}`);
  return null;  // Side effects only — no return value used
}
```

## `onErrorOccurred`

```typescript
onErrorOccurred: async (input) => {
  // input.error (string), input.errorContext, input.recoverable (boolean)

  if (input.errorContext === "model_call") {
    return { errorHandling: "retry", retryCount: 3, userNotification: "Retrying..." };
  }
  if (input.errorContext === "tool_execution") {
    return { errorHandling: "skip", userNotification: "Tool skipped." };
  }
  return { errorHandling: "abort" };
}
```

| `errorContext` | Typical Errors | Recommended |
|---------------|---------------|-------------|
| `"model_call"` | Rate limits, timeouts | Retry |
| `"tool_execution"` | Handler threw | Skip |
| `"system"` | CLI crash | Abort |
| `"user_input"` | Invalid input | Skip |

| Strategy | Effect |
|----------|--------|
| `"retry"` | Try again (up to `retryCount`) |
| `"skip"` | Skip and continue |
| `"abort"` | Stop the session |

## Session Config — Hooks

```typescript
const session = await client.createSession({
  model: "gpt-4.1",
  onPermissionRequest: approveAll,
  hooks: {
    onSessionStart: async (input) => { ... },
    onUserPromptSubmitted: async (input) => { ... },
    onPreToolUse: async (input) => { ... },
    onPostToolUse: async (input) => { ... },
    onSessionEnd: async (input) => { ... },
    onErrorOccurred: async (input) => { ... },
  },
});
```

## Audit Trail Pattern

```typescript
const auditLog: AuditEntry[] = [];
const timers = new Map<string, number>();

hooks: {
  onPreToolUse: async (input) => {
    timers.set(input.toolName, Date.now());
    return { permissionDecision: "allow" };
  },
  onPostToolUse: async (input) => {
    const duration = Date.now() - (timers.get(input.toolName) ?? 0);
    auditLog.push({ tool: input.toolName, args: input.toolArgs, duration });
    return null;
  },
}
```

## Common Mistakes

| Mistake | What Happens | Fix |
|---------|-------------|-----|
| Missing `onPermissionRequest` | Session creation fails (required since v0.1.32) | Add `onPermissionRequest: approveAll` |
| Denying without `permissionDecisionReason` | Model gets no explanation | Always include a reason string |
| Mutating `input.toolResult` directly | Unpredictable behavior | Deep clone first: `JSON.parse(JSON.stringify(...))` |
| Returning a value from `onSessionEnd` | Value is ignored | Return `null` — use side effects only |
| Forgetting `permissionDecision` in onPreToolUse | May default unexpectedly | Always return `{ permissionDecision: "allow" }` explicitly |
| Not handling all `errorContext` values | Some errors unhandled | Add a default case: `return null` |
