# Level 3: Tools — Let the Model Call Your Code

> **Risk level:** 🟡 Low — Tools execute YOUR code, but all tools in this level use hardcoded data. No file writes, no network calls, no side effects.

## Learning Objectives

By the end of this level, you will be able to:

1. Define a custom tool with `defineTool()` and pass it to a session
2. Write JSON Schema parameter definitions with types, descriptions, and required fields
3. Use Zod for type-safe tool parameter schemas with automatic TypeScript inference
4. Write clear tool descriptions that reliably trigger model invocation
5. Access typed tool arguments in handler functions
6. Return JSON-serializable data from tool handlers
7. Trace the 4-step tool invocation loop (model decides → SDK calls → result sent → model responds)
8. Define multiple tools and watch the model choose which one(s) to call
9. Handle optional parameters with defaults in tool handlers
10. Write async tool handlers that call APIs or databases
11. Handle errors in tools gracefully (return error objects vs throwing)
12. Build a multi-tool assistant that orchestrates 4+ tools into a cohesive experience

---

## Prerequisites

- [ ] **Level 2 completed** (you can stream responses and handle events)
- [ ] Node.js 20+, Copilot CLI installed and authenticated
- [ ] This repository cloned locally

---

## Workshop Structure

This level contains **12 exercises**. Estimated time: **60–80 minutes**.

| Exercise | Topic | Time |
|----------|-------|------|
| 1 | Your First Tool Definition | 7 min |
| 2 | Understand JSON Schema Parameters | 5 min |
| 3 | Use Zod for Type-Safe Schemas | 7 min |
| 4 | Write a Clear Description | 5 min |
| 5 | Handle Typed Tool Arguments | 5 min |
| 6 | Return Structured Data | 5 min |
| 7 | Observe the Tool Invocation Loop | 7 min |
| 8 | Define Multiple Tools | 5 min |
| 9 | Tools with Optional Parameters | 5 min |
| 10 | Async Tool Handlers | 5 min |
| 11 | Error Handling in Tools | 7 min |
| 12 | Build a Multi-Tool Travel Assistant | 7 min |

---

## Exercise 1: Your First Tool Definition

### Goal
Define a custom tool and watch the model call it. This is the SDK's most powerful feature — you give the model functions it can invoke on its own.

### Steps

**1.1** Navigate to the sample app and install dependencies:

```bash
cd workshop/level-3/sample-app
npm install
```

**1.2** Run your first tool:

```bash
npm run first
```

**1.3** Observe the output — the model received weather data from YOUR function and incorporated it into its response.

**1.4** Open `first-tool.ts` and study the anatomy of a tool definition:

```typescript
import { CopilotClient, defineTool, approveAll } from "@github/copilot-sdk";

const getWeather = defineTool("get_weather", {
  description: "Get the current weather temperature and conditions for a given city",
  parameters: {
    type: "object",
    properties: {
      city: { type: "string", description: "The city name" },
    },
    required: ["city"],
  },
  handler: async (args: { city: string }) => {
    return { city: args.city, temperature: "22°C", condition: "Partly cloudy" };
  },
});
```

**1.5** The four parts of every tool:

| Part | Purpose | Example |
|------|---------|---------|
| **name** | Unique identifier (snake_case) | `"get_weather"` |
| **description** | Tells the model WHEN to call it | `"Get the current weather..."` |
| **parameters** | JSON Schema defining arguments | `{ type: "object", properties: {...} }` |
| **handler** | Your function that runs when called | `async (args) => { return {...} }` |

**1.6** Notice how the tool is passed to the session:

```typescript
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  tools: [getWeather],  // Array of tools
  onPermissionRequest: approveAll,
});
```

### Key Concept

> 💡 **You define the tool, the model decides when to call it.** You don't call the tool yourself — you describe what it does, and the model invokes it when it determines the user's question requires that information. This is "agent" behavior: the model acts autonomously using your tools.

### ✅ Checkpoint
You ran `npm run first`, saw the model use your weather tool's data in its response, and can name the 4 parts of a tool definition.

---

## Exercise 2: Understand JSON Schema Parameters

### Goal
Master the JSON Schema format used to define tool parameters — the contract between the model and your handler.

### Steps

**2.1** Open `first-tool.ts` and examine the `parameters` object:

