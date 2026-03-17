# Level 2 Sample App: `story-streamer`

A streaming story generator that demonstrates real-time token-by-token response handling.

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
| `npm run basic` | `stream-basic.ts` | Basic streaming with deltas (Exercises 1–2, 5) |
| `npm run events` | `stream-events.ts` | All event types with ordering + timestamps (Exercises 3–4, 7) |
| `npm run compare` | `send-vs-sendandwait.ts` | Side-by-side comparison of both patterns (Exercise 6) |
| `npm run usage` | `token-usage.ts` | Token tracking across 3 prompts (Exercises 8, 11) |
| `npm run spinner` | `typing-indicator.ts` | Spinner → streaming transition (Exercise 9) |
| `npm run story` | `story-streamer.ts` | Full demo: 3-part story with usage tracking (Exercises 10, 12) |

## Quick Start

```bash
npm run basic
# Watch text appear progressively, token by token
```
