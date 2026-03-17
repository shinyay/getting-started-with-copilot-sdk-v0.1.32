---
layout: step
title: "Setup — Getting Started"
step_number: 0
permalink: /setup/
---

# Setup — Getting Started

Get your workshop environment ready. Choose between GitHub Codespaces (recommended) or local setup.

---

## Prerequisites

- ✅ **Node.js 20+** and npm
- ✅ **GitHub account** with [GitHub Copilot](https://github.com/features/copilot) access
- ✅ **GitHub Copilot CLI** installed
- ✅ Basic familiarity with **TypeScript** (async/await, Promises)
- ✅ Basic **Git** knowledge

---

## Option A: GitHub Codespaces (Recommended)

Zero local setup. Click the button below:

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/shinyay/getting-started-with-copilot-sdk-v0.1.32)

The Dev Container automatically installs:
- Node.js 22 with npm
- GitHub Copilot + Copilot Chat extensions
- All 8 sample app dependencies (via `post-create.sh`)

---

## Option B: Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shinyay/getting-started-with-copilot-sdk-v0.1.32.git
   cd getting-started-with-copilot-sdk-v0.1.32
   ```

2. **Verify Node.js:**
   ```bash
   node --version   # Must be 20+
   npm --version
   ```

3. **Verify Copilot CLI:**
   ```bash
   copilot --version
   ```

4. **Install dependencies for Level 1:**
   ```bash
   cd workshop/level-1/sample-app
   npm install
   ```

---

## Verify Your Setup

Run the minimal test from Level 1:

```bash
cd workshop/level-1/sample-app
npx tsx hello.ts
```

You should see a response from the Copilot model. If you get an authentication error, ensure your GitHub Copilot CLI is properly authenticated:

```bash
gh auth login
gh extension install github/gh-copilot
```

---

## Workshop Structure

Each level follows the same pattern:

```
workshop/level-N/
├── README.md          ← 12 exercises with detailed instructions
├── CHEATSHEET.md      ← Quick reference card
└── sample-app/        ← Working TypeScript code
    ├── package.json
    └── *.ts           ← One file per exercise
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `copilot: command not found` | Install: `gh extension install github/gh-copilot` |
| Node.js version too old | Upgrade to Node.js 20+ via `nvm install 20` |
| `npm install` fails | Delete `node_modules` and `package-lock.json`, retry |
| Authentication error | Run `gh auth login` and select Copilot scopes |
| TypeScript errors | Ensure `npx tsx` is available (installed with sample apps) |

👉 **Ready?** [Start with Level 1: Connect →](../steps/1/)
