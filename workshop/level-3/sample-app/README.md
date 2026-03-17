# Level 3 Sample App: `city-guide`

A multi-tool travel information assistant demonstrating custom tool definitions.

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
| `npm run first` | `first-tool.ts` | Your first tool with JSON Schema (Exercises 1–2) |
| `npm run zod` | `zod-tool.ts` | Same tool using Zod schemas (Exercise 3) |
| `npm run describe` | `description-experiment.ts` | Vague vs clear descriptions + error handling (Exercises 4, 11) |
| `npm run multi` | `multi-tool.ts` | 3 tools called by the model (Exercises 7–8) |
| `npm run optional` | `optional-params.ts` | Optional parameters with defaults (Exercise 9) |
| `npm run async` | `async-tool.ts` | Async handler with simulated delay (Exercise 10) |
| `npm run guide` | `city-guide.ts` | Capstone: 4-tool travel assistant (Exercise 12) |

## Quick Start

```bash
npm run first
# Watch the model call your get_weather tool and use the result
```

## Note on Zod

The `zod` package is included as a dependency for the Zod schema exercise.
It's optional — JSON Schema works without it. Zod adds ~50KB.
