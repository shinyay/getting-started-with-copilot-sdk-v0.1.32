---
layout: cheatsheet
title: "Level 1: Connect — Cheatsheet"
parent_step: 1
permalink: /cheatsheet/1/
---

# Level 1 — Quick Reference Card

## SDK Setup

| Command | Purpose |
|---------|---------|
| `npm init -y` | Create a new Node.js project |
| `npm install @github/copilot-sdk tsx` | Install the SDK and TypeScript runner |
| `npx tsx file.ts` | Run a TypeScript file directly (no compilation) |
| `copilot --version` | Verify the Copilot CLI is installed |
| `copilot auth login` | Authenticate with GitHub (interactive) |

## Core API

| API | What It Does | Returns |
|-----|-------------|---------|
| `new CopilotClient()` | Spawn CLI subprocess, establish connection | `CopilotClient` |
| `client.createSession({ model })` | Start a new conversation | `Promise<Session>` |
| `session.sendAndWait({ prompt })` | Send a message and wait for full response | `Promise<Response>` |
| `client.stop()` | Shut down the CLI subprocess | `Promise<void>` |
| `process.exit(0)` | Exit Node.js cleanly | — |

## Minimal Working Example

```typescript
import { CopilotClient, approveAll } from "@github/copilot-sdk";

const client = new CopilotClient();
const session = await client.createSession({ model: "gpt-4.1", onPermissionRequest: approveAll });
const response = await session.sendAndWait({ prompt: "What is 2 + 2?" });
console.log(response?.data.content);
await client.stop();
process.exit(0);
```

## CopilotClient Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `logLevel` | `string` | `"warn"` | `"debug"` \| `"info"` \| `"warn"` \| `"error"` |
| `githubToken` | `string` | — | Explicit auth token (highest priority) |
| `cliPath` | `string` | `"copilot"` | Custom path to CLI binary |
| `cliUrl` | `string` | — | Connect to external CLI server (Level 7) |
| `useLoggedInUser` | `boolean` | — | Use logged-in GitHub user |

## Session Config (Level 1)

| Option | Type | Required | Description |
|--------|------|:--------:|-------------|
| `model` | `string` | **Yes** | LLM model name (e.g., `"gpt-4.1"`) |
| `onPermissionRequest` | `function` | **Yes** | Permission handler — use `approveAll` for learning |

> All other options (`streaming`, `tools`, `hooks`, `mcpServers`, etc.) are covered in Levels 2–8.

## Authentication Priority

```
1. Explicit githubToken       →  new CopilotClient({ githubToken: "..." })
2. COPILOT_GITHUB_TOKEN       →  export COPILOT_GITHUB_TOKEN=gho_...
3. GH_TOKEN                   →  export GH_TOKEN=gho_...
4. GITHUB_TOKEN               →  export GITHUB_TOKEN=gho_...
5. Stored OAuth credentials   →  copilot auth login
6. GitHub CLI credentials     →  gh auth login
```

## Response Object

```typescript
response?.data.content    // The text response (string)
response?.data.role       // Always "assistant"
```

> Use optional chaining (`?.`) — `sendAndWait` may return `undefined` in edge cases.

## Architecture

```
Your Code → SDK Client → JSON-RPC (stdio) → Copilot CLI → LLM API
                ↑                                  ↑
          Node.js library                  Separate process
         (spawns the CLI)             (handles auth & routing)
```

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| CLI not found | `copilot` not in PATH | Install CLI: `npm i -g @github/copilot` or `brew install copilot-cli` |
| Auth failed | No valid credentials | Run `copilot auth login` |
| Invalid model | Model name not recognized | Check available models, use `"gpt-4.1"` |
| Permissions denied | Missing `onPermissionRequest` | Add `onPermissionRequest: approveAll` to `createSession()` |
| Script hangs | Missing `process.exit(0)` | Add `process.exit(0)` after `client.stop()` |
| Orphaned process | Missing `client.stop()` | Always call `client.stop()` in `finally` block |

## Key Rules

```
✅ Always import approveAll alongside CopilotClient
✅ Always pass onPermissionRequest: approveAll to createSession()
✅ Always call client.stop() when done
✅ Always call process.exit(0) after stop
✅ model is required in createSession()
✅ sendAndWait blocks until response is complete
✅ Wrap SDK calls in try-catch-finally
✅ Use response?.data.content (optional chaining)
```

## Log Levels

```
debug  →  Full JSON-RPC traffic (most verbose)
info   →  Key events (session created, message sent)
warn   →  Potential issues (default)
error  →  Only errors
```
