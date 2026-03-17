# Level 5 Sample App: `safe-coder`

A security-aware coding assistant demonstrating all 6 hook types.

## Prerequisites

- Node.js 20+
- Copilot CLI installed and authenticated (`copilot --version`)

## Setup

```bash
npm install
```

## Scripts

| Command | File | What It Does |
|---------|------|-------------|
| `npm run start` | `session-start-hook.ts` | Inject project context at session start (Exercise 1) |
| `npm run prompt` | `prompt-hooks.ts` | Intercept and expand prompt shortcuts (Exercises 2–3) |
| `npm run pre` | `pre-tool-hook.ts` | Gate, log, and modify tool calls (Exercises 4–6) |
| `npm run post` | `post-tool-hook.ts` | Redact secrets from tool results (Exercise 7) |
| `npm run audit` | `audit-logger.ts` | Full audit trail with pre+post hooks (Exercise 8) |
| `npm run error` | `error-hook.ts` | Custom error recovery strategies (Exercise 10) |
| `npm run safe` | `safe-coder.ts` | Capstone: all 6 hooks combined (Exercises 9, 11–12) |

## Quick Start

```bash
npm run safe
# Try: "Read the index.ts file and review it for security issues"
# Try: "/review the authentication module"
```

## Hook Types Demonstrated

| Hook | Purpose | File |
|------|---------|------|
| `onSessionStart` | Inject project context | `session-start-hook.ts`, `safe-coder.ts` |
| `onUserPromptSubmitted` | Expand shortcuts, add context | `prompt-hooks.ts`, `safe-coder.ts` |
| `onPreToolUse` | Permission gating, logging | `pre-tool-hook.ts`, `safe-coder.ts` |
| `onPostToolUse` | Redact secrets, transform results | `post-tool-hook.ts`, `safe-coder.ts` |
| `onSessionEnd` | Audit summary, cleanup | `safe-coder.ts` |
| `onErrorOccurred` | Retry, skip, abort strategies | `error-hook.ts`, `safe-coder.ts` |
