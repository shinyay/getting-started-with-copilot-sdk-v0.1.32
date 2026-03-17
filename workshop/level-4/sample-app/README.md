# Level 4 Sample App: `study-buddy`

An interactive quiz and study assistant demonstrating conversational SDK features.

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
| `npm run repl` | `basic-repl.ts` | Minimal REPL with streaming (Exercises 1–2, 4) |
| `npm run tools` | `repl-with-tools.ts` | REPL with quiz tools (Exercise 3) |
| `npm run system` | `system-message.ts` | Append vs replace system messages (Exercises 5–6) |
| `npm run input` | `user-input-request.ts` | Agent asks YOU questions (Exercise 7) |
| `npm run commands` | `conversation-commands.ts` | Slash commands + signal handling (Exercises 8–9) |
| `npm run buddy` | `study-buddy.ts` | Capstone: full quiz assistant (Exercises 10–12) |

## Quick Start

```bash
npm run buddy
# Type "Quiz me on JavaScript" to start a quiz!
```

## Interactive Features

The capstone `study-buddy.ts` combines:
- 🧠 System message (quiz master personality)
- 🤖 `onUserInputRequest` (agent asks you questions)
- 🔧 4 tools (generate_quiz, check_answer, get_hint, get_score)
- 📊 Per-turn token tracking + score display
- ⌨️ Slash commands: `/help`, `/score`, `/topic`, `/exit`
- 🛑 Graceful Ctrl+C shutdown
