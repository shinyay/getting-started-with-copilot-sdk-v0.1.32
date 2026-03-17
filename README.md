# Getting Started with GitHub Copilot SDK

A hands-on, 8-level workshop for learning the [GitHub Copilot SDK](https://github.com/github/copilot-sdk) — the TypeScript/Python/Go/.NET toolkit that lets you embed Copilot's agentic workflows into your own applications. Build everything from simple API calls to production-ready AI assistants.

> **Note:** The Copilot SDK is currently in **Technical Preview** and specifications may change. ([Docs](https://github.com/github/copilot-sdk))

> 📌 **Workshop Snapshot:** This workshop was authored and verified against **Copilot SDK v0.1.32** and **Copilot CLI v1.0.4** as of 2026-02-19. API methods, event types, session configuration, and behaviors described in the exercises reflect these versions. If you are using newer versions, some details may differ — check the [SDK Releases](https://github.com/github/copilot-sdk/releases) for what has changed.

---

## Quick Start

### Prerequisites

- [ ] **Node.js 20+** — `node --version`
- [ ] **Copilot CLI** installed and in PATH — `copilot --version`
- [ ] **GitHub authentication** — `copilot auth login` or `gh auth status`
- [ ] **Git** — `git --version`

### Run Your First SDK Program

```bash
git clone https://github.com/shinyay/getting-started-with-copilot-sdk.git
cd getting-started-with-copilot-sdk/workshop/level-1/sample-app
npm install
npm run hello
```

If you see `Response: 4` — your setup works! You're ready for the workshop.

---

## Workshop

The [`workshop/`](workshop/README.md) directory contains a progressive 8-level curriculum with **96 exercises**, **8 sample apps**, and **8 cheat sheets**.

| Level | Title | Risk | What You'll Learn |
|:-----:|-------|------|-------------------|
| **1** | [Connect](workshop/level-1/README.md) | 🟢 | Client, session, `sendAndWait`, cleanup, auth, debug logging |
| **2** | [Stream](workshop/level-2/README.md) | 🟢 | Streaming events, `message_delta`, `session.idle`, token usage |
| **3** | [Tools](workshop/level-3/README.md) | 🟡 | `defineTool`, JSON Schema, Zod, tool invocation loop |
| **4** | [Interact](workshop/level-4/README.md) | 🟡 | System messages, `onUserInputRequest`, REPL, signal handling |
| **5** | [Hooks](workshop/level-5/README.md) | 🟠 | All 6 hook types: pre/post tool, prompt, session lifecycle, errors |
| **6** | [Context](workshop/level-6/README.md) | 🟠 | MCP servers, custom agents, skill directories, tool filtering |
| **7** | [Production](workshop/level-7/README.md) | 🟠 | BYOK providers, session persistence, infinite sessions, external CLI |
| **8** | [Mastery](workshop/level-8/README.md) | 🔴 | Image attachments, reasoning events, capstone projects |

**→ [Start the workshop](workshop/README.md)** · **[Read the conceptual guide](GUIDE.md)**

---

## Conceptual Guide

The [`GUIDE.md`](GUIDE.md) is a deep, from-first-principles companion to the workshop — 15 chapters across 5 parts covering architecture, design philosophy, security patterns, and production best practices.

| Part | Chapters | What You'll Understand |
|------|----------|----------------------|
| **I: Foundations** | Ch 1–3 | Agent runtime vs model SDK, architecture, client/session/events |
| **II: Building** | Ch 4–6 | Streaming internals, custom tool design, human-in-the-loop workflows |
| **III: Control & Safety** | Ch 7–8 | Hook-based policy engine, defense in depth, security checklist |
| **IV: Infrastructure** | Ch 9–12 | Auth matrix, BYOK deep dive, session management, MCP integration |
| **V: Mastery** | Ch 13–15 | Production patterns, gotchas reference, framework comparison |

**→ [Read the guide](GUIDE.md)**

---

## Architecture

```
Your Application → SDK Client → (JSON-RPC) → Copilot CLI (subprocess) → LLM API
```

The SDK spawns the Copilot CLI as a managed subprocess. All communication happens via JSON-RPC over stdio. This means:
- The CLI handles authentication, model routing, and rate limiting
- Your code focuses on tools, hooks, and application logic
- All four language SDKs (TypeScript, Python, Go, .NET) share the same protocol

---

## Reusable Prompts

This repo includes **10 reusable prompts** in [`.github/prompts/`](.github/prompts/) designed for use with GitHub Copilot Chat. They automate the maintenance lifecycle — keeping content current as the Copilot SDK evolves rapidly.

| Prompt | Purpose |
|--------|---------|
| [`sdk-update-check`](.github/prompts/sdk-update-check.prompt.md) | Check for new SDK/CLI releases and summarize changes |
| [`upstream-diff-analysis`](.github/prompts/upstream-diff-analysis.prompt.md) | Deep-diff upstream README changes against our content |
| [`guide-refresh`](.github/prompts/guide-refresh.prompt.md) | Update GUIDE.md chapters with new SDK information |
| [`workshop-refresh`](.github/prompts/workshop-refresh.prompt.md) | Refresh a specific workshop level's exercises and content |
| [`sample-app-upgrade`](.github/prompts/sample-app-upgrade.prompt.md) | Upgrade sample apps for new SDK APIs or patterns |
| [`new-feature-integrate`](.github/prompts/new-feature-integrate.prompt.md) | Integrate a newly discovered SDK feature across all content |
| [`level-deep-review`](.github/prompts/level-deep-review.prompt.md) | Deep quality review of a specific workshop level |
| [`cross-reference-validate`](.github/prompts/cross-reference-validate.prompt.md) | Validate all internal links, imports, and cross-references |
| [`full-content-audit`](.github/prompts/full-content-audit.prompt.md) | Comprehensive audit of entire repo for consistency |
| [`weekly-maintenance`](.github/prompts/weekly-maintenance.prompt.md) | Combined weekly check: updates + audit + refresh |

**Usage:** Open Copilot Chat, type `/` to see available prompts, or reference them directly with `#prompt:sdk-update-check`.

---

## Resources

| Resource | Link |
|----------|------|
| **Copilot SDK** (source + docs) | [github.com/github/copilot-sdk](https://github.com/github/copilot-sdk) |
| Node.js/TypeScript SDK README | [nodejs/README.md](https://github.com/github/copilot-sdk/blob/main/nodejs/README.md) |
| Python SDK README | [python/README.md](https://github.com/github/copilot-sdk/blob/main/python/README.md) |
| Go SDK README | [go/README.md](https://github.com/github/copilot-sdk/blob/main/go/README.md) |
| .NET SDK README | [dotnet/README.md](https://github.com/github/copilot-sdk/blob/main/dotnet/README.md) |
| Getting Started Guide | [docs/getting-started.md](https://github.com/github/copilot-sdk/blob/main/docs/getting-started.md) |
| Authentication Docs | [docs/auth/index.md](https://github.com/github/copilot-sdk/blob/main/docs/auth/index.md) |
| BYOK (Bring Your Own Key) | [docs/auth/byok.md](https://github.com/github/copilot-sdk/blob/main/docs/auth/byok.md) |
| Hooks Overview | [docs/hooks/overview.md](https://github.com/github/copilot-sdk/blob/main/docs/hooks/overview.md) |
| MCP Integration | [docs/mcp/overview.md](https://github.com/github/copilot-sdk/blob/main/docs/mcp/overview.md) |
| Copilot CLI Installation | [docs.github.com](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli) |
| MCP Servers Directory | [github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) |

---

## Licence

Released under the [MIT license](https://gist.githubusercontent.com/shinyay/56e54ee4c0e22db8211e05e70a63247e/raw/f3ac65a05ed8c8ea70b653875ccac0c6dbc10ba1/LICENSE)

## Author

- github: <https://github.com/shinyay>
- twitter: <https://twitter.com/yanashin18618>
- mastodon: <https://mastodon.social/@yanashin>
