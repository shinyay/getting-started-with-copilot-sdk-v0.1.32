---
layout: cheatsheet
title: "Level 3: Tools — Cheatsheet"
parent_step: 3
permalink: /cheatsheet/3/
---

# Level 3 — Quick Reference Card

## `defineTool` API

```typescript
import { defineTool, approveAll } from "@github/copilot-sdk";

const myTool = defineTool("tool_name", {
  description: "What the tool does (THE most important field)",
  parameters: { /* JSON Schema */ } | z.object({ /* Zod */ }),
  handler: async (args) => {
    return { /* JSON-serializable result */ };
  },
});
```

| Part | Type | Required | Purpose |
|------|------|:--------:|---------|
| `name` | `string` | Yes | Unique identifier (use `snake_case`) |
| `description` | `string` | Yes | Tells model WHEN to call (be specific!) |
| `parameters` | JSON Schema or Zod | Yes | Defines arguments the tool accepts |
| `handler` | `async (args) => any` | Yes | Your function — must return JSON-serializable data |

## Session Config — Tools

```typescript
const session = await client.createSession({
  model: "gpt-4.1",
  tools: [tool1, tool2, tool3],  // Array of tool definitions
  onPermissionRequest: approveAll,
});
```

## JSON Schema vs Zod

| Aspect | JSON Schema | Zod |
|--------|------------|-----|
| **Syntax** | `{ type: "object", properties: {...} }` | `z.object({ city: z.string() })` |
| **Type safety** | Manual: `(args: { city: string })` | Automatic inference |
| **Descriptions** | `description` field in property | `.describe("...")` method |
| **Validation** | Schema only | Built-in (`.email()`, `.min()`) |
| **Portability** | Any language | TypeScript only |
| **Bundle size** | Zero | ~50KB (zod package) |

## Parameter Schema Patterns

| Pattern | JSON Schema | Zod |
|---------|------------|-----|
| Required string | `{ type: "string" }` + `required: ["x"]` | `z.string()` |
| Optional number | `{ type: "number" }` (omit from required) | `z.number().optional()` |
| Enum | `{ type: "string", enum: ["a", "b"] }` | `z.enum(["a", "b"])` |
| Boolean | `{ type: "boolean" }` | `z.boolean()` |
| Array of strings | `{ type: "array", items: { type: "string" } }` | `z.array(z.string())` |
| Nested object | `{ type: "object", properties: {...} }` | `z.object({ nested: z.string() })` |

## Tool Invocation Loop

```
1. Model reads user's question + ALL tool descriptions
2. Model decides: "I need get_weather for this"
3. Model sends: { tool: "get_weather", args: { city: "Tokyo" } }
4. SDK calls: handler({ city: "Tokyo" })
5. Handler returns: { temperature: "22°C", condition: "Cloudy" }
6. SDK sends result back to model
7. Model weaves result into natural-language response
```

## Error Handling in Tools

| Approach | Code | Model Behavior | Use For |
|----------|------|---------------|---------|
| Return error object | `return { error: "City not found" }` | Explains error helpfully | Expected errors |
| Throw exception | `throw new Error("Bug!")` | May give generic error | Unexpected bugs |

## Description Writing Guide

```
✅ "Get the current weather temperature and conditions for a given city"
✅ "Search the database for products matching a keyword"
✅ "Calculate the monthly payment for a loan given principal, rate, and term"

❌ "Does stuff with cities"
❌ "Helper function"
❌ "Tool 1"
```

## Return Value Rules

```
✅ Plain objects:     { city: "Tokyo", temp: 22 }
✅ Nested objects:    { forecast: { day1: "Sunny" } }
✅ Arrays:            { items: ["a", "b", "c"] }
✅ Primitives:        "success", 42, true, null

❌ Class instances:   new Date()  (methods stripped)
❌ Circular refs:     obj.self = obj  (throws)
❌ Functions:         { fn: () => {} }  (not serializable)
❌ undefined:         use null instead
```

## Optional Parameters Pattern

```typescript
// Schema: omit from required array
required: ["city"],  // "units" is optional

// Handler: use ?? for defaults
handler: async (args: { city: string; units?: string }) => {
  const units = args.units ?? "celsius";
}
```

## Common Mistakes

| Mistake | What Happens | Fix |
|---------|-------------|-----|
| Vague description | Model never calls the tool | Be specific: what data, what input |
| Non-serializable return | Runtime error | Only return plain objects/arrays/primitives |
| Missing `required` array | Model may omit required args | Always include `required: ["param"]` |
| No default for optional args | Handler crashes on `undefined` | Use `args.param ?? defaultValue` |
| Throwing on expected errors | Poor user experience | Return `{ error: "message" }` instead |
| No timeout on async handlers | Conversation stalls forever | Add `Promise.race` with timeout |
