# Sample App Instructions

These instructions apply to all files under `workshop/level-*/sample-app/`.

## Package Configuration

- `"type": "module"` in package.json (ESM)
- Dependencies: `@github/copilot-sdk` and `tsx` (minimum)
- Additional dependencies only when needed (e.g., `zod` for Level 3)
- One npm script per TypeScript file
- Script format: `"name": "npx tsx filename.ts"`

## TypeScript Conventions

- Each file is standalone — runnable with `npx tsx filename.ts`
- No tsconfig.json needed — tsx handles TypeScript directly
- Import SDK: `import { CopilotClient, defineTool } from "@github/copilot-sdk"`
- Import Node.js modules: `import readline from "node:readline/promises"`

## SDK Patterns (Required)

```typescript
// Always create client
const client = new CopilotClient();

// Always clean up
await client.stop();
process.exit(0);
```

- Always call `client.stop()` before `process.exit(0)`
- Use `process.stdout.write()` for streaming deltas (not `console.log`)
- Subscribe to events BEFORE calling `send`/`sendAndWait`
- Use `try-catch-finally` with `client.stop()` in `finally` for error paths

## File Header

Every `.ts` file must start with a JSDoc comment:

```typescript
/**
 * filename.ts — Brief description
 *
 * Longer explanation of what this file demonstrates.
 *
 * Exercise(s) covered: N (Title)
 *
 * Run: npx tsx filename.ts
 */
```

## Tool Handlers

- Return plain objects (JSON-serializable)
- Return `{ error: "message" }` for expected failures (don't throw)
- Handle optional parameters with `args.param ?? defaultValue`
- Use `console.log` inside handlers for visibility (🔧 markers)

## Comments

- Explain SDK concepts, not obvious code
- Focus on "why" not "what"
- Reference which level/exercise the concept comes from
