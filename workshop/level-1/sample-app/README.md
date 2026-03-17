# Level 1 Sample App: `hello-copilot`

The simplest possible Copilot SDK programs — send a prompt, get a response.

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
| `npm run hello` | `hello.ts` | Send a prompt, print the response (Exercises 1–7) |
| `npm run models` | `try-models.ts` | Compare two models side-by-side (Exercise 8) |
| `npm run debug` | `debug-logging.ts` | See JSON-RPC traffic with debug logging (Exercise 10) |
| `npm run errors` | `error-handling.ts` | Graceful error handling patterns (Exercise 11) |
| `npm run config` | `explore-config.ts` | Preview all SessionConfig options (Exercise 12) |

## Quick Verification

```bash
npm run hello
# Expected output: "Response: 4"
```

If you see the response, your SDK setup is working correctly!
