---
layout: default
title: "Workshop Curriculum"
permalink: /curriculum/
---

# 🎓 Copilot SDK Workshop — Complete Learning Path

A progressive 8-level curriculum for mastering the GitHub Copilot SDK, from
your first API call to building production-ready AI-powered applications.

## Curriculum Overview

```
Level 1    Level 2     Level 3    Level 4       Level 5     Level 6      Level 7        Level 8
Connect → Stream  → Tools  → Interact   → Hooks   → Context  → Production → Mastery
  🟢       🟢        🟡       🟡           🟠        🟠          🟠          🔴
 setup    events    define    converse     control   extend      deploy      synthesize
 basics   deltas    tools     system msg   lifecycle MCP/agents  auth/BYOK   image/reason
 auth     usage     Zod       user input   pre/post  skills      persist     projects
```

## Quick Navigation

| Level | Title | Exercises | App | Risk |
|-------|-------|:---------:|-----|------|
| [**1**](level-1/README.md) | Connect — Your First SDK Session | 12 | `hello-copilot` (TypeScript) | 🟢 |
| [**2**](level-2/README.md) | Stream — Real-Time Response Handling | 12 | `story-streamer` (TypeScript) | 🟢 |
| [**3**](level-3/README.md) | Tools — Let the Model Call Your Code | 12 | `city-guide` (TypeScript) | 🟡 |
| [**4**](level-4/README.md) | Interact — Build Conversational Apps | 12 | `study-buddy` (TypeScript) | 🟡 |
| [**5**](level-5/README.md) | Hooks — Intercept & Control the Agent Loop | 12 | `safe-coder` (TypeScript) | 🟠 |
| [**6**](level-6/README.md) | Context — MCP, Agents & Skills | 12 | `docs-explorer` (TypeScript) | 🟠 |
| [**7**](level-7/README.md) | Production — Auth, Persistence & Config | 12 | `standup-bot` (TypeScript) | 🟠 |
| [**8**](level-8/README.md) | Mastery — Advanced Features & Projects | 12 | `capstone` (TypeScript) | 🔴 |

**Total: 96 exercises across 8 levels**

## Skill Progression

```
  Risk Level    🟢 None ───────────────────────────────────── 🔴 High awareness
  Autonomy      Read API docs ──────────── Build apps ────── Design systems
  SDK Scope     Client/Session ── Events ── Tools ── Hooks ── MCP ── BYOK ── Full stack
  App Scope     Scripts ──────── Streaming ── Interactive ── Multi-service ── Production
```

| Level | New Skills Introduced |
|-------|----------------------|
| **1** | `CopilotClient`, `createSession`, `sendAndWait`, `client.stop`, `logLevel`, authentication |
| **2** | `streaming`, `session.on`, `assistant.message_delta`, `assistant.message`, `session.idle`, `assistant.usage`, `send` vs `sendAndWait` |
| **3** | `defineTool`, JSON Schema parameters, Zod schemas, tool handlers, tool invocation loop, multi-tool patterns |
| **4** | `systemMessage` (append/replace), `onUserInputRequest`, REPL patterns, signal handling, per-turn token tracking |
| **5** | `onSessionStart`, `onSessionEnd`, `onPreToolUse`, `onPostToolUse`, `onUserPromptSubmitted`, `onErrorOccurred`, permission control |
| **6** | `mcpServers` (local/remote), `customAgents`, `skillDirectories`, `availableTools`, `excludedTools`, multi-server patterns |
| **7** | BYOK `provider` (OpenAI/Azure/Ollama), `sessionId`, `resumeSession`, `infiniteSessions`, external CLI mode, parallel sessions |
| **8** | Image `attachments`, `assistant.reasoning_delta`, `reasoningEffort`, `useLoggedInUser`, full synthesis, testing, security hardening |

## Sample App Progression

Each level uses a **distinct sample application** with a clear pedagogical purpose:

| Level | Application | Language | Why This App |
|-------|-------------|----------|-------------|
| **1** | `hello-copilot` | TypeScript | Prints `4` — if it works, everything works |
| **2** | `story-streamer` | TypeScript | Long-form text makes streaming visually compelling |
| **3** | `city-guide` | TypeScript | Multiple tools with distinct domains show model choosing |
| **4** | `study-buddy` | TypeScript | Natural fit for `onUserInputRequest` + system messages |
| **5** | `safe-coder` | TypeScript | Hooks need a compelling security/compliance use case |
| **6** | `docs-explorer` | TypeScript | MCP filesystem access makes tool ecosystem tangible |
| **7** | `standup-bot` | TypeScript | Recurring task is perfect for persistence + BYOK |
| **8** | `capstone` | TypeScript | Synthesis of all 8 levels into a personal project |

## Each Level Contains

```
workshop/level-N/
├── README.md          ← 12 exercises with detailed steps
├── CHEATSHEET.md      ← Quick reference card for the level's skills
└── sample-app/        ← Hands-on code (unique per level)
    ├── package.json
    └── *.ts files
```

## How to Use This Workshop

### Self-Paced (Individual)
1. Start at Level 1, complete all 12 exercises
2. Take the self-assessment at the end of each level
3. Score ≥ 83% → proceed to the next level
4. Score < 60% → go back and repeat key exercises
5. Aim for 1–2 levels per session

### Team Workshop (Facilitated)

| Format | Levels to Cover | Audience |
|--------|----------------|----------|
| **Quick intro** (SDK basics) | Levels 1–2 | New to Copilot SDK |
| **Core skills** (daily use) | Levels 1–5 | Active developers |
| **Full training** (power users) | Levels 1–8 | Team leads, architects |
| **Advanced only** (experienced) | Levels 5–8 | Already know SDK basics |

### Safety

Every level has a **safety net**:

```bash
# Reset any level's sample app to original state
git checkout -- workshop/level-N/sample-app/
```

Levels 1–2 are **zero-risk** — they only call the API and print responses.

## Prerequisites

- [ ] **Node.js 20+** installed (`node --version`)
- [ ] **Copilot CLI** installed and in PATH (`copilot --version`)
- [ ] **GitHub authentication** working (`copilot auth login` or `gh auth status`)
- [ ] **Git** installed (`git --version`)
- [ ] **This repository** cloned locally

## Getting Started

```bash
cd workshop/level-1
cat README.md
# Read Exercise 1, then:
cd sample-app
npm install
npx tsx hello.ts
```

## Quick-Start Alternative

If you want to run code immediately without the full workshop:

```bash
cd workshop/level-1/sample-app
npm install
npm run hello        # Level 1: basic request/response
```

Then explore other levels the same way — each `sample-app/` directory is self-contained with its own `package.json` and runnable scripts.
