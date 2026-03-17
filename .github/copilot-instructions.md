# Copilot Instructions

This is a learning repository for the **GitHub Copilot SDK** (Technical Preview) — a multi-platform SDK for TypeScript, Python, Go, and .NET that lets you embed Copilot's agentic workflows into applications programmatically. It exposes the same engine behind Copilot CLI: a production-tested agent runtime you can invoke from your own code.

## Workshop

This repository contains an **8-level progressive workshop** in [`workshop/`](../workshop/README.md) with 96 exercises, 8 sample apps, and 8 cheat sheets. See the [workshop README](../workshop/README.md) for the full curriculum, self-assessment rubrics, and delivery formats.

## Learning Roadmap

Follow these levels in order. Each builds on the previous one.

### Level 1: First Contact — Send a message, get a response

**Goal**: Verify your setup works. Understand the client → session → send/receive flow.

Create a single file per language and run it. If you see `4` printed, you're ready.

**TypeScript** (`level1.ts`):
```typescript
import { CopilotClient, approveAll } from "@github/copilot-sdk";

const client = new CopilotClient();
const session = await client.createSession({ model: "gpt-4.1", onPermissionRequest: approveAll });
const response = await session.sendAndWait({ prompt: "What is 2 + 2?" });
console.log(response?.data.content);
await client.stop();
process.exit(0);
```
Run: `npx tsx level1.ts`

**Python** (`level1.py`):
```python
import asyncio
from copilot import CopilotClient, PermissionHandler

async def main():
    client = CopilotClient()
    await client.start()
    session = await client.create_session({"model": "gpt-4.1", "on_permission_request": PermissionHandler.approve_all})
    response = await session.send_and_wait({"prompt": "What is 2 + 2?"})
    print(response.data.content)
    await client.stop()

asyncio.run(main())
```
Run: `python level1.py`

**Go** (`level1.go`):
```go
package main

import (
    "context"
    "fmt"
    "log"
    "os"
    copilot "github.com/github/copilot-sdk/go"
)

func main() {
    ctx := context.Background()
    client := copilot.NewClient(nil)
    if err := client.Start(ctx); err != nil {
        log.Fatal(err)
    }
    defer client.Stop()

    session, err := client.CreateSession(ctx, &copilot.SessionConfig{Model: "gpt-4.1", OnPermissionRequest: copilot.ApproveAll})
    if err != nil {
        log.Fatal(err)
    }

    response, err := session.SendAndWait(ctx, copilot.MessageOptions{Prompt: "What is 2 + 2?"})
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println(*response.Data.Content)
    os.Exit(0)
}
```
Run: `go run level1.go`

**.NET** (`Program.cs`):
```csharp
using GitHub.Copilot.SDK;

await using var client = new CopilotClient();
await using var session = await client.CreateSessionAsync(new SessionConfig { Model = "gpt-4.1", OnPermissionRequest = PermissionHandlers.ApproveAll });
var response = await session.SendAndWaitAsync(new MessageOptions { Prompt = "What is 2 + 2?" });
Console.WriteLine(response?.Data.Content);
```
Run: `dotnet run`

### Level 2: Streaming — See responses arrive in real-time

**Goal**: Understand event subscription. Learn `assistant.message_delta` vs `assistant.message`.

**TypeScript** (`level2.ts`):
```typescript
import { CopilotClient, approveAll } from "@github/copilot-sdk";

const client = new CopilotClient();
const session = await client.createSession({ model: "gpt-4.1", streaming: true, onPermissionRequest: approveAll });

session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("session.idle", () => console.log());

await session.sendAndWait({ prompt: "Tell me a short joke" });
await client.stop();
process.exit(0);
```

**Python** (`level2.py`):
```python
import asyncio, sys
from copilot import CopilotClient, PermissionHandler
from copilot.generated.session_events import SessionEventType

async def main():
    client = CopilotClient()
    await client.start()
    session = await client.create_session({"model": "gpt-4.1", "streaming": True, "on_permission_request": PermissionHandler.approve_all})

    def handle(event):
        if event.type == SessionEventType.ASSISTANT_MESSAGE_DELTA:
            sys.stdout.write(event.data.delta_content)
            sys.stdout.flush()
        if event.type == SessionEventType.SESSION_IDLE:
            print()

    session.on(handle)
    await session.send_and_wait({"prompt": "Tell me a short joke"})
    await client.stop()

asyncio.run(main())
```

**Go** (`level2.go`):
```go
package main

import (
    "context"
    "fmt"
    "log"
    "os"
    copilot "github.com/github/copilot-sdk/go"
)

func main() {
    ctx := context.Background()
    client := copilot.NewClient(nil)
    if err := client.Start(ctx); err != nil {
        log.Fatal(err)
    }
    defer client.Stop()

    session, err := client.CreateSession(ctx, &copilot.SessionConfig{Model: "gpt-4.1", Streaming: true, OnPermissionRequest: copilot.ApproveAll})
    if err != nil {
        log.Fatal(err)
    }

    session.On(func(event copilot.SessionEvent) {
        if event.Type == "assistant.message_delta" && event.Data.DeltaContent != nil {
            fmt.Print(*event.Data.DeltaContent)
        }
        if event.Type == "session.idle" {
            fmt.Println()
        }
    })

    _, err = session.SendAndWait(ctx, copilot.MessageOptions{Prompt: "Tell me a short joke"})
    if err != nil {
        log.Fatal(err)
    }
    os.Exit(0)
}
```

