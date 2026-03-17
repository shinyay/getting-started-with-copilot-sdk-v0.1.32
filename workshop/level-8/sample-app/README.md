# Level 8 Sample App: `capstone`

Advanced features and real-world project builds — the final level.

## Prerequisites

- Node.js 20+
- Copilot CLI installed and authenticated (`copilot --version`)
- Level 6 sample-app installed (for MCP exercises — `cd ../../level-6/sample-app && npm install`)

## Setup

```bash
npm install
```

## Scripts

| Command | File | What It Does |
|---------|------|-------------|
| `npm run image` | `image-attachments.ts` | Send images for analysis (Exercise 1) |
| `npm run reasoning` | `reasoning-events.ts` | Observe chain-of-thought tokens (Exercise 2) |
| `npm run effort` | `reasoning-effort.ts` | Reasoning effort tradeoff (Exercise 3) |
| `npm run options` | `client-options.ts` | Advanced client options reference (Exercise 4) |
| `npm run weather` | `project-weather.ts` | Project: Weather assistant — L2+L3+L7 (Exercise 5) |
| `npm run review` | `project-code-review.ts` | Project: Code review agent — L5+L6+L7 (Exercise 6) |
| `npm run quiz` | `project-quiz.ts` | Project: Quiz generator — L3+L4 (Exercise 7) |
| `npm run docs` | `project-docs.ts` | Project: Docs assistant — L6+L7 (Exercise 8) |
| `npm run compare` | `multi-model.ts` | Multi-model comparison framework (Exercise 9) |
| `npm run test` | `test-tools.ts` | Testing patterns for handlers and hooks (Exercise 10) |

## Quick Start

```bash
npm run test
# Runs 9 unit tests for tool handlers and hooks — no API calls needed!
```

## Notes

- **Exercise 1** (images): Requires a `sample-images/diagram.png` file. See `sample-images/README.md` for instructions.
- **Exercises 6, 8** (MCP projects): Use the Level 6 sample-docs directory. Run `cd ../../level-6/sample-app && npm install` first.
- **Exercise 2** (reasoning): Not all models emit reasoning tokens. Results may vary.
- **Exercise 10** (testing): Runs entirely locally — no SDK, CLI, or API calls needed.
