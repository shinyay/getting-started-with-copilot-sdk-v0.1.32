# Level 6: Context — MCP Servers, Custom Agents & Skills

> **Risk level:** 🟠 High — MCP servers can access your filesystem, network, and databases. Only grant access to directories you intend to share. Use tool filtering to limit what operations the model can perform.

## Learning Objectives

By the end of this level, you will be able to:

1. Explain the MCP architecture and the difference between local and remote transports
2. Configure a local MCP server that spawns as a subprocess (stdio)
3. Enable MCP tools in a session with the `tools` opt-in pattern
4. Filter MCP tools to expose only safe operations (read-only access)
5. Configure MCP server options: timeout, environment variables, working directory
6. Configure a remote MCP server connection (HTTP/SSE with authentication)
7. Define custom agents with specialized personas and system prompts
8. Load reusable skill directories with prompts and tool definitions
9. Control built-in tool access with `availableTools` and `excludedTools`
10. Combine MCP tools and custom `defineTool` tools in a single session
11. Connect multiple MCP servers simultaneously
12. Build a documentation assistant combining MCP, agents, skills, and hooks

---

## Prerequisites

- [ ] **Level 5 completed** (you can use all 6 hook types for lifecycle control)
- [ ] Node.js 20+, Copilot CLI installed and authenticated
- [ ] `npx` available (comes with npm — needed to spawn MCP servers)
- [ ] This repository cloned locally

---

## Workshop Structure

This level contains **12 exercises**. Estimated time: **75–100 minutes**.

| Exercise | Topic | Time |
|----------|-------|------|
| 1 | Understand MCP Architecture | 5 min |
| 2 | Configure a Local MCP Server | 7 min |
| 3 | Use MCP Tools in a Session | 7 min |
| 4 | MCP Tool Filtering | 5 min |
| 5 | MCP Server Options | 5 min |
| 6 | Connect to a Remote MCP Server | 7 min |
| 7 | Define Custom Agents | 7 min |
| 8 | Skill Directories | 7 min |
| 9 | Available and Excluded Tools | 5 min |
| 10 | Combine MCP + Custom Tools | 7 min |
| 11 | Multiple MCP Servers | 7 min |
| 12 | Capstone: Documentation Assistant | 10 min |

---

## Exercise 1: Understand MCP Architecture

### Goal
Learn what MCP (Model Context Protocol) is and the two transport types before writing any code.

### Steps

**1.1** MCP is a protocol that connects the SDK to **external tool providers**. Instead of defining tools with `defineTool` (Level 3), MCP servers provide tools from outside your application.

**1.2** The architecture:

```
┌──────────────────────────────────┐
│  Your Application                │
│  └── SDK Session                 │
│       ├── Custom Tools           │  (defineTool — your code)
│       └── MCP Server(s)          │  (external tool providers)
│            ├── Local (stdio)     │  SDK spawns as subprocess
│            └── Remote (HTTP/SSE) │  Connect to running server
└──────────────────────────────────┘
```

**1.3** Two transport types:

| Type | Config Key | How It Works | Lifecycle |
|------|-----------|-------------|-----------|
| **Local** (stdio) | `command`, `args` | SDK spawns a subprocess | SDK manages start/stop |
| **Remote** (HTTP/SSE) | `url`, `headers` | Connect to already-running server | External lifecycle |

**1.4** Popular MCP servers:

| Server | Package | What It Provides |
|--------|---------|-----------------|
| Filesystem | `@modelcontextprotocol/server-filesystem` | Read/write files |
| GitHub | `@modelcontextprotocol/server-github` | GitHub API access |
| SQLite | `@modelcontextprotocol/server-sqlite` | Database queries |
| Puppeteer | `@modelcontextprotocol/server-puppeteer` | Browser automation |