```typescript
parameters: {
  type: "object",             // Always "object" at the top level
  properties: {               // Each parameter is a property
    city: {
      type: "string",         // The data type
      description: "The city name (e.g., 'Tokyo', 'Paris')",
    },
  },
  required: ["city"],         // Which parameters are required
},
```

**2.2** The three essential parts:

| Part | Purpose | Always Present? |
|------|---------|:---------------:|
| `type: "object"` | Top-level wrapper | Yes |
| `properties: { ... }` | Define each parameter | Yes |
| `required: [...]` | List required params | Yes (can be empty `[]`) |

**2.3** Each property has:

| Field | Purpose | Example |
|-------|---------|---------|
| `type` | Data type | `"string"`, `"number"`, `"boolean"`, `"array"` |
| `description` | Helps model provide the right value | `"The city name"` |
| `enum` | Restrict to specific values | `["celsius", "fahrenheit"]` |

**2.4** Try writing a 2-parameter schema from scratch. For a `get_population` tool:

```typescript
parameters: {
  type: "object",
  properties: {
    city: { type: "string", description: "The city name" },
    includeMetro: { type: "boolean", description: "Include metropolitan area?" },
  },
  required: ["city"],  // city required, includeMetro optional
},
```

### Key Concept

> 💡 **JSON Schema is the model's instruction manual for your tool.** The model reads the schema to know: (1) what parameters exist, (2) what types they expect, (3) which are required, and (4) what each one means. A well-described schema = the model passes the right arguments.

### ✅ Checkpoint
You can write a multi-parameter JSON Schema from scratch with types, descriptions, and required fields.

---

## Exercise 3: Use Zod for Type-Safe Schemas

### Goal
Replace raw JSON Schema with Zod — a TypeScript-native schema library that gives you automatic type inference and cleaner syntax.

### Steps

**3.1** Run the Zod version:

```bash
npm run zod
```

**3.2** Open `zod-tool.ts` and compare the Zod approach:

```typescript
import { z } from "zod";

const getWeather = defineTool("get_weather", {
  description: "Get the current weather...",

  // Zod schema — cleaner than JSON Schema
  parameters: z.object({
    city: z.string().describe("The city name (e.g., 'Tokyo', 'Paris')"),
  }),

  // No manual type annotation needed — Zod infers it!
  handler: async (args) => {
    // args.city is automatically typed as string
    return { city: args.city, temperature: "22°C" };
  },
});
```

**3.3** Compare the two approaches side by side:

| Aspect | JSON Schema | Zod |
|--------|------------|-----|
| Syntax | Verbose object literals | Fluent builder pattern |
| Type safety | Manual `(args: { city: string })` | Automatic inference |
| Descriptions | `description` field in schema | `.describe("...")` method |
| Validation | None (schema only) | Built-in (`.email()`, `.min()`, etc.) |
| Portability | Standard (any language) | TypeScript only |
| Bundle size | Zero | ~50KB (`zod` package) |

**3.4** Zod schema examples for common types:

```typescript
z.string()                        // string
z.number()                        // number
z.boolean()                       // boolean
z.enum(["celsius", "fahrenheit"]) // enum
z.string().optional()             // optional string
z.array(z.string())               // string array
z.object({ nested: z.string() })  // nested object
```

### Key Concept

> 💡 **Zod = type safety without duplication.** With JSON Schema, you write the schema AND a separate TypeScript type for the handler args. With Zod, you write the schema once and TypeScript infers the handler's argument types automatically. Use Zod for TypeScript projects; use JSON Schema when you need cross-language portability.

### ✅ Checkpoint
You ran the Zod version, understand the syntax, and can explain when to use Zod vs JSON Schema.

---

## Exercise 4: Write a Clear Description

### Goal
Prove that the `description` field is the single most important part of a tool definition — it determines whether the model calls your tool at all.

### Steps

**4.1** Run the description experiment:

```bash
npm run describe
```

**4.2** Observe the two tests:

```
=== Test 1: Vague description ("Does stuff with cities") ===
(The model may answer from its own knowledge, ignoring the tool)

=== Test 2: Clear description ("Get the current weather...") ===
(The model calls the tool and uses real data)
```

**4.3** Open `description-experiment.ts` and see the two definitions:

