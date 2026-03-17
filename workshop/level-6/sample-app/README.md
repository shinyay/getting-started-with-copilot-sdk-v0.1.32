# Level 6 Sample App: `docs-explorer`

A documentation assistant powered by MCP servers, custom agents, and skill directories.

## Prerequisites

- Node.js 20+
- Copilot CLI installed and authenticated (`copilot --version`)
- `npx` available (comes with npm — needed for MCP servers)

## Setup

```bash
npm install
```

## Scripts

| Command | File | What It Does |
|---------|------|-------------|
| `npm run mcp` | `mcp-local.ts` | Local MCP filesystem server (Exercises 2–3) |
| `npm run filtered` | `mcp-filtered.ts` | MCP with tool filtering (Exercise 4) |
| `npm run options` | `mcp-options.ts` | MCP server options: timeout, env, cwd (Exercise 5) |
| `npm run remote` | `mcp-remote.ts` | Remote MCP config example (Exercise 6) |
| `npm run agents` | `custom-agents.ts` | Custom agent persona (Exercise 7) |
| `npm run skills` | `skill-dirs.ts` | Skill directories (Exercise 8) |
| `npm run control` | `tool-control.ts` | availableTools / excludedTools (Exercise 9) |
| `npm run combine` | `mcp-plus-custom.ts` | MCP + custom tools together (Exercise 10) |
| `npm run multi` | `multi-mcp.ts` | Multiple MCP servers (Exercise 11) |
| `npm run explore` | `docs-explorer.ts` | Capstone: full docs assistant (Exercise 12) |

## Quick Start

```bash
npm run mcp
# Watch the model read files via MCP filesystem server
```

## Supporting Files

- `sample-docs/` — 3 markdown files the MCP server reads (architecture, API, getting-started)
- `skills/docs-review/` — A sample skill directory with review guidelines

## Note

Exercises using MCP filesystem servers require `npx` to spawn the `@modelcontextprotocol/server-filesystem` package. The first run may take a moment to download the package.