### Level 3: Custom Tools — Let the model call YOUR code

**Goal**: Define a tool with parameters and a handler. Understand the tool invocation loop.

This is the core power of the SDK. The model decides *when* to call your tool based on its description.

**TypeScript** (`level3.ts`):
```typescript
import { CopilotClient, defineTool, approveAll } from "@github/copilot-sdk";

const getWeather = defineTool("get_weather", {
    description: "Get the current weather for a city",
    parameters: {
        type: "object",
        properties: { city: { type: "string", description: "The city name" } },
        required: ["city"],
    },
    handler: async (args: { city: string }) => {
        const temps: Record<string, number> = { "Tokyo": 24, "Seattle": 14, "London": 11 };
        return { city: args.city, temperature: `${temps[args.city] ?? 20}°C`, condition: "cloudy" };
    },
});

const client = new CopilotClient();
const session = await client.createSession({ model: "gpt-4.1", streaming: true, tools: [getWeather], onPermissionRequest: approveAll });
session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("session.idle", () => console.log());
await session.sendAndWait({ prompt: "What's the weather in Tokyo and London?" });
await client.stop();
process.exit(0);
```

**Python** (`level3.py`):
```python
import asyncio, sys
from copilot import CopilotClient, PermissionHandler
from copilot.tools import define_tool
from copilot.generated.session_events import SessionEventType
from pydantic import BaseModel, Field

class WeatherParams(BaseModel):
    city: str = Field(description="The city name")

@define_tool(description="Get the current weather for a city")
async def get_weather(params: WeatherParams) -> dict:
    temps = {"Tokyo": 24, "Seattle": 14, "London": 11}
    return {"city": params.city, "temperature": f"{temps.get(params.city, 20)}°C", "condition": "cloudy"}

async def main():
    client = CopilotClient()
    await client.start()
    session = await client.create_session({"model": "gpt-4.1", "streaming": True, "tools": [get_weather], "on_permission_request": PermissionHandler.approve_all})

    def handle(event):
        if event.type == SessionEventType.ASSISTANT_MESSAGE_DELTA:
            sys.stdout.write(event.data.delta_content)
            sys.stdout.flush()
        if event.type == SessionEventType.SESSION_IDLE:
            print()

    session.on(handle)
    await session.send_and_wait({"prompt": "What's the weather in Tokyo and London?"})
    await client.stop()

asyncio.run(main())
```

**Go** (`level3.go`):
```go
package main

import (
    "context"
    "fmt"
    "log"
    "os"
    copilot "github.com/github/copilot-sdk/go"
)

type WeatherParams struct {
    City string `json:"city" jsonschema:"The city name"`
}
type WeatherResult struct {
    City        string `json:"city"`
    Temperature string `json:"temperature"`
    Condition   string `json:"condition"`
}

func main() {
    ctx := context.Background()

    getWeather := copilot.DefineTool("get_weather", "Get the current weather for a city",
        func(params WeatherParams, inv copilot.ToolInvocation) (WeatherResult, error) {
            temps := map[string]int{"Tokyo": 24, "Seattle": 14, "London": 11}
            t, ok := temps[params.City]
            if !ok {
                t = 20
            }
            return WeatherResult{City: params.City, Temperature: fmt.Sprintf("%d°C", t), Condition: "cloudy"}, nil
        })

    client := copilot.NewClient(nil)
    if err := client.Start(ctx); err != nil {
        log.Fatal(err)
    }
    defer client.Stop()

    session, err := client.CreateSession(ctx, &copilot.SessionConfig{
        Model: "gpt-4.1", Streaming: true, Tools: []copilot.Tool{getWeather}, OnPermissionRequest: copilot.ApproveAll,
    })
    if err != nil {
        log.Fatal(err)
    }

    session.On(func(event copilot.SessionEvent) {
        if event.Type == "assistant.message_delta" && event.Data.DeltaContent != nil {
            fmt.Print(*event.Data.DeltaContent)
        }
        if event.Type == "session.idle" {
            fmt.Println()
        }
    })

    _, err = session.SendAndWait(ctx, copilot.MessageOptions{Prompt: "What's the weather in Tokyo and London?"})
    if err != nil {
        log.Fatal(err)
    }
    os.Exit(0)
}
```

### Level 4: Hooks — Intercept and control the agent loop

**Goal**: Understand the hook system. Add logging, permission control, and context injection.

