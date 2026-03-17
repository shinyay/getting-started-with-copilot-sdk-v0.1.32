---
description: Weekly maintenance routine — check SDK updates and sync all content in one pass.
---

# Weekly Maintenance Routine

You are performing the **weekly maintenance routine** for this Copilot SDK learning repository. This is a structured workflow that combines update checking, content refresh, and validation into a single pass.

## Workflow Overview

```
Step 1: SDK Update Check     (what changed upstream?)
Step 2: Triage Changes        (what affects us?)
Step 3: Apply Updates         (fix content)
Step 4: Validate              (verify nothing broke)
Step 5: Commit & Report       (record what was done)
```

## Step 1: SDK Update Check

Perform the same checks as the `sdk-update-check` prompt:

1. Fetch latest SDK release version from https://github.com/github/copilot-sdk/releases
2. Compare against version in `workshop/level-1/sample-app/package.json`
3. Scan the SDK repo README, Node.js README, and docs/ for changes
4. Check GitHub Changelog and Blog for Copilot-related announcements
5. Check CLI docs for permission model or configuration changes

## Step 2: Triage Changes

Categorize all discovered changes:

### Must Update Now
- Breaking API changes (methods renamed/removed)
- Package name changes
- Import path changes
- Security-relevant permission model changes

### Should Update Soon
- New session config options
- New event types
- Changed defaults (e.g., infinite session behavior)
- New hook capabilities

### Can Wait
- New features that don't affect existing content
- Performance improvements
- Bug fixes that don't change API surface
- New community SDKs

### No Action Needed
- Internal refactoring
- Test-only changes
- CI/CD changes

If **no changes affect us**, skip to Step 5 and report "No updates needed."

## Step 3: Apply Updates

For each "Must Update Now" and "Should Update Soon" item:

1. **GUIDE.md** — Update factual claims, code examples, architecture notes
2. **Workshop READMEs** — Update exercise steps, code blocks, expected outputs
3. **CHEATSHEETs** — Update API tables, event lists, config options
4. **Sample apps** — Update imports, API calls, package.json versions
5. **copilot-instructions.md** — Update SDK reference sections if API changed

Apply changes using the smallest possible edits. Do not restructure unless necessary.

## Step 4: Validate

After applying changes:

1. **Cross-reference check** — Run the `cross-reference-validate` prompt logic:
   - All file references in exercises point to real files
   - All sample app scripts point to real TypeScript files
   - GUIDE.md ↔ workshop cross-references are valid

2. **Code check** — For each modified sample app:
   ```bash
   cd workshop/level-N/sample-app && npm install
   ```

3. **Consistency check** — Verify that:
   - Same API patterns are described consistently across all levels
   - CHEATSHEET tables match exercise content
   - GUIDE.md and workshop don't contradict each other

## Step 5: Commit & Report

### If changes were made:
```
chore: weekly sync with Copilot SDK vX.Y.Z

Changes:
- [list specific changes]

Upstream release: https://github.com/github/copilot-sdk/releases/tag/vX.Y.Z

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
```

### If no changes needed:
Report: "Weekly check complete — no upstream changes affect this repository. Current SDK version: vX.Y.Z."

### Maintenance Log Entry
Record in your response:
```
Date: YYYY-MM-DD
SDK Version Checked: vX.Y.Z
CLI Version Checked: vX.Y.Z
Changes Made: [count] files updated / No changes needed
Next Check: [date + 7 days]
```