```typescript
// Vague — model doesn't know when to use this
const vagueWeather = defineTool("city_info", {
  description: "Does stuff with cities",  // ❌ Too vague
  // ...
});

// Clear — model knows exactly when to use this
const clearWeather = defineTool("get_weather", {
  description: "Get the current weather temperature and conditions for a given city",  // ✅
  // ...
});
```

**4.4** Description writing guidelines:

| ✅ Do | ❌ Don't |
|------|---------|
| Be specific about what data it returns | Use vague words like "does stuff" |
| Mention the input it expects | Use internal jargon or abbreviations |
| Include trigger words the user might say | Write a novel (keep it 1-2 sentences) |
| Use action verbs ("Get", "Calculate", "Search") | Make it identical to another tool's description |

### Key Concept

> 💡 **The description is the model's ONLY signal for when to call your tool.** The model never sees your handler code. It reads the description, matches it against the user's question, and decides "this tool can answer that." A vague description = the model guesses from its training data instead.

### ✅ Checkpoint
You observed the difference between vague and clear descriptions and can write an effective tool description.

---

## Exercise 5: Handle Typed Tool Arguments

### Goal
Access tool arguments in the handler with full TypeScript type safety.

### Steps

**5.1** With **JSON Schema**, you must annotate the handler manually:

```typescript
handler: async (args: { city: string }) => {
  //             ↑ You write this type annotation
  console.log(args.city);  // TypeScript knows this is a string
}
```

**5.2** With **Zod**, TypeScript infers the types automatically:

```typescript
parameters: z.object({
  city: z.string().describe("City name"),
}),
handler: async (args) => {
  //             ↑ TypeScript infers { city: string } from the Zod schema
  console.log(args.city);  // Still typed correctly!
}
```

**5.3** Try accessing a non-existent property:

```typescript
handler: async (args: { city: string }) => {
  console.log(args.country);  // TypeScript error: Property 'country' does not exist
}
```

**5.4** For complex parameters, both approaches work:

```typescript
// JSON Schema — manual type
handler: async (args: { city: string; units?: string; detailed?: boolean }) => { ... }

// Zod — automatic type
parameters: z.object({
  city: z.string(),
  units: z.enum(["celsius", "fahrenheit"]).optional(),
  detailed: z.boolean().optional(),
}),
handler: async (args) => { ... }  // All types inferred
```

### Key Concept

> 💡 **Type safety prevents runtime bugs.** If the model passes `"Tokyo"` for `city`, TypeScript guarantees your handler treats it as a string. If you try to do math on it (`args.city * 2`), TypeScript catches the error at compile time, not when the model calls the tool in production.

### ✅ Checkpoint
You understand both the manual (JSON Schema) and automatic (Zod) approaches to typed handler arguments.

---

## Exercise 6: Return Structured Data

### Goal
Understand what tool handlers can and cannot return — the data must be JSON-serializable.

### Steps

**6.1** Valid return values (JSON-serializable):

```typescript
// ✅ Plain objects
return { city: "Tokyo", temperature: 22 };

// ✅ Nested objects
return { city: "Tokyo", forecast: { day1: "Sunny", day2: "Cloudy" } };

// ✅ Arrays
return { landmarks: ["Eiffel Tower", "Louvre", "Notre-Dame"] };

// ✅ Strings, numbers, booleans
return { result: "success", count: 42, active: true };

// ✅ null
return null;
```

**6.2** Invalid return values (NOT JSON-serializable):

```typescript
// ❌ Class instances (methods are stripped)
return new Date();  // Becomes a string, but may not be what you expect

// ❌ Circular references
const obj: any = {}; obj.self = obj;
return obj;  // Throws: Converting circular structure to JSON

// ❌ Functions
return { callback: () => {} };  // Functions can't be serialized

// ❌ undefined (use null instead)
return undefined;
```

**6.3** Best practice — return structured objects with clear field names:

```typescript
// ✅ Good: clear, descriptive fields
return {
  city: args.city,
  temperature: `${temp}°C`,
  condition: "Partly cloudy",
  humidity: "65%",
};

// ❌ Bad: ambiguous, hard for the model to interpret
return { val: 22, s: "cloudy" };
```

### Key Concept

> 💡 **The model reads your return value to answer the user.** Clear field names like `temperature` and `condition` help the model construct a natural-sounding response. Cryptic names like `val` and `s` force the model to guess what the data means.

