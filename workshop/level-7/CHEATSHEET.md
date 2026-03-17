# Level 7 — Quick Reference Card

## Authentication Priority

```
1. Explicit githubToken       →  new CopilotClient({ githubToken: "gho_..." })
2. COPILOT_GITHUB_TOKEN       →  export COPILOT_GITHUB_TOKEN=gho_...
3. GH_TOKEN                   →  export GH_TOKEN=gho_...
4. GITHUB_TOKEN               →  export GITHUB_TOKEN=gho_...
5. Stored OAuth credentials   →  copilot auth login
6. GitHub CLI credentials     →  gh auth login
```

> Higher priority wins silently. Use `logLevel: "debug"` to verify which is active.

## BYOK Providers

| Provider | `type` | `baseUrl` | `apiKey` |
|----------|--------|-----------|----------|
| OpenAI | `"openai"` | `https://api.openai.com/v1` | Required |
| Ollama (local) | `"openai"` | `http://localhost:11434/v1` | Not needed |
| Azure (native) | `"azure"` | `https://resource.openai.azure.com` | Required |
| Azure (Foundry) | `"openai"` | `https://resource.../openai/v1/` | Required |
| Anthropic | `"anthropic"` | `https://api.anthropic.com` | Required |

```typescript
const session = await client.createSession({
  model: "gpt-4",        // REQUIRED with BYOK
  onPermissionRequest: approveAll,  // Required since v0.1.32
  provider: {
    type: "openai",
    baseUrl: "https://api.openai.com/v1",
    apiKey: process.env.OPENAI_API_KEY,
  },
});
```

> ⚠️ Azure gotcha: native = `type: "azure"` + host only. Foundry = `type: "openai"` + full `/openai/v1/` path.

## Session Persistence

```typescript
// Create with stable ID
const session = await client.createSession({
  sessionId: "alice-standup-2024-01-15",
  model: "gpt-4.1",
  onPermissionRequest: approveAll,  // Required since v0.1.32
});

// Resume later (even after restart)
const resumed = await client.resumeSession("alice-standup-2024-01-15");

// Switch model mid-session (since v0.1.30)
await session.setModel("gpt-4.1-mini");
```

| Persists ✅ | Doesn't Persist ❌ |
|-------------|-------------------|
| Conversation history | API keys |
| Tool results | In-memory tool state |
| Agent plan + artifacts | Event handler registrations |

## Session ID Patterns

```
✅ {userId}-{task}-{date}     →  alice-standup-2024-01-15
✅ {team}-{feature}-{pr}      →  frontend-review-pr-42
✅ {service}-{requestId}      →  api-req-abc123

❌ Random UUIDs               →  a1b2c3d4-...  (can't audit/cleanup)
❌ User input as ID           →  injection risk
```

## Infinite Sessions

```typescript
infiniteSessions: {
  enabled: true,
  backgroundCompactionThreshold: 0.80,   // Compact at 80% context
  bufferExhaustionThreshold: 0.95,        // Block at 95% until done
},
```

## Parallel Sessions

```typescript
const [r1, r2] = await Promise.all([
  session1.sendAndWait({ prompt: "..." }),
  session2.sendAndWait({ prompt: "..." }),
]);
// Sessions are independent — no shared state
```

## External CLI Mode

```bash
# Terminal 1: Start CLI externally
copilot --headless --port 3000

# Terminal 2: Connect from code
const client = new CopilotClient({ cliUrl: "http://localhost:3000" });
```

## Error Recovery

```typescript
onErrorOccurred: async (input) => {
  if (input.errorContext === "model_call")
    return { errorHandling: "retry", retryCount: 3 };
  if (input.errorContext === "tool_execution")
    return { errorHandling: "skip" };
  if (input.errorContext === "system")
    return { errorHandling: "abort" };
  return null;
}
```

## Observability Layers

```
Layer 1:  logLevel: "debug"           →  JSON-RPC wire protocol (dev only)
Layer 2:  assistant.usage events      →  Token cost tracking (always)
Layer 3:  onPreToolUse / audit hooks  →  Tool call audit trail (compliance)
```

## Session Config — Level 7

| Option | Type | Description |
|--------|------|-------------|
| `provider` | `{ type, baseUrl, apiKey }` | BYOK provider configuration |
| `onPermissionRequest` | `approveAll` or custom handler | **Required since v0.1.32** — permission handler for tool execution |
| `sessionId` | `string` | Stable ID for persistence |
| `infiniteSessions` | `{ enabled, thresholds }` | Auto-compaction for long conversations |

## Common Mistakes

| Mistake | What Happens | Fix |
|---------|-------------|-----|
| BYOK without `model` | SDK throws error | Always specify `model` with `provider` |
| Missing `onPermissionRequest` | Tools won't execute | Add `onPermissionRequest: approveAll` (or custom handler) |
| Azure native with `type: "openai"` | Connection error | Use `type: "azure"` + host only |
| Committing API keys | Security breach | Use `process.env.API_KEY` |
| Random UUID session IDs | Can't audit or clean up | Use `{user}-{task}-{date}` |
| No error recovery hook | Single failure crashes app | Add `onErrorOccurred` with retry |
| No `timeout` on infinite sessions | Context fills silently | Set compaction thresholds |
