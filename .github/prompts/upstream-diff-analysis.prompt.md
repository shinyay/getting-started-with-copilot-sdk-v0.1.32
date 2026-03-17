---
description: Compare our content against the latest upstream SDK documentation and identify gaps.
---

# Upstream Diff Analysis

You are performing a **detailed diff analysis** between this repository's content and the latest upstream Copilot SDK documentation. The goal is to find **gaps** — things the SDK supports that we don't cover, or things we document that are no longer accurate.

## Sources to Compare

### Our Content (left side)
- `GUIDE.md` — our conceptual guide
- `workshop/level-*/README.md` — our exercises
- `workshop/level-*/CHEATSHEET.md` — our quick references
- `.github/copilot-instructions.md` — our SDK reference

### Upstream Documentation (right side)
Fetch and analyze these upstream sources:

1. **SDK Repo README**: https://github.com/github/copilot-sdk/blob/main/README.md
2. **Node.js README**: https://github.com/github/copilot-sdk/blob/main/nodejs/README.md
3. **Python README**: https://github.com/github/copilot-sdk/blob/main/python/README.md
4. **Go README**: https://github.com/github/copilot-sdk/blob/main/go/README.md
5. **.NET README**: https://github.com/github/copilot-sdk/blob/main/dotnet/README.md
6. **Auth docs**: https://github.com/github/copilot-sdk/blob/main/docs/auth/index.md
7. **BYOK docs**: https://github.com/github/copilot-sdk/blob/main/docs/auth/byok.md
8. **Hooks docs**: https://github.com/github/copilot-sdk/blob/main/docs/hooks/overview.md
9. **MCP docs**: https://github.com/github/copilot-sdk/blob/main/docs/mcp/overview.md
10. **Skills docs**: https://github.com/github/copilot-sdk/blob/main/docs/guides/skills.md
11. **Session persistence**: https://github.com/github/copilot-sdk/blob/main/docs/guides/session-persistence.md
12. **Debugging docs**: https://github.com/github/copilot-sdk/blob/main/docs/debugging.md
13. **CLI docs**: https://docs.github.com/en/copilot/how-tos/copilot-cli

## Analysis Categories

### A. Features We Cover That Changed Upstream

List features where our description no longer matches upstream:

| Feature | Our Description | Upstream Description | Action Needed |
|---------|----------------|---------------------|---------------|
| ... | ... | ... | Update/Rewrite/Remove |

### B. Features Upstream That We Don't Cover

List features documented upstream that we don't mention at all:

| Feature | Upstream Source | Complexity | Recommended Location |
|---------|---------------|-----------|---------------------|
| ... | Node README §X | Intermediate | Level 4 + GUIDE Ch.8 |

### C. Features We Cover That Don't Exist Upstream

List anything we document that can't be verified in upstream sources:

| Feature | Our Source | Upstream Status | Action |
|---------|-----------|----------------|--------|
| ... | GUIDE.md Ch.5 | Not found | Verify or Remove |

### D. API Surface Diff

Compare our documented APIs against upstream:

#### Session Config Options
| Option | Our Docs | Upstream | Status |
|--------|----------|----------|--------|
| `model` | ✅ | ✅ | Match |
| `streaming` | ✅ | ✅ | Match |
| `newOption` | ❌ | ✅ | Gap |

#### Event Types
| Event | Our Docs | Upstream | Status |
|-------|----------|----------|--------|
| `assistant.message_delta` | ✅ | ✅ | Match |

#### Tool Definition API
| Pattern | Our Docs | Upstream | Status |
|---------|----------|----------|--------|
| `defineTool` | ✅ | ✅ | Match |

#### Hook Types
| Hook | Our Docs | Upstream | Status |
|------|----------|----------|--------|
| `onPreToolUse` | ✅ | ✅ | Match |

## Output

Produce a prioritized action list:

```markdown
## Upstream Diff Summary

### Critical Gaps (must address)
1. [description + where to fix]

### Important Gaps (should address)
1. [description + where to fix]

### Nice-to-Have Gaps (future enhancement)
1. [description + where to fix]

### Over-Documentation (we say things upstream doesn't)
1. [description + what to verify/remove]

### Perfect Matches (no action needed)
- [count] features fully aligned with upstream
```