### ✅ Checkpoint
You know that return values must be JSON-serializable and that clear field names help the model construct better responses.

---

## Exercise 7: Observe the Tool Invocation Loop

### Goal
Trace exactly what happens when the model calls a tool — the 4-step loop that is the foundation of agentic behavior.

### Steps

**7.1** Run the multi-tool script and watch the `🔧` markers:

```bash
npm run multi
```

**7.2** Observe output like:

```
  🔧 [get_weather called with: Tokyo]
  🔧 [get_population called with: Tokyo]
  🔧 [get_timezone called with: Tokyo]

Tokyo is a vibrant city with partly cloudy weather at 22°C...
```

**7.3** The 4-step tool invocation loop:

```
Step 1: Model reads user's question + all tool descriptions
        → Decides: "I need get_weather for this question"

Step 2: Model sends tool call request with arguments
        → { toolName: "get_weather", args: { city: "Tokyo" } }

Step 3: SDK invokes YOUR handler function with parsed args
        → handler({ city: "Tokyo" }) returns { temperature: "22°C", ... }

Step 4: SDK sends result back to model
        → Model incorporates data into its response
```

**7.4** Open `multi-tool.ts` and see the `console.log` inside each handler:

```typescript
handler: async (args: { city: string }) => {
  console.log(`  🔧 [get_weather called with: ${args.city}]`);
  // ...
},
```

This makes tool calls visible. In production, you'd use this technique for logging/auditing.

**7.5** For even deeper visibility, try adding `logLevel: "debug"` to the client:

```typescript
const client = new CopilotClient({ logLevel: "debug" });
```

You'll see the raw JSON-RPC messages for each step of the loop.

### Key Concept

> 💡 **The model is the orchestrator, not you.** You don't call tools — the model decides which tools to call, in what order, and with what arguments. Your job is to define tools with clear descriptions and reliable handlers. The SDK and model handle everything else.

### ✅ Checkpoint
You can trace all 4 steps of the tool invocation loop and know that the model — not you — decides when to call tools.

---

## Exercise 8: Define Multiple Tools

### Goal
Pass multiple tools to a session and watch the model choose the right one(s) for the user's question.

### Steps

**8.1** Run the multi-tool demo:

```bash
npm run multi
```

**8.2** Open `multi-tool.ts` and see the 3 tools defined:

```typescript
const getWeather = defineTool("get_weather", { ... });
const getPopulation = defineTool("get_population", { ... });
const getTimezone = defineTool("get_timezone", { ... });

// Pass ALL tools in an array
const session = await client.createSession({
  tools: [getWeather, getPopulation, getTimezone],
  onPermissionRequest: approveAll,
});
```

**8.3** The prompt asks about weather, population, AND time:

```typescript
prompt: "Tell me about Tokyo — what's the weather, population, and current local time?"
```

**8.4** Observe: the model calls all 3 tools because the question requires data from each one. If you asked "What's the weather in Tokyo?" it would only call `get_weather`.

**8.5** Key insight — **the model reads ALL descriptions** and decides:
- Which tools are relevant to the question
- What order to call them
- What arguments to pass each one

Try asking a question that only needs one tool: "What time is it in Paris?" and verify only `get_timezone` is called.

### Key Concept

> 💡 **Multi-tool orchestration is automatic.** You don't write if-else logic to route questions to tools. The model handles all routing based on descriptions. This is why descriptions are so important (Exercise 4) — they're the model's routing rules.

### ✅ Checkpoint
You see 3 tool calls in one conversation and understand that the model automatically selects which tools to invoke.

---

## Exercise 9: Tools with Optional Parameters

### Goal
Define tools with optional parameters that have default values in your handler.

### Steps

**9.1** Run the optional parameters demo:

```bash
npm run optional
```

**9.2** Open `optional-params.ts` and examine the schema:

```typescript
parameters: {
  type: "object",
  properties: {
    city: { type: "string", description: "The city name" },
    units: {
      type: "string",
      enum: ["celsius", "fahrenheit"],       // Restricted values
      description: "Temperature units (default: celsius)",
    },
  },
  required: ["city"],  // Only city is required — units is optional
},
```

**9.3** The handler must provide a default for optional params:

```typescript
handler: async (args: { city: string; units?: string }) => {
  const units = args.units ?? "celsius";  // Default if model doesn't pass it
  // ...
},
```