See the [Session Hooks](#session-hooks) section below for details.

### Level 5: MCP Servers — Connect external tool ecosystems

**Goal**: Integrate a pre-built MCP server. Understand local vs remote transport.

See the [MCP Servers](#mcp-servers-model-context-protocol) section below.

### Level 6: Combine Everything — Build a real application

**Goal**: Build an interactive assistant that combines tools + hooks + MCP + streaming + session persistence.

Recommended project ideas (see [Project Ideas](#recommended-project-ideas) at the bottom).

---

## Architecture

```
Your Application → SDK Client → (JSON-RPC) → Copilot CLI (server mode)
```

- The SDK spawns and manages the Copilot CLI as a subprocess automatically (stdio mode, the default).
- Alternatively, run the CLI externally with `copilot --headless --port <port>` and connect via `cliUrl` option — useful for debugging, resource sharing, or running multiple SDK clients against one CLI.
- All four language SDKs share the same JSON-RPC protocol, so capabilities are identical across languages.

### Core Concepts

| Concept | What it does |
|---------|-------------|
| **CopilotClient** | Manages connection to CLI process. Always call `stop()` when done. Options: `logLevel`, `cliPath`, `cliUrl`, `githubToken`, `useLoggedInUser`. |
| **Session** | Created from a client with a model + config. Holds conversation state. Supports streaming, tools, hooks, MCP servers, custom agents, and skills. Use `session.setModel()` to switch models mid-session. |
| **Custom Tools** | Functions the model can call. Defined with `defineTool()` (TS) / `@define_tool` (Python) / `DefineTool()` (Go) / `AIFunctionFactory.Create()` (.NET). Each has a name, description, JSON schema params, and handler. |
| **Events** | Subscribe with `session.on(handler)`. Key events: `assistant.message_delta` (streaming token), `assistant.message` (complete response), `session.idle` (done), `assistant.usage` (token counts), `tool.execution_error`. |
| **Hooks** | Intercept session lifecycle: `onPreToolUse`, `onPostToolUse`, `onUserPromptSubmitted`, `onSessionStart`, `onSessionEnd`, `onErrorOccurred`. |
| **MCP Servers** | External tool providers (local stdio or remote HTTP). Configured via `mcpServers` in session config. |
| **Custom Agents** | Specialized AI personas defined with a name, description, and system prompt. |
| **Skills** | Reusable directories containing prompts, tools, and config loaded via `skillDirectories`. |

---

## SDK Quick Reference by Language

### Node.js / TypeScript

```bash
# Project setup
mkdir my-app && cd my-app
npm init -y --init-type module
npm install @github/copilot-sdk tsx

# Run
npx tsx index.ts
```

```typescript
import { CopilotClient, defineTool, approveAll } from "@github/copilot-sdk";

// Basic usage
const client = new CopilotClient();
const session = await client.createSession({ model: "gpt-4.1", streaming: true, onPermissionRequest: approveAll });
session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
await session.sendAndWait({ prompt: "Hello" });
await client.stop();
process.exit(0);
```

**Tool definition pattern:**
```typescript
const myTool = defineTool("tool_name", {
    description: "What the tool does",
    parameters: {
        type: "object",
        properties: { arg1: { type: "string", description: "..." } },
        required: ["arg1"],
    },
    handler: async (args: { arg1: string }) => {
        return { result: "value" }; // Must be JSON-serializable
    },
});
// Pass to session: createSession({ tools: [myTool], onPermissionRequest: approveAll })
```

### Python

```bash
pip install github-copilot-sdk
python main.py
```

```python
import asyncio
from copilot import CopilotClient, PermissionHandler
from copilot.tools import define_tool
from copilot.generated.session_events import SessionEventType
from pydantic import BaseModel, Field

# Tool parameters use Pydantic models
class MyParams(BaseModel):
    city: str = Field(description="City name")

@define_tool(description="What the tool does")
async def my_tool(params: MyParams) -> dict:
    return {"result": "value"}

async def main():
    client = CopilotClient()
    await client.start()
    session = await client.create_session({
        "model": "gpt-4.1",
        "streaming": True,
        "tools": [my_tool],
        "on_permission_request": PermissionHandler.approve_all,
    })
    # Event handler
    def handle(event):
        if event.type == SessionEventType.ASSISTANT_MESSAGE_DELTA:
            sys.stdout.write(event.data.delta_content)
            sys.stdout.flush()
    session.on(handle)
    await session.send_and_wait({"prompt": "Hello"})
    await client.stop()

asyncio.run(main())
```

### Go

```bash
mkdir my-app && cd my-app
go mod init my-app
go get github.com/github/copilot-sdk/go
go run main.go
```

```go
import copilot "github.com/github/copilot-sdk/go"

// Tool params use struct types with json + jsonschema tags
type MyParams struct {
    City string `json:"city" jsonschema:"The city name"`
}

// Define tool
myTool := copilot.DefineTool("tool_name", "What the tool does",
    func(params MyParams, inv copilot.ToolInvocation) (MyResult, error) {
        return MyResult{Data: "value"}, nil
    },
)
// Pass to session: CreateSession(ctx, &copilot.SessionConfig{Tools: []copilot.Tool{myTool}, OnPermissionRequest: copilot.ApproveAll})
```

### .NET

```bash
dotnet new console -n MyApp && cd MyApp
dotnet add package GitHub.Copilot.SDK
dotnet run
```

```csharp
using GitHub.Copilot.SDK;
using Microsoft.Extensions.AI;
using System.ComponentModel;

// Tool definition uses AIFunctionFactory with [Description] attributes
var myTool = AIFunctionFactory.Create(
    ([Description("City name")] string city) => new { result = "value" },
    "tool_name", "What the tool does"
);

// Sessions support await using for automatic disposal
await using var client = new CopilotClient();
await using var session = await client.CreateSessionAsync(new SessionConfig {
    Model = "gpt-4.1", Streaming = true, Tools = [myTool], OnPermissionRequest = PermissionHandlers.ApproveAll
});
```

---

## Authentication

The SDK supports multiple auth methods, checked in this priority order:

1. **Explicit `githubToken`** passed to client constructor
2. **Environment variables**: `COPILOT_GITHUB_TOKEN` → `GH_TOKEN` → `GITHUB_TOKEN`
3. **Stored OAuth credentials** from `copilot auth login`
4. **`gh auth` credentials** from GitHub CLI

### BYOK (Bring Your Own Key)

Use your own API keys — no GitHub Copilot subscription needed. Configure `provider` in session config:

```typescript
const session = await client.createSession({
    model: "gpt-4",
    onPermissionRequest: approveAll,
    provider: {
        type: "openai",           // "openai" | "azure" | "anthropic"
        baseUrl: "https://api.openai.com/v1",
        apiKey: process.env.OPENAI_API_KEY,
        wireApi: "completions",   // "completions" (default) or "responses" (GPT-5 series)
    },
});
```

**Supported providers:**

| Provider | `type` value | `baseUrl` example |
|----------|-------------|-------------------|
| OpenAI | `"openai"` | `https://api.openai.com/v1` |
| Azure OpenAI (native) | `"azure"` | `https://my-resource.openai.azure.com` (host only, no `/openai/v1`) |
| Azure AI Foundry | `"openai"` | `https://your-resource.openai.azure.com/openai/v1/` |
| Anthropic | `"anthropic"` | `https://api.anthropic.com` |
| Ollama (local) | `"openai"` | `http://localhost:11434/v1` (no apiKey needed) |

**Key gotcha**: For native Azure endpoints (`*.openai.azure.com`), use `type: "azure"` with just the host. For Azure AI Foundry with `/openai/v1/` path, use `type: "openai"`.

**Limitations**: BYOK supports static API keys/bearer tokens only. No Microsoft Entra ID, no managed identities, no token refresh callbacks.

---

## Session Hooks

Hooks intercept and customize behavior at key points. All hooks receive `(input, invocation)` and return an output object or `null`.

### onPreToolUse — Before tool execution

Control whether tools run, modify their arguments, or add context:

```typescript
hooks: {
    onPreToolUse: async (input) => {
        // input.toolName, input.toolArgs
        // Return: { permissionDecision: "allow" | "deny" | "ask" }
        //         { modifiedArgs: {...} }
        //         { additionalContext: "..." }
        //         { suppressOutput: true }

        // Example: block dangerous tools
        if (["shell", "bash"].includes(input.toolName)) {
            return { permissionDecision: "deny", permissionDecisionReason: "Shell access blocked" };
        }
        return { permissionDecision: "allow" };
    },
}
```

### onPostToolUse — After tool execution

Transform results, redact sensitive data, or log for auditing:

```typescript
hooks: {
    onPostToolUse: async (input) => {
        // input.toolName, input.toolArgs, input.toolResult
        // Return: { modifiedResult: {...} }
        //         { additionalContext: "..." }
        //         { suppressOutput: true }
        //         null (no changes)
        return null;
    },
}
```

### onUserPromptSubmitted — When user sends a message

Modify prompts, add context, implement shorthand commands, or filter content:

```typescript
hooks: {
    onUserPromptSubmitted: async (input) => {
        // input.prompt
        // Return: { modifiedPrompt: "..." }
        //         { additionalContext: "..." }
        //         null (no changes)

        // Example: expand shortcuts
        if (input.prompt.startsWith("/fix")) {
            return { modifiedPrompt: "Fix the errors in the code: " + input.prompt.slice(4) };
        }
        return null;
    },
}
```

### onSessionStart / onSessionEnd — Lifecycle hooks

```typescript
hooks: {
    onSessionStart: async (input) => {
        // input.source: "startup" | "resume" | "new"
        // Return: { additionalContext: "Project uses React + TypeScript" }
        return null;
    },
    onSessionEnd: async (input) => {
        // input.reason: "complete" | "error" | "abort" | "timeout" | "user_exit"
        // Use for cleanup, metrics, saving state
        return null;
    },
}
```

### onErrorOccurred — Custom error handling

Handle errors from tool execution, model calls, or session operations:

```typescript
hooks: {
    onErrorOccurred: async (input) => {
        // input.error (string), input.errorContext ("model_call" | "tool_execution" | "system" | "user_input")
        // input.recoverable (boolean)
        // Return: { errorHandling: "retry" | "skip" | "abort" }
        //         { retryCount: 3 }
        //         { userNotification: "Friendly message" }
        //         { suppressOutput: true }

        if (input.errorContext === "model_call" && input.error.includes("rate")) {
            return { errorHandling: "retry", retryCount: 3, userNotification: "Rate limit hit. Retrying..." };
        }
        return null; // use default handling
    },
}
```

---

## Advanced Features

### System Message Customization

Control the AI's behavior by appending to or replacing the system prompt:

```typescript
// Append additional instructions (default mode — keeps all SDK guardrails)
const session = await client.createSession({
    model: "gpt-4.1",
    onPermissionRequest: approveAll,
    systemMessage: {
        content: "You are a helpful assistant for our engineering team. Always be concise. Respond in Japanese when asked.",
    },
});

// Full replacement (removes all guardrails — use with care)
const session = await client.createSession({
    model: "gpt-4.1",
    onPermissionRequest: approveAll,
    systemMessage: {
        mode: "replace",
        content: "You are a helpful assistant.",
    },
});
```

### User Input Requests — Let the agent ask YOU questions

Enable the `ask_user` tool so the agent can interactively ask for clarification:

```typescript
// TypeScript
const session = await client.createSession({
    model: "gpt-4.1",
    onPermissionRequest: approveAll,
    onUserInputRequest: async (request, invocation) => {
        // request.question, request.choices (optional), request.allowFreeform
        console.log(`Agent asks: ${request.question}`);
        const answer = await getUserInput(); // your UI logic
        return { answer, wasFreeform: true };
    },
});
```

```python
# Python
async def handle_user_input(request, invocation):
    print(f"Agent asks: {request['question']}")
    answer = input("> ")
    return {"answer": answer, "wasFreeform": True}

session = await client.create_session({
    "model": "gpt-4.1",
    "on_permission_request": PermissionHandler.approve_all,
    "on_user_input_request": handle_user_input,
})
```

### Session Persistence — Pause and resume conversations

Sessions are automatically persisted to `~/.copilot/session-state/{sessionId}/`. To resume later, provide a stable `sessionId`:

```typescript
// Create with a meaningful ID
const session = await client.createSession({
    sessionId: "user-alice-code-review-42",
    model: "gpt-4.1",
    onPermissionRequest: approveAll,
});
await session.sendAndWait({ prompt: "Analyze my codebase" });
// ... later, even after restart ...
const resumed = await client.resumeSession("user-alice-code-review-42");
await resumed.sendAndWait({ prompt: "What did we discuss?" });
```

**Session ID best practices**: Use structured IDs like `{userId}-{task}-{timestamp}` for easy auditing, cleanup, and access control.

**What persists**: conversation history, tool results, agent plan, session artifacts. **What doesn't**: API keys (must re-provide for BYOK), in-memory tool state.

### Infinite Sessions — Automatic context management

For long conversations that might exceed context limits, infinite sessions automatically compact older context:

```typescript
const session = await client.createSession({
    model: "gpt-4.1",
    onPermissionRequest: approveAll,
    infiniteSessions: {
        enabled: true,
        backgroundCompactionThreshold: 0.80,  // start compacting at 80% context use
        bufferExhaustionThreshold: 0.95,       // block at 95% until compaction completes
    },
});
// The session workspace is at session.workspacePath
// Contains: checkpoints/, plan.md, files/
```

### Image Attachments

Send images for the model to analyze:

```typescript
await session.send({
    prompt: "What's in this image?",
    attachments: [{ type: "file", path: "/path/to/image.jpg" }],
});
```

### Multiple Sessions

Run independent conversations in parallel:

```typescript
const session1 = await client.createSession({ model: "gpt-4.1", onPermissionRequest: approveAll });
const session2 = await client.createSession({ model: "claude-sonnet-4.5", onPermissionRequest: approveAll });
await Promise.all([
    session1.sendAndWait({ prompt: "Hello from session 1" }),
    session2.sendAndWait({ prompt: "Hello from session 2" }),
]);
```

### Reasoning Events

Some models emit reasoning/chain-of-thought tokens. Subscribe to them alongside message deltas:

```typescript
session.on("assistant.reasoning_delta", (e) => {
    process.stdout.write(e.data.deltaContent); // streaming reasoning
});
session.on("assistant.reasoning", (e) => {
    console.log("Final reasoning:", e.data.content); // complete reasoning
});
```

### Switching Models Mid-Session

Change the model used by a session without creating a new one:

```typescript
// TypeScript
await session.setModel("gpt-5");
```

```python
# Python
await session.set_model("gpt-5")
```

```go
// Go
err := session.SetModel(ctx, "gpt-5")
```

```csharp
// .NET
await session.SetModelAsync("gpt-5");
```

### Go: Embedded CLI Distribution

The Go SDK uniquely supports bundling the Copilot CLI binary inside your application:

```bash
go get -tool github.com/github/copilot-sdk/go/cmd/bundler
go tool bundler   # downloads CLI for your platform
go build          # CLI is embedded via go:embed
```

Users of your Go binary won't need to install the CLI separately.

---

## Gotchas and Pitfalls

### All Languages
- **`onPermissionRequest` is mandatory** — Since v0.1.28, session creation fails without a permission handler. Use `approveAll` (TS), `PermissionHandler.approve_all` (Python), `copilot.ApproveAll` (Go), or `PermissionHandlers.ApproveAll` (.NET) for development. Implement granular handlers for production.
- **Always call `client.stop()`** — Failing to do so leaves the CLI process orphaned.
- **`model` is required with BYOK** — The SDK throws an error if you use a `provider` without specifying `model`.
- **Azure `type` confusion** — For `*.openai.azure.com` native endpoints, use `type: "azure"` (NOT `"openai"`). For Azure AI Foundry `/openai/v1/` endpoints, use `type: "openai"`.
- **Tool `description` matters** — The model uses it to decide *when* to call your tool. A vague description = tool rarely called.
- **Tool handlers must return JSON-serializable data** — No circular references, no class instances.
- **`sendAndWait` vs `send`** — `sendAndWait` blocks until `session.idle`. Use `send` + event listeners if you need more control.
- **MCP `tools: ["*"]` is opt-in** — If you forget to set `tools`, no MCP tools will be available.

### TypeScript-Specific
- **Zod schemas are supported** — `defineTool` accepts Zod objects as `parameters` for type-safe tool definitions: `parameters: z.object({ id: z.string().describe("...") })`.
- **Call `process.exit(0)` explicitly** — The Node.js event loop may hang if you don't exit after `client.stop()`.
- **Typed event handlers** — `session.on("assistant.message", handler)` gives full TypeScript type inference on `event.data`.

### Python-Specific
- **Python is fully async** — All SDK methods are `async`. Always use `asyncio.run(main())`.
- **Pydantic models for tool params** — Define params as `BaseModel` subclass with `Field(description="...")`.
- **`from __future__ import annotations` gotcha** — If you use this import, define Pydantic models at module level (not inside functions), or schema generation fails.
- **Low-level tool API exists** — If you prefer manual JSON schema, use `Tool(name=..., parameters={...}, handler=...)` directly.
- **Event type comparison** — Use `event.type == SessionEventType.ASSISTANT_MESSAGE_DELTA` (enum) or `event.type.value == "assistant.message_delta"` (string).

### Go-Specific
- **Pointer fields for optional booleans** — Use `copilot.Bool(false)` helper for `AutoStart`, `AutoRestart`, `UseLoggedInUser`.
- **Nil-check `DeltaContent` and `Content`** — These are `*string` pointers. Always check `!= nil` before dereferencing.
- **`jsonschema` struct tag for tool params** — Use `jsonschema:"description text"` (not `json`) to provide parameter descriptions.
- **Channels for completion** — Use `done := make(chan bool)` + `close(done)` pattern with `session.On` for waiting.

### .NET-Specific
- **`await using`** — Use it for both `CopilotClient` and sessions for automatic cleanup.
- **`AIFunctionFactory.Create()`** — Tools are defined using `Microsoft.Extensions.AI`. Add `[Description]` attributes to parameters.
- **Pattern matching for events** — Use `if (ev is AssistantMessageDeltaEvent deltaEvent)` for type-safe event handling.
- **ILogger integration** — Pass a `LoggerFactory`-created logger to `CopilotClientOptions` for structured logging.

---

## Recommended Project Ideas

Build these to practice, progressing from simple to complex:

1. **CLI Chat Bot** — Interactive REPL that streams responses. (Level 2)
2. **Weather Assistant** — Custom tool that calls a real weather API. (Level 3)
3. **Code Review Agent** — Uses hooks to log all tool calls, custom agent persona focused on security review, and the GitHub MCP server to read PRs. (Level 4-5)
4. **Multi-Language Quiz Generator** — Creates programming quizzes. Uses `onUserInputRequest` to ask the user quiz questions interactively. (Level 4)
5. **Documentation Assistant** — Loads skill directories with project-specific context, uses `onSessionStart` to inject project metadata, connects to filesystem MCP server. (Level 5)
6. **PR Summary Bot** — Combines session persistence (resume across runs), GitHub MCP server, custom tools for formatting, and hooks for rate limiting. Deploy as a scheduled job. (Level 6)
7. **Local AI Playground** — BYOK with Ollama for a fully offline, private assistant. Compare responses across different local models using multiple sessions. (Level 6)

---

## My Recommendations

**Start with TypeScript** — It has the richest developer experience: typed event handlers, Zod schema support, and the fastest feedback loop with `npx tsx`. The official getting-started tutorial is TypeScript-first.

**Install Copilot CLI first** — Everything depends on it. Run `copilot --version` to verify, then `copilot auth login`. All four SDKs talk to the same CLI process, so this is a one-time setup.

**Use `logLevel: "debug"` liberally while learning** — It shows the full JSON-RPC traffic between SDK and CLI. You'll understand *exactly* what happens when a tool is called, an event fires, or an error occurs.

**Master tools before hooks** — Tools are the SDK's killer feature. Hooks are powerful but secondary. Get comfortable with the tool invocation loop first.

**Try BYOK with Ollama early** — Install Ollama, pull a model (`ollama pull llama3`), and point the SDK at `http://localhost:11434/v1`. This gives you unlimited free experimentation with no API costs. Great for testing tool definitions rapidly.

**Read the upstream SDK READMEs** — Each language's README (linked below) is a full API reference. This file is a learning guide; the READMEs are the authoritative spec.

**Explore the `samples/` directories** — The official SDK repo has runnable samples in `nodejs/samples/`, `python/samples/`, `go/samples/`, and `dotnet/samples/`. Clone the repo and try them.

---

## MCP Servers (Model Context Protocol)

Extend Copilot with external tools via MCP. Two transport types:

### Local (stdio) — spawns a subprocess

```typescript
mcpServers: {
    "filesystem": {
        type: "local",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
        tools: ["*"],       // "*" = all, [] = none, or list specific tool names
        timeout: 30000,
        env: { DEBUG: "true" },
        cwd: "./servers",
    },
}
```

### Remote (HTTP/SSE) — connects to a running server

```typescript
mcpServers: {
    "github": {
        type: "http",
        url: "https://api.githubcopilot.com/mcp/",
        headers: { "Authorization": "Bearer ${TOKEN}" },
        tools: ["*"],
    },
}
```

**Popular MCP servers**: `@modelcontextprotocol/server-filesystem`, `@modelcontextprotocol/server-github`, `@modelcontextprotocol/server-sqlite`, `@modelcontextprotocol/server-puppeteer`. Browse more at [MCP Servers Directory](https://github.com/modelcontextprotocol/servers).

---

## Custom Agents

Define specialized AI personas with their own system prompts:

```typescript
const session = await client.createSession({
    onPermissionRequest: approveAll,
    customAgents: [{
        name: "pr-reviewer",
        displayName: "PR Reviewer",
        description: "Reviews pull requests for best practices",
        prompt: "You are an expert code reviewer. Focus on security, performance, and maintainability.",
    }],
});
```

---

## Custom Skills

Skills are reusable directories of prompts, tools, and configuration:

```typescript
const session = await client.createSession({
    onPermissionRequest: approveAll,
    skillDirectories: ["./skills/code-review", "./skills/documentation"],
    disabledSkills: ["experimental-feature"],  // selectively disable
});
```

**Skill directory structure:**
```
skills/code-review/
├── skill.json          # { "name": "code-review", "prompts": [...], "tools": [...] }
├── prompts/
│   └── system.md       # System prompt additions (markdown)
└── tools/
    └── lint.json       # Tool definitions
```

---

## Session Configuration Reference

Key `createSession()` / `create_session()` options:

| Option | Type | Description |
|--------|------|-------------|
| `onPermissionRequest` | handler | **Required.** Permission handler for tool execution approval. Use `approveAll` for development. |
| `model` | string | Model name (e.g., `"gpt-4.1"`, `"gpt-5"`) |
| `streaming` | boolean | Enable token-by-token streaming |
| `tools` | Tool[] | Custom tool definitions |
| `mcpServers` | object | MCP server configurations |
| `hooks` | object | Session hooks (pre/post tool, lifecycle, etc.) |
| `customAgents` | object[] | Agent personas with name/description/prompt |
| `agent` | string | Pre-select a custom agent at session start |
| `skillDirectories` | string[] | Paths to skill directories |
| `disabledSkills` | string[] | Skills to disable |
| `systemMessage` | object | Custom system message (`{ content: "..." }`) |
| `provider` | object | BYOK provider configuration |
| `clientName` | string | Optional identifier for the client application |
| `infiniteSessions` | object | Auto-compaction config (`{ enabled: true, backgroundCompactionThreshold: 0.80, bufferExhaustionThreshold: 0.95 }`) |
| `reasoningEffort` | string | For models that support reasoning effort control |
| `availableTools` | string[] | Whitelist specific built-in tools |
| `excludedTools` | string[] | Blacklist specific built-in tools |

---

## Debugging

Enable debug logging to see JSON-RPC traffic and internal state:

```typescript
// Node.js
const client = new CopilotClient({ logLevel: "debug" });

// Python
client = CopilotClient({"log_level": "debug"})

// Go
client := copilot.NewClient(&copilot.ClientOptions{LogLevel: "debug"})

// .NET — also supports ILogger integration
var client = new CopilotClient(new CopilotClientOptions { LogLevel = "debug" });
```

**Common issues:**
- `"CLI not found"` → Install CLI or set `cliPath` to full path
- `"Not authenticated"` → Run `copilot auth login` or provide `githubToken`
- `"Connection refused"` → CLI crashed; check `copilot --server --stdio` standalone
- Tool not called → Verify JSON schema is valid and `description` clearly explains when to use it
- MCP tools not appearing → Check `tools: ["*"]` is set, verify server starts with `echo '{"jsonrpc":"2.0","id":1,"method":"initialize",...}' | your-server`

Track token usage programmatically:
```typescript
session.on("assistant.usage", (event) => {
    console.log(`Tokens — input: ${event.data.inputTokens}, output: ${event.data.outputTokens}`);
});
```

---

## Prerequisites

- **Copilot CLI** installed and in PATH (`copilot --version`)
- **GitHub Copilot subscription** (free tier available) or BYOK configuration
- Language runtime: Node.js 20+ / Python 3.8+ / Go 1.21+ / .NET 8.0+

## Conventions for This Repo

- When adding examples, include implementations in **all four languages** (TypeScript, Python, Go, .NET) where feasible, matching the upstream SDK documentation style.
- Each example should be **self-contained and runnable** as a standalone file.
- Use `gpt-4.1` as the default model in examples (matches the official getting-started guide).
- Always call `client.stop()` (or equivalent) and handle process exit explicitly.
- For streaming, use `process.stdout.write()` / `sys.stdout.write()` (not `println`) for delta content to avoid extra newlines.
- Python examples use `asyncio.run(main())` pattern with `async def main()`.
- Go examples use `context.Background()` and `defer client.Stop()`.
- .NET examples use `await using` for automatic resource disposal.

## Freshness & Update Workflow

The Copilot SDK and CLI are in **Technical Preview** with frequent releases. When asked to check for updates or refresh content, follow this workflow:

### Step 1: Check Upstream for Changes

Consult these sources (in priority order):

1. **SDK releases**: https://github.com/github/copilot-sdk/releases — version numbers, breaking changes
2. **SDK repo README**: https://github.com/github/copilot-sdk — package names, install commands, FAQ
3. **Language READMEs**: `nodejs/README.md`, `python/README.md`, `go/README.md`, `dotnet/README.md` — API changes
4. **SDK docs**: https://github.com/github/copilot-sdk/tree/main/docs — auth, BYOK, hooks, MCP, skills
5. **CLI docs**: https://docs.github.com/en/copilot/how-tos/copilot-cli — permissions, configuration
6. **GitHub Changelog**: https://github.blog/changelog/ — announcements
7. **GitHub Blog**: https://github.blog/ — deep-dive posts

### Step 2: Identify What Changed

Look specifically for:
- **Package name/install command changes** (this has happened before: `@github/copilot-cli-sdk` → `@github/copilot-sdk`)
- **New or changed API methods** (session config options, event types, hook fields, tool patterns)
- **New features** that need new exercises or guide chapters
- **Default behavior changes** (permission model, infinite sessions, compaction)
- **Deprecations** (APIs being removed or renamed)

### Step 3: Update Content

Update these files as needed, maintaining consistency across all of them:

| File | What to update |
|------|---------------|
| `GUIDE.md` | Factual claims, code examples, architecture explanations, gotchas |
| `workshop/level-*/README.md` | Exercise steps, code snippets, expected outputs |
| `workshop/level-*/CHEATSHEET.md` | API tables, event lists, quick-reference code |
| `workshop/level-*/sample-app/*.ts` | Import paths, API calls, type annotations |
| `workshop/level-*/sample-app/package.json` | Package names, versions |
| `.github/copilot-instructions.md` | This file — SDK reference, learning roadmap, code examples |
| `README.md` | Prerequisites, install commands |

### Step 4: Verify Consistency

- All package names match current upstream
- All code examples use current API signatures
- All event type names match current SDK
- Cross-language notes in GUIDE.md are still accurate
- Workshop exercises reference correct sample-app filenames
- Sample apps' `npm install` succeeds
- No broken links

## Key Resources

**SDK Repo & Per-Language API References:**
- [Copilot SDK repo](https://github.com/github/copilot-sdk) — Source code and docs
- [Node.js/TypeScript SDK README](https://github.com/github/copilot-sdk/blob/main/nodejs/README.md) — Full API reference, all options
- [Python SDK README](https://github.com/github/copilot-sdk/blob/main/python/README.md) — Full API reference, Pydantic tool patterns
- [Go SDK README](https://github.com/github/copilot-sdk/blob/main/go/README.md) — Full API reference, embedded CLI bundler
- [.NET SDK README](https://github.com/github/copilot-sdk/blob/main/dotnet/README.md) — Full API reference, AIFunctionFactory patterns

**Guides:**
- [Getting Started Guide](https://github.com/github/copilot-sdk/blob/main/docs/getting-started.md) — Step-by-step tutorial (basic → streaming → tools → interactive)
- [Authentication docs](https://github.com/github/copilot-sdk/blob/main/docs/auth/index.md) — OAuth, env vars, BYOK
- [BYOK docs](https://github.com/github/copilot-sdk/blob/main/docs/auth/byok.md) — Provider configs for OpenAI, Azure, Anthropic, Ollama
- [Hooks docs](https://github.com/github/copilot-sdk/blob/main/docs/hooks/overview.md) — Pre/post tool use, prompt, lifecycle, error handling
- [MCP docs](https://github.com/github/copilot-sdk/blob/main/docs/mcp/overview.md) — Local and remote MCP server integration
- [Skills docs](https://github.com/github/copilot-sdk/blob/main/docs/guides/skills.md) — Reusable skill directories
- [Session Persistence docs](https://github.com/github/copilot-sdk/blob/main/docs/guides/session-persistence.md) — Resume, lifecycle, deployment patterns
- [Debugging docs](https://github.com/github/copilot-sdk/blob/main/docs/debugging.md) — Common issues and troubleshooting
- [SDK/CLI compatibility](https://github.com/github/copilot-sdk/blob/main/docs/compatibility.md) — What's available in SDK vs CLI-only

**Community & Examples:**
- [Cookbook](https://github.com/github/awesome-copilot/blob/main/cookbook/copilot-sdk) — Practical recipes across all languages
- [Copilot CLI installation](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli)
- [MCP Servers Directory](https://github.com/modelcontextprotocol/servers) — Community MCP servers to integrate
