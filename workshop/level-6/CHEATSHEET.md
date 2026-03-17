---
layout: cheatsheet
title: "Level 6: Context — Cheatsheet"
parent_step: 6
permalink: /cheatsheet/6/
---

# Level 6 — Quick Reference Card

## MCP Server Types

| Type | Transport | Config Keys | How It Works |
|------|-----------|-------------|-------------|
| `"local"` | stdio | `command`, `args` | SDK spawns as subprocess |
| `"http"` | HTTP/SSE | `url`, `headers` | Connects to running server |

## Local MCP Config

```typescript
mcpServers: {
  filesystem: {
    type: "local",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/path"],
    tools: ["*"],           // Required opt-in
    timeout: 30000,         // 30s — always set in production
    env: { NODE_ENV: "dev" },
    cwd: ".",
  },
}
```

## Remote MCP Config

```typescript
mcpServers: {
  github: {
    type: "http",
    url: "https://api.githubcopilot.com/mcp/",
    headers: { "Authorization": "Bearer ${TOKEN}" },
    tools: ["*"],
  },
}
```

## MCP Tool Filtering

| Value | Effect | Use When |
|-------|--------|----------|
| `tools: ["*"]` | All tools enabled | Development / full access |
| `tools: ["read_file", "list_directory"]` | Specific tools only | Production — read-only access |
| `tools: []` | Server connected, no tools | Testing connectivity |

> ⚠️ Without `tools`, MCP provides zero tools — it's opt-in by design.

## MCP Server Options (Local)

| Option | Type | Purpose |
|--------|------|---------|
| `timeout` | `number` (ms) | Kill if unresponsive (always set!) |
| `env` | `Record<string, string>` | Environment variables |
| `cwd` | `string` | Working directory |

## Custom Agents

```typescript
customAgents: [{
  name: "docs-writer",           // Unique ID (kebab-case)
  displayName: "Doc Writer",     // Human label (optional)
  description: "Expert at docs", // What it does
  prompt: "You are a senior technical writer...",  // System prompt
}],
agent: "docs-writer",           // Pre-select an agent at session creation
```

## Skill Directories

```typescript
skillDirectories: ["./skills/docs-review"],
disabledSkills: ["experimental-feature"],  // Selectively disable
```

**Skill directory structure:**
```
skills/my-skill/
├── skill.json            # { "name", "description", "prompts", "tools" }
├── prompts/
│   └── system.md         # System prompt additions
└── tools/
    └── custom-tool.json  # Tool definitions
```

## Tool Access Control

| Approach | Config | Default | Effect |
|----------|--------|---------|--------|
| **Blacklist** | `excludedTools: ["shell", "bash"]` | Everything allowed | Block specific tools |
| **Whitelist** | `availableTools: ["read_file"]` | Everything blocked | Allow specific tools only |
| **Override** | `overridesBuiltInTool: true` on `defineTool` | Custom tool added alongside | Replace a built-in tool |

## Tool Control Hierarchy

```
Layer 1:  availableTools / excludedTools    (static, session-level)
Layer 2:  mcpServers.tools                  (static, per-server)
Layer 3:  hooks.onPreToolUse                (dynamic, per-call)
Layer 4:  defineTool handlers               (your code runs)
```

## Popular MCP Servers

| Server | Package | Provides |
|--------|---------|---------|
| Filesystem | `@modelcontextprotocol/server-filesystem` | Read/write files |
| GitHub | `@modelcontextprotocol/server-github` | Repository access |
| SQLite | `@modelcontextprotocol/server-sqlite` | SQL queries |
| Puppeteer | `@modelcontextprotocol/server-puppeteer` | Browser automation |

Browse more: [github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)

## Session Config — Level 6

| Option | Type | Description |
|--------|------|-------------|
| `onPermissionRequest` | `function` | **Required.** Permission handler (use `approveAll` for auto-approve) |
| `mcpServers` | `Record<string, MCPConfig>` | MCP server connections |
| `customAgents` | `Agent[]` | Specialized AI personas |
| `agent` | `string` | Pre-select a custom agent by name |
| `skillDirectories` | `string[]` | Paths to skill bundles |
| `disabledSkills` | `string[]` | Skills to turn off |
| `availableTools` | `string[]` | Whitelist built-in tools |
| `excludedTools` | `string[]` | Blacklist built-in tools |

## Common Mistakes

| Mistake | What Happens | Fix |
|---------|-------------|-----|
| Missing `onPermissionRequest` | Session creation fails (required since v0.1.32) | Add `onPermissionRequest: approveAll` |
| Forgetting `tools: ["*"]` | MCP server connected but no tools | Always set `tools` field |
| `tools: ["*"]` in production | Model can write/delete files | Filter to specific read-only tools |
| No `timeout` on MCP server | Hung server blocks everything | Always set `timeout: 30000` |
| Vague agent `prompt` | No noticeable personality change | Be specific: style, tone, constraints |
| Wrong skill directory path | Skill silently not loaded | Use `path.resolve()` for absolute paths |
