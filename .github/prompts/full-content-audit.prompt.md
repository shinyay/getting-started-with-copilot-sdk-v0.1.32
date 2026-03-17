---
description: Comprehensive audit of all repository content for accuracy, consistency, and completeness.
---

# Full Content Audit

You are performing a **comprehensive audit** of the entire repository to ensure accuracy, consistency, and completeness across all content files.

## Audit Scope

This audit covers every content file in the repository:

### Tier 1: Core Content (highest priority)
- `GUIDE.md` — Deep conceptual guide
- `README.md` — Repository entry point
- `workshop/README.md` — Workshop overview

### Tier 2: Workshop Levels (each is a unit)
For levels 1-8:
- `workshop/level-N/README.md` — 12 exercises
- `workshop/level-N/CHEATSHEET.md` — Quick reference
- `workshop/level-N/sample-app/*.ts` — Runnable code
- `workshop/level-N/sample-app/package.json` — Dependencies

### Tier 3: Configuration & Instructions
- `.github/copilot-instructions.md` — Copilot context
- `.github/AGENTS.md` — Agent configuration
- `.github/instructions/*.instructions.md` — Scoped instructions

## Audit Dimensions

### 1. Factual Accuracy
For every factual claim across all files:
- Does it match the current Copilot SDK repo README?
- Does it match the current language-specific SDK READMEs?
- Does it match the current CLI documentation?
- Are version numbers, package names, and URLs current?

### 2. Internal Consistency
Cross-check between files:
- Does GUIDE.md's architecture description match what workshop exercises teach?
- Do CHEATSHEET tables match the APIs used in sample apps?
- Do exercise instructions match the sample-app code they reference?
- Do README prerequisites match what's actually needed?
- Does the workshop README's level descriptions match level content?
- Do `.github/instructions` files match current patterns in sample apps?

### 3. Code Correctness
For every code block (in markdown) and every `.ts` file:
- Are imports correct and current?
- Are API calls using current method signatures?
- Would the code actually run without errors?
- Are there any TypeScript type errors?
- Do file references in exercises point to real files?

### 4. Completeness
- Are there SDK features documented upstream that we don't cover at all?
- Are there workshop topics that lack corresponding GUIDE.md coverage?
- Are there GUIDE.md concepts that lack workshop exercises?
- Are there CHEATSHEET entries without corresponding exercises?

### 5. Link Validity
For every link in every markdown file:
- Internal file references: does the target file exist?
- External URLs: are they still valid?
- Anchor references: does the target heading exist?

### 6. Formatting Consistency
- Exercise format compliance (Goal → Steps → Key Concept → Checkpoint)
- Code block language tags (```typescript, not ```ts or ```)
- Emoji usage consistency (🟢🟡🟠🔴 risk levels, 💡 insights, ✅ checkpoints)
- Table formatting consistency
- Heading hierarchy consistency

## Output Format

Produce a structured audit report:

```markdown
## Audit Summary
- Files audited: N
- Issues found: N (critical: N, important: N, minor: N)
- Overall health: [Excellent | Good | Needs Attention | Critical]

## Critical Issues (must fix)
1. [file:line] Description of issue

## Important Issues (should fix)
1. [file:line] Description of issue

## Minor Issues (nice to fix)
1. [file:line] Description of issue

## Consistency Matrix
| Claim/Pattern | GUIDE.md | Workshop | Cheatsheet | Sample App |
|--------------|----------|----------|------------|------------|
| ...          | ✅/❌    | ✅/❌    | ✅/❌      | ✅/❌      |

## Missing Coverage
- Features in SDK not covered: [list]
- GUIDE concepts without exercises: [list]
- Exercises without GUIDE coverage: [list]
```

## After the Audit

1. Fix all **critical** issues immediately
2. Fix **important** issues next
3. Log **minor** issues for future cleanup
4. Update the commit with changes made