Browse more at [MCP Servers Directory](https://github.com/modelcontextprotocol/servers).

### Key Concept

> 💡 **MCP extends the SDK with external tools.** Custom tools (`defineTool`) are functions YOU write. MCP tools are provided by external servers — filesystem access, database queries, GitHub API, browser automation. MCP lets you connect to an ecosystem of pre-built tool providers without writing handler code.

### ✅ Checkpoint
You can explain MCP in one sentence: "MCP connects the SDK to external tool providers via local subprocess or remote HTTP."

---

## Exercise 2: Configure a Local MCP Server

### Goal
Connect the filesystem MCP server so the model can read documentation files.

### Steps

**2.1** Navigate to the sample app and install dependencies:

```bash
cd workshop/level-6/sample-app
npm install
```

**2.2** Run the local MCP demo:

```bash
npm run mcp
```

> Note: The first run downloads `@modelcontextprotocol/server-filesystem` via npx. This may take a moment.

**2.3** Observe: the model reads files from `./sample-docs/` and summarizes them.

**2.4** Open `mcp-local.ts` and study the configuration:

```typescript
import { CopilotClient, approveAll } from "@github/copilot-sdk";

const session = await client.createSession({
  model: "gpt-4.1",
  onPermissionRequest: approveAll,
  mcpServers: {
    filesystem: {                    // Name (your choice)
      type: "local",                 // Spawned as subprocess
      command: "npx",                // Command to run
      args: ["-y", "@modelcontextprotocol/server-filesystem", docsPath],
      tools: ["*"],                  // Enable ALL tools from this server
    },
  },
});
```

**2.5** What each field means:

| Field | Purpose | Example |
|-------|---------|---------|
| `type` | Transport type | `"local"` (subprocess) |
| `command` | Executable to spawn | `"npx"`, `"node"`, `"python"` |
| `args` | Command-line arguments | `["-y", "@mcp/server-filesystem", "/path"]` |
| `tools` | Which tools to enable | `["*"]` or `["read_file"]` |

### Key Concept

> 💡 **Local MCP = SDK-managed subprocess.** When you configure `type: "local"`, the SDK spawns the MCP server as a child process (just like it spawns the Copilot CLI). The server communicates via stdio. When the session ends, the server is automatically shut down.

### ✅ Checkpoint
The MCP filesystem server connected, the model read files from `./sample-docs/`, and you understand the 4 configuration fields.

---

## Exercise 3: Use MCP Tools in a Session

### Goal
Understand the `tools` opt-in pattern — MCP tools aren't available unless you explicitly enable them.

### Steps

**3.1** In the `mcp-local.ts` config, notice `tools: ["*"]`:

```typescript
mcpServers: {
  filesystem: {
    // ...
    tools: ["*"],  // ← This enables ALL tools from the server
  },
}
```

**3.2** The three `tools` options:

| Value | Effect |
|-------|--------|
| `["*"]` | Enable ALL tools from this server |
| `["read_file", "list_directory"]` | Enable only these specific tools |
| `[]` | Server connected but NO tools available |

**3.3** Why opt-in? Security. An MCP server might provide dangerous tools (file writes, shell execution). The `tools` field lets you control exactly which tools the model can access.

**3.4** Without `tools: ["*"]` (or a specific list), the MCP server connects but the model has no tools to call. This is the most common MCP gotcha.

### Key Concept

> 💡 **`tools: ["*"]` is required — MCP tools are opt-in.** If you forget this field, the MCP server connects but provides zero tools. This is a deliberate security measure: you must explicitly choose which external tools to expose to the model.

### ✅ Checkpoint
You understand that `tools: ["*"]` is opt-in and know the three options (all, specific list, none).

---

## Exercise 4: MCP Tool Filtering

### Goal
Restrict MCP tools to read-only operations for security — the most important MCP configuration skill.

### Steps

**4.1** Run the filtered MCP demo:

```bash
npm run filtered
```

**4.2** Open `mcp-filtered.ts` and compare with `mcp-local.ts`:

```typescript
// mcp-local.ts — FULL access
tools: ["*"],  // read, write, delete — everything

// mcp-filtered.ts — READ-ONLY access
tools: ["read_file", "list_directory"],  // Only these two tools
```

**4.3** With the filtered config, the model can:
- ✅ Read file contents
- ✅ List directory contents
- ❌ Write files
- ❌ Create directories
- ❌ Delete files
- ❌ Move/rename files

**4.4** In production, always ask: **"What's the minimum set of tools this use case needs?"** Start restrictive and add tools only when needed.

**4.5** To discover what tools a server provides, use `tools: ["*"]` in development with `logLevel: "debug"`. The debug output lists all available tools.

### Key Concept

> 💡 **Filter tools to the minimum required.** In development, `tools: ["*"]` is fine for exploration. In production, always specify exact tool names. The filesystem server provides write and delete tools that you probably don't want the model to use unsupervised.

### ✅ Checkpoint
You can configure read-only MCP access and explain why production should never use `tools: ["*"]`.

---

## Exercise 5: MCP Server Options

### Goal
Configure advanced MCP server options: timeout, environment variables, and working directory.

### Steps

**5.1** Run the options demo:

```bash
npm run options
```

**5.2** Open `mcp-options.ts` and see the additional fields:

```typescript
mcpServers: {
  filesystem: {
    type: "local",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", docsPath],
    tools: ["*"],

    timeout: 30000,                          // 30 seconds
    env: { NODE_ENV: "development" },        // Environment variables
    cwd: ".",                                // Working directory
  },
}
```

**5.3** What each option does:

| Option | Type | Purpose |
|--------|------|---------|
| `timeout` | `number` (ms) | Kill server if it doesn't respond within this time |
| `env` | `Record<string, string>` | Environment variables passed to the server process |
| `cwd` | `string` | Working directory for the server process |

**5.4** **Timeout is critical.** Without it, a hung MCP server blocks your entire conversation indefinitely. Always set a timeout in production.

### Key Concept

> 💡 **Always set `timeout` in production.** A hung MCP server with no timeout will make your application unresponsive. 30 seconds (`30000`ms) is a reasonable default. For slow operations, increase it — but always have a limit.

### ✅ Checkpoint
You know the 3 additional MCP options and understand why `timeout` is critical for production.

---

## Exercise 6: Connect to a Remote MCP Server

### Goal
Understand how to configure a remote (HTTP/SSE) MCP server — the other transport type.

### Steps

**6.1** Run the remote MCP example:

```bash
npm run remote
```

**6.2** This is a configuration-only exercise (no running server to connect to). Study the output:

```
Config shape for remote (HTTP/SSE) MCP servers:

mcpServers: {
  github: {
    type: "http",
    url: "https://api.githubcopilot.com/mcp/",
    headers: {
      "Authorization": "Bearer ${GITHUB_TOKEN}"
    },
    tools: ["*"],
  },
}
```

**6.3** Compare local vs remote:

| Aspect | Local (stdio) | Remote (HTTP/SSE) |
|--------|--------------|-------------------|
| Config keys | `command`, `args` | `url`, `headers` |
| Lifecycle | SDK spawns & stops it | Already running externally |
| Transport | stdin/stdout | HTTP requests + Server-Sent Events |
| Authentication | Environment variables | Headers (Bearer token, API key) |
| Use case | Local tools (filesystem, SQLite) | Cloud services (GitHub, databases) |

**6.4** The `headers` field supports authentication. Common patterns:

```typescript
headers: { "Authorization": "Bearer ${process.env.TOKEN}" }
headers: { "X-API-Key": process.env.API_KEY }
```

### Key Concept

> 💡 **Local = SDK manages the process. Remote = you manage the server.** Use local MCP for tools that run on the same machine (filesystem, local database). Use remote MCP for cloud-hosted services or shared infrastructure. The `tools` filtering works the same way for both.

### ✅ Checkpoint
You can configure both local and remote MCP servers and know when to use each transport type.

---

## Exercise 7: Define Custom Agents

### Goal
Create a specialized AI persona with a custom name, description, and system prompt.

### Steps

**7.1** Run the custom agents demo:

```bash
npm run agents
```

**7.2** Notice the response style — structured, professional, with proper markdown formatting. This is the "Documentation Writer" persona at work.

**7.3** Open `custom-agents.ts` and study the configuration:

```typescript
customAgents: [
  {
    name: "docs-writer",              // Unique identifier
    displayName: "Documentation Writer",  // Human-readable name
    description: "Expert at writing clear technical documentation",
    prompt: "You are a senior technical writer with 15 years of experience...",
  },
],
```

**7.4** The four agent fields:

| Field | Purpose | Required |
|-------|---------|:--------:|
| `name` | Unique identifier (kebab-case) | Yes |
| `displayName` | Human-friendly label | Optional |
| `description` | What this agent does | Yes |
| `prompt` | System prompt for this persona | Yes |

**7.5** You can pre-select an agent at session creation using the `agent` field:

```typescript
const session = await client.createSession({
  customAgents: [{ name: "researcher", ... }, { name: "editor", ... }],
  agent: "researcher",  // pre-select this agent
  onPermissionRequest: approveAll,
});
```

**7.6** How agents differ from `systemMessage` (Level 4):

| Feature | `systemMessage` | `customAgents` |
|---------|----------------|---------------|
| Purpose | General personality | Specialized persona |
| Scope | Single session | Reusable across sessions |
| Structure | Just content string | Name + description + prompt |
| Count | One per session | Multiple per session |

### Key Concept

> 💡 **Custom agents are reusable personas.** Unlike `systemMessage` which is a raw string, agents have structure (name, description, prompt) that makes them identifiable and reusable. Define an agent once, use it across multiple sessions or projects.

### ✅ Checkpoint
The Documentation Writer persona shaped the response style, and you understand the 4 agent configuration fields.

---

## Exercise 8: Skill Directories

### Goal
Load a reusable skill directory containing prompts, tools, and configuration.

### Steps

**8.1** Run the skills demo:

```bash
npm run skills
```

**8.2** Observe: the skill's system prompt (review guidelines) influences the response.

**8.3** Examine the skill directory structure:

```
skills/docs-review/
├── skill.json           # Metadata and file references
└── prompts/
    └── system.md        # System prompt additions
```

**8.4** Open `skills/docs-review/skill.json`:

```json
{
  "name": "docs-review",
  "description": "A skill for reviewing and improving technical documentation",
  "prompts": ["prompts/system.md"],
  "tools": []
}
```

**8.5** Open `skills/docs-review/prompts/system.md` — this content is added to the session's system prompt:

```markdown
You are a technical documentation reviewer. When reviewing docs:
1. Check for accuracy...
2. Check for completeness...
```

**8.6** The session config:

```typescript
skillDirectories: [path.resolve("./skills/docs-review")],

// To disable specific skills:
// disabledSkills: ["docs-review"],
```

### Key Concept

> 💡 **Skills are portable prompt+tool bundles.** A skill directory packages system prompts, tool definitions, and configuration into a reusable unit. Share skills across projects, version them in git, and load them dynamically. `disabledSkills` lets you selectively turn off skills without removing them.

### ✅ Checkpoint
You loaded a skill directory, saw its system prompt influence the response, and understand the `skill.json` structure.

---

## Exercise 9: Available and Excluded Tools

### Goal
Control which built-in SDK tools are accessible using whitelist (`availableTools`) and blacklist (`excludedTools`) approaches.

### Steps

**9.1** Run the tool control demo:

```bash
npm run control
```

**9.2** Study the two approaches:

**Blacklist — `excludedTools`** (block specific tools):
```typescript
excludedTools: ["shell", "bash", "editFile"],
// Everything EXCEPT these is available
```

**Whitelist — `availableTools`** (allow specific tools only):
```typescript
availableTools: ["read_file", "search_code"],
// ONLY these tools available — everything else blocked
```

**9.3** Comparison:

| Approach | Config | Default | Best For |
|----------|--------|---------|----------|
| `excludedTools` | List what to block | Everything allowed | Blocking a few dangerous tools |
| `availableTools` | List what to allow | Everything blocked | Maximum restriction |

**9.4** Advanced: if your custom `defineTool` shares the same name as a built-in tool, set `overridesBuiltInTool: true` to explicitly replace the built-in behavior.

**9.5** How these relate to the tools you already know:

| Tool Control Method | Level | Scope |
|--------------------|:-----:|-------|
| `defineTool` | L3 | Create custom tools |
| `hooks.onPreToolUse` | L5 | Per-call allow/deny decisions |
| `mcpServers.tools` | L6 | Filter MCP server tools |
| `excludedTools` | L6 | Blacklist built-in tools |
| `availableTools` | L6 | Whitelist built-in tools |

### Key Concept

> 💡 **Defense in depth.** Use `excludedTools`/`availableTools` for broad static control, `mcpServers.tools` for per-server filtering, and `onPreToolUse` hooks for dynamic per-call decisions. Layer them for maximum security.

### ✅ Checkpoint
You can explain the difference between `excludedTools` and `availableTools` and when to use each.

---

## Exercise 10: Combine MCP + Custom Tools

### Goal
Use MCP tools and custom `defineTool` tools together in a single session.

### Steps

**10.1** Run the combination demo:

```bash
npm run combine
```

**10.2** Observe: the model calls MCP's `read_file` to read the architecture doc, then calls your custom `format_summary` tool to create a structured report.

**10.3** Open `mcp-plus-custom.ts` and see both configured:

```typescript
const session = await client.createSession({
  model: "gpt-4.1",
  onPermissionRequest: approveAll,

  // MCP server provides filesystem tools
  mcpServers: {
    filesystem: { type: "local", /* ... */, tools: ["*"] },
  },

  // Custom tool provides formatting logic
  tools: [formatSummary],
});
```

**10.4** The model sees ALL tools from both sources and chooses the right one:
- **MCP tools**: `read_file`, `list_directory` (from filesystem server)
- **Custom tools**: `format_summary` (from your `defineTool`)

**10.5** The model naturally chains them: read file (MCP) → format summary (custom).

### Key Concept

> 💡 **MCP and custom tools coexist seamlessly.** The model doesn't distinguish between MCP tools and custom tools — it sees one unified toolset and picks the best tool for each step. This lets you use MCP for standard operations (filesystem, database) and custom tools for your application-specific logic.

### ✅ Checkpoint
Both MCP tools and custom tools were called in the same conversation, and you understand they share one unified toolset.

---

## Exercise 11: Multiple MCP Servers

### Goal
Connect two MCP servers simultaneously and observe the model using tools from both.

### Steps

**11.1** Run the multi-MCP demo:

```bash
npm run multi
```

**11.2** Open `multi-mcp.ts` and see two servers:

```typescript
mcpServers: {
  docs: {
    type: "local",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", docsPath],
    tools: ["read_file", "list_directory"],
  },
  skills: {
    type: "local",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", skillsPath],
    tools: ["read_file", "list_directory"],
  },
},
```

**11.3** Each server is named (here: `docs` and `skills`). The model can use tools from both.

**11.4** In production, you might connect:
- A **filesystem** server for local files
- A **GitHub** server for repository access
- A **database** server for queries

All three would provide tools simultaneously.

### Key Concept

> 💡 **Multiple MCP servers expand the model's capabilities.** Each server provides its own tools, and the model can use tools from any of them in the same conversation. This is how you build rich applications — filesystem + GitHub + database + custom tools all working together.

### ✅ Checkpoint
Two MCP servers ran simultaneously, and the model accessed files from both data sources.

---

## Exercise 12: Capstone: Documentation Assistant

### Goal
Experience the full Level 6 application — MCP, custom agents, skill directories, custom tools, and hooks all working together.

### Steps

**12.1** Run the docs explorer capstone:

```bash
npm run explore
```

**12.2** Try these interactions:

```
You: List all documentation files
  → MCP filesystem: list_directory

You: Read the architecture doc and summarize it
  → MCP filesystem: read_file → streams summary

You: Generate a table of contents for all the docs
  → MCP: list_directory → custom tool: generate_toc

You: Review the API reference for completeness
  → Skill prompt influences review style

(Press Ctrl+C)
  → Audit summary: tool calls + token count
```

**12.3** Open `docs-explorer.ts` and identify all Level 6 features:

| Feature | Config | Source |
|---------|--------|--------|
| MCP filesystem | `mcpServers.filesystem` | External tool provider |
| Custom agent | `customAgents: [{ name: "docs-navigator" }]` | AI persona |
| Skill directory | `skillDirectories: [skillsPath]` | Reusable prompts |
| Custom tool | `tools: [generateToc]` | Your `defineTool` |
| Hooks (audit) | `hooks.onPreToolUse` + `onSessionEnd` | Level 5 |
| Streaming | `streaming: true` | Level 2 |
| REPL | `readline/promises` | Level 4 |

**12.4** This application demonstrates the "context-rich" pattern:
- **MCP** provides access to external data (files)
- **Agents** shape how the model communicates (technical writer persona)
- **Skills** add domain expertise (documentation review guidelines)
- **Custom tools** handle application-specific logic (TOC generation)
- **Hooks** enforce policies (audit logging)

### Key Concept

> 💡 **Context = MCP + Agents + Skills.** MCP provides DATA (files, APIs, databases). Agents provide VOICE (personality, communication style). Skills provide EXPERTISE (domain knowledge, review guidelines). Together, they create an AI assistant that knows your project, speaks in the right voice, and follows your team's standards.

### ✅ Checkpoint
You ran the full docs explorer with MCP, agents, skills, custom tools, and hooks. You can explain what each component contributes to the whole.

---

## Self-Assessment

Rate yourself 1–3 on each skill:

| # | Skill | 1 | 2 | 3 |
|---|-------|---|---|---|
| 1 | I can explain MCP architecture (local vs remote) | ☐ | ☐ | ☐ |
| 2 | I can configure a local MCP server | ☐ | ☐ | ☐ |
| 3 | I understand the `tools` opt-in pattern | ☐ | ☐ | ☐ |
| 4 | I can filter MCP tools for read-only access | ☐ | ☐ | ☐ |
| 5 | I can set timeout, env, and cwd on MCP servers | ☐ | ☐ | ☐ |
| 6 | I can configure a remote MCP server with authentication | ☐ | ☐ | ☐ |
| 7 | I can define custom agents with personas | ☐ | ☐ | ☐ |
| 8 | I can load and configure skill directories | ☐ | ☐ | ☐ |
| 9 | I can use `availableTools` and `excludedTools` | ☐ | ☐ | ☐ |
| 10 | I can combine MCP tools and custom tools | ☐ | ☐ | ☐ |
| 11 | I can connect multiple MCP servers simultaneously | ☐ | ☐ | ☐ |
| 12 | I can build an app combining MCP, agents, skills, and hooks | ☐ | ☐ | ☐ |

**Scoring:**
```
1 = I need to revisit this
2 = I can do this with reference
3 = I can do this from memory

Score: __/36
  30+ (≥ 83%) → Proceed to Level 7 ✅
  24-29 (67-80%) → Review weak areas, then proceed
  < 24 (< 67%) → Repeat key exercises before continuing
```

---

## What's Next?

In **[Level 7: Production](../level-7/README.md)**, you'll prepare applications for deployment. You'll master **BYOK (Bring Your Own Key)** to use OpenAI, Azure, or Ollama directly, implement **session persistence** to resume conversations across restarts, configure **infinite sessions** for long-running agents, and build a production-grade standup bot.
