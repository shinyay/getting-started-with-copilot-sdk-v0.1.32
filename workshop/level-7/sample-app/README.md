# Level 7 Sample App: `standup-bot`

A production-ready daily standup assistant demonstrating auth, BYOK, persistence, and deployment patterns.

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
| `npm run auth` | `auth-methods.ts` | Authentication priority chain (Exercise 1) |
| `npm run openai` | `byok-openai.ts` | BYOK with OpenAI (Exercise 2) |
| `npm run ollama` | `byok-ollama.ts` | BYOK with local Ollama (Exercise 3) |
| `npm run azure` | `byok-azure.ts` | Azure BYOK config reference (Exercise 4) |
| `npm run persist` | `session-persist.ts` | Session persistence + resume (Exercises 5–6) |
| `npm run infinite` | `infinite-session.ts` | Infinite sessions with auto-compaction (Exercise 7) |
| `npm run parallel` | `parallel-sessions.ts` | Two models in parallel (Exercise 8) |
| `npm run external` | `external-cli.ts` | External CLI mode reference (Exercise 9) |
| `npm run recovery` | `error-recovery.ts` | Error recovery strategies (Exercise 10) |
| `npm run standup` | `standup-bot.ts` | Capstone: full standup bot (Exercises 11–12) |

## Quick Start

```bash
npm run standup
# The bot guides you through a daily standup: yesterday, today, blockers
```

## Notes

- **BYOK exercises** (openai, ollama, azure) require API keys or local Ollama
- **Session persistence** creates state files in `~/.copilot/session-state/`
- **External CLI** exercise requires running `copilot --headless --port 3000` separately
