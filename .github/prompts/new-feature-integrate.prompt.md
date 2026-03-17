---
description: Integrate a newly discovered Copilot SDK feature into the learning path (guide + workshop + sample app).
---

# New Feature Integration

You are integrating a **newly discovered Copilot SDK feature** into this learning repository. The goal is to weave the feature into the appropriate places across GUIDE.md, workshop exercises, and sample apps — maintaining the progressive learning structure.

## Input Required

Before proceeding, confirm:
1. **What is the new feature?** (name, brief description)
2. **Where is it documented upstream?** (link to SDK README, docs, changelog)
3. **Which SDK languages support it?** (TypeScript, Python, Go, .NET — or subset)
4. **What level of complexity is it?** (basic, intermediate, advanced)

## Step 1: Classify the Feature

Determine where this feature belongs in the learning progression:

| Complexity | Workshop Level | GUIDE.md Part |
|-----------|---------------|---------------|
| Core / fundamental | Level 1-2 (Foundation) | Part I: Foundation |
| Tool-related | Level 3-4 (Tools & Control) | Part II: Building Blocks |
| Integration / MCP | Level 5 (MCP) | Part III: Integration |
| Advanced patterns | Level 6-7 (Advanced) | Part IV: Advanced |
| Enterprise / production | Level 8 (Enterprise) | Part V: Production |

## Step 2: Update GUIDE.md

1. **Find the right chapter** for this feature based on the classification above
2. **Add a subsection** explaining:
   - What the feature is
   - How it works (with cross-language notes if APIs differ)
   - Design implications (what this means for real products)
   - Gotchas or pitfalls (if any)
3. **Add a workshop cross-reference**: "Practice this in Exercise X.Y"
4. **Keep it concise** — match the style and depth of surrounding sections

## Step 3: Update Workshop Content

### Add or Update Exercises
1. **Choose the target level** based on complexity classification
2. **Option A**: Add a new exercise (if the feature is significant enough)
   - Follow format: `## Exercise N: Title` → `### Goal` → `### Steps` → `### Key Concept` → `### ✅ Checkpoint`
   - This may require renumbering subsequent exercises
   - Update the "Workshop Structure" table at the top of the README
   - Update the Self-Assessment rubric

3. **Option B**: Enhance an existing exercise (if the feature is a refinement)
   - Add a step or substep to an existing exercise
   - Update the Key Concept if needed
   - Update the Checkpoint if the expected output changes

### Update CHEATSHEET.md
- Add the feature to relevant API tables
- Add quick-reference code snippet
- Add to troubleshooting section if there are common pitfalls

## Step 4: Create or Update Sample App Code

If the feature needs a runnable example:

1. **Create a new `.ts` file** or **add to an existing one** in the target level's `sample-app/`
2. Follow sample-app conventions:
   - JSDoc header with exercise reference
   - Self-contained and runnable with `npx tsx`
   - Proper cleanup: `client.stop()` + `process.exit(0)`
   - Error handling with try-catch-finally
3. **Update `package.json`** if new dependencies are needed
4. **Add npm script** for the new file

## Step 5: Update Cross-References

1. Update the workshop README's "Workshop Structure" table if exercises changed
2. Update `workshop/README.md` level descriptions if scope expanded
3. Verify GUIDE.md → workshop exercise references are correct
4. Verify CHEATSHEET → exercise references are correct

## Step 6: Validate

1. Verify the new/updated sample app compiles: `cd sample-app && npm install`
2. Verify all internal cross-references are valid
3. Verify the learning progression still flows naturally
4. Verify no existing exercises are broken by the changes

## Commit Message Format

```
feat: integrate [feature-name] into learning path

- Added GUIDE.md section in Chapter N: [chapter]
- Added/Updated Exercise N.M in Level N: [level]
- Added/Updated sample-app/filename.ts
- Updated CHEATSHEET.md with [feature] reference

Upstream: [link to SDK docs/changelog for this feature]

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
```
