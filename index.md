---
layout: workshop
title: "Getting Started with Copilot SDK v0.1.32"
permalink: /
---

# Getting Started with Copilot SDK v0.1.32

> **Build AI-powered applications with the GitHub Copilot SDK — a programmable agent runtime.**

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/shinyay/getting-started-with-copilot-sdk-v0.1.32)

---

## 💡 What is the Copilot SDK?

The Copilot SDK is **not** just another model API. It's a full **agent runtime** that handles:

```
Your App → SDK Client → JSON-RPC → Copilot CLI → Model Provider
```

| What You Get | Description |
|-------------|-------------|
| **Tool Invocation** | Model decides which tools to call; SDK orchestrates |
| **Context Management** | Automatic token tracking and history compaction |
| **Session Semantics** | Persistent conversation state across turns |
| **Streaming** | Progressive token delivery with proper event ordering |
| **Hooks** | 6 interception points for control and safety |
| **MCP Integration** | Connect Model Context Protocol servers |
| **BYOK** | Bring your own OpenAI/Azure/Anthropic/Ollama keys |

---

## 🎯 Workshop Levels

8 progressive levels, from your first SDK session to production deployment.

| Step | Level | Title | Risk | Exercises | Duration |
|------|-------|-------|------|-----------|----------|
| 1 | L1 | [Connect — Your First SDK Session](steps/1/) | 🟢 None | 12 | 45–60 min |
| 2 | L2 | [Stream — Real-Time Response Handling](steps/2/) | 🟢 None | 12 | 50–70 min |
| 3 | L3 | [Tools — Let Model Call Your Code](steps/3/) | 🟡 Low | 12 | 60–80 min |
| 4 | L4 | [Interact — Build Conversational Apps](steps/4/) | 🟡 Low | 12 | 60–80 min |
| 5 | L5 | [Hooks — Intercept & Control the Loop](steps/5/) | 🟠 Med | 12 | 70–90 min |
| 6 | L6 | [Context — MCP, Agents & Skills](steps/6/) | 🟠 High | 12 | 75–100 min |
| 7 | L7 | [Production — Auth, Persistence & Config](steps/7/) | 🟠 High | 12 | 75–100 min |
| 8 | L8 | [Mastery — Advanced Features & Projects](steps/8/) | 🔴 High | 12 | 90–120 min |

**96 exercises total** across all 8 levels.

---

## 📚 Learning Paths

| Path | Levels | Duration | Focus |
|------|--------|----------|-------|
| **Quick intro** | L1–L2 | 2–3 hours | API fundamentals, streaming |
| **Core skills** | L1–L5 | 6–8 hours | Tools, interaction, hooks |
| **Full training** | L1–L8 | 12–15 hours | Complete SDK mastery |
| **Advanced only** | L5–L8 | 5–7 hours | Hooks, MCP, production (requires SDK basics) |

---

## 🛠️ Tech Stack

- **Copilot SDK** v0.1.32 (Technical Preview)
- **Copilot CLI** v1.0.4
- **Node.js** 20+ with npm
- **TypeScript** (ESM modules)
- **GitHub Codespaces** (zero local setup)

---

## 📖 Resources

| Resource | Description |
|----------|-------------|
| [Conceptual Guide](guide/) | 15-chapter deep dive into SDK architecture and patterns |
| [Workshop Curriculum](curriculum/) | Skill progression matrix and learning structure |

👉 [Get Started →](setup/)