**9.4** The prompt asks for specific units:

```
"What's the weather in Tokyo in fahrenheit? And Paris in celsius?"
```

The model passes `units: "fahrenheit"` for Tokyo and `units: "celsius"` (or omits it) for Paris.

**9.5** The Zod equivalent:

```typescript
parameters: z.object({
  city: z.string().describe("City name"),
  units: z.enum(["celsius", "fahrenheit"]).optional().describe("Temperature units"),
}),
```

### Key Concept

> 💡 **Optional parameters need defaults in your handler.** The model may or may not pass optional params — your handler must work either way. Use `args.param ?? defaultValue` to ensure safe behavior. The `enum` constraint helps the model pass valid values.

### ✅ Checkpoint
You can define optional parameters with `enum` constraints and handle defaults in the handler with `??`.

---

## Exercise 10: Async Tool Handlers

### Goal
Demonstrate that tool handlers can be async and the SDK waits for the Promise to resolve.

### Steps

**10.1** Run the async handler demo:

```bash
npm run async
```

**10.2** Observe the delay:

```
  ⏳ [Fetching forecast for Tokyo... (simulated 1s delay)]
  ✅ [Forecast received for Tokyo]

(streaming response with forecast data)
```

**10.3** Open `async-tool.ts` and see the handler:

```typescript
handler: async (args: { city: string }) => {
  console.log(`  ⏳ [Fetching forecast for ${args.city}...]`);

  // Simulate a network request that takes time
  await delay(1000);

  // In production: await fetch("https://api.weather.com/...")
  return { city: args.city, forecast: { day1: "Sunny", day2: "Cloudy", day3: "Rain" } };
},
```

**10.4** The SDK waits patiently — the model doesn't receive the result until your handler's Promise resolves. This means you can:

| Use Case | Handler Code |
|----------|-------------|
| Call a REST API | `await fetch("https://api.example.com/")` |
| Query a database | `await db.query("SELECT * FROM ...")` |
| Read a file | `await fs.readFile("./data.json")` |
| Call another service | `await grpcClient.getData(args)` |

**10.5** Important: there's no built-in timeout. If your handler hangs, the conversation stalls. In production, always add a timeout:

```typescript
const result = await Promise.race([
  fetchWeather(args.city),
  delay(5000).then(() => ({ error: "Request timed out" })),
]);
```

### Key Concept

> 💡 **Handlers are async — the SDK awaits your Promise.** This is what makes tools powerful in production: they can call real APIs, query real databases, and access real file systems. The model doesn't know or care that the data took 2 seconds to fetch — it just sees the result.

### ✅ Checkpoint
You see the 1-second delay and understand that async handlers can call external services.

---

## Exercise 11: Error Handling in Tools

### Goal
Learn two approaches to handling errors in tool handlers and understand why returning error objects is preferred.

### Steps

**11.1** Run the description experiment (which also tests error handling):

```bash
npm run describe
```

**11.2** Observe Test 3 — an unknown city:

```
=== Test 3: Error handling — unknown city ===
The model gracefully explains: "I don't have weather data for Atlantis..."
```

**11.3** **Approach 1: Return an error object** (preferred):

```typescript
handler: async (args: { city: string }) => {
  const data = weatherData[args.city];
  if (!data) {
    // Return an error — the model sees this and explains it to the user
    return { error: `City "${args.city}" not found. Available: Tokyo, Paris, London` };
  }
  return { city: args.city, temperature: `${data.temp}°C` };
},
```

The model receives the error message and crafts a helpful response like: "I couldn't find weather data for Atlantis. Available cities are Tokyo, Paris, and London."

**11.4** **Approach 2: Throw an exception** (last resort):

```typescript
handler: async (args: { city: string }) => {
  throw new Error(`City not found: ${args.city}`);
  // This triggers a tool.execution_error event
  // The model may not handle it as gracefully
},
```

**11.5** Compare the approaches:

| Aspect | Return `{ error }` | Throw exception |
|--------|-------------------|-----------------|
| Model behavior | Reads error, explains to user | May retry or give generic error |
| User experience | Helpful, contextual | May be confusing |
| Recovery | Model can try a different approach | Harder to recover from |
| When to use | Expected errors (invalid input) | Unexpected errors (bugs) |

### Key Concept

> 💡 **Return errors, don't throw them.** When your tool encounters an expected failure (unknown city, invalid input), return `{ error: "message" }`. The model reads this, understands the failure, and explains it helpfully to the user. Throwing exceptions should be reserved for genuine bugs in your handler code.

### ✅ Checkpoint
You understand both error approaches and know that returning `{ error }` objects gives the model the best chance to recover gracefully.

---

## Exercise 12: Build a Multi-Tool Travel Assistant

### Goal
Experience the full power of custom tools — 4 tools working together, orchestrated by the model, to create a comprehensive city guide.

### Steps

**12.1** Run the capstone:

```bash
npm run guide
```

**12.2** Observe the output — the model calls weather, population, timezone, and landmarks tools, then synthesizes everything into a formatted travel guide:

```
╔══════════════════════════════════════════════╗
║   🌍 City Guide — AI Travel Assistant        ║
║   4 tools: weather, population, time, sights ║
╚══════════════════════════════════════════════╝

(streaming travel guide with data from all 4 tools)

  📊 Tokens: 145 input + 287 output
```

**12.3** Open `city-guide.ts` and study the architecture:
- 4 separate data sources (weather, population, timezones, landmarks)
- 4 tool definitions, each focused on one data domain
- Model orchestrates all 4 to answer one comprehensive prompt
- Streaming + usage tracking from Levels 1-2

**12.4** Try changing the prompt to ask about a different city:

```typescript
prompt: "I'm planning a trip to Tokyo. Give me a complete overview..."
```

**12.5** Try asking about two cities:

```typescript
prompt: "Compare Paris and Tokyo for a vacation. Cover weather, population, and top sights."
```

Watch the model call 8 tool invocations (4 per city)!

**12.6** Reflect on what you've built:
- **Level 1**: Send a prompt, get a response
- **Level 2**: Stream the response in real time
- **Level 3**: The response is based on YOUR data, via YOUR tools

### Key Concept

> 💡 **Tools transform the SDK from a chatbot into a platform.** Without tools, the model can only answer from its training data. With tools, it can access your databases, APIs, files, and services — and weave the results into coherent, natural-language responses. This is the foundation of every real SDK application.

### ✅ Checkpoint
You ran a 4-tool travel assistant, saw the model orchestrate multiple tool calls, and understand how tools turn the SDK into an application platform.

---

## Self-Assessment

Rate yourself 1–3 on each skill:

| # | Skill | 1 | 2 | 3 |
|---|-------|---|---|---|
| 1 | I can define a tool with `defineTool()` and pass it to a session | ☐ | ☐ | ☐ |
| 2 | I can write JSON Schema parameters with types and required fields | ☐ | ☐ | ☐ |
| 3 | I can define tools with Zod schemas and explain the tradeoffs | ☐ | ☐ | ☐ |
| 4 | I can write a clear tool description that reliably triggers invocation | ☐ | ☐ | ☐ |
| 5 | I can access typed arguments in tool handlers | ☐ | ☐ | ☐ |
| 6 | I can return JSON-serializable data from handlers | ☐ | ☐ | ☐ |
| 7 | I can trace the 4-step tool invocation loop | ☐ | ☐ | ☐ |
| 8 | I can define multiple tools and let the model choose | ☐ | ☐ | ☐ |
| 9 | I can handle optional parameters with defaults | ☐ | ☐ | ☐ |
| 10 | I can write async handlers that call external services | ☐ | ☐ | ☐ |
| 11 | I can handle errors by returning `{ error }` objects | ☐ | ☐ | ☐ |
| 12 | I can build a multi-tool assistant with 4+ tools | ☐ | ☐ | ☐ |

**Scoring:**
```
1 = I need to revisit this
2 = I can do this with reference
3 = I can do this from memory

Score: __/36
  30+ (≥ 83%) → Proceed to Level 4 ✅
  24-29 (67-80%) → Review weak areas, then proceed
  < 24 (< 67%) → Repeat key exercises before continuing
```

---

## What's Next?

In **[Level 4: Interact](../level-4/README.md)**, you'll combine streaming and tools into real interactive applications. You'll learn **system messages** to shape the AI's personality, **`onUserInputRequest`** to let the agent ask YOU questions, and build a polished REPL chat assistant with conversation commands and signal handling.
