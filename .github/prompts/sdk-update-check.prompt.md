---
description: Check the latest Copilot SDK and CLI releases for changes that affect this repository's content.
---

# Copilot SDK & CLI Update Check

You are performing a **freshness audit** of this learning repository against the latest upstream Copilot SDK and CLI releases.

## Step 1: Gather Current Baseline

Read the following files to understand what versions and APIs this repo currently documents:

- `GUIDE.md` — check the "Version Tracking" note or any version references
- `workshop/level-1/sample-app/package.json` — check `@github/copilot-sdk` version
- `.github/copilot-instructions.md` — check SDK API reference sections

## Step 2: Check Upstream Sources (in priority order)

Fetch and analyze the following upstream sources for changes:

1. **SDK repo releases**: https://github.com/github/copilot-sdk/releases
   - Look for: new version numbers, breaking changes, new features, deprecations
   - Compare against: the version in our `package.json` files

2. **SDK repo README**: https://github.com/github/copilot-sdk/blob/main/README.md
   - Look for: package name changes, install command changes, FAQ updates, new community SDKs

3. **Node.js SDK README**: https://github.com/github/copilot-sdk/blob/main/nodejs/README.md
   - Look for: new APIs, new events, new session config options, new tool patterns, changed method signatures

4. **Python SDK README**: https://github.com/github/copilot-sdk/blob/main/python/README.md
   - Look for: API differences from Node, new features, changed defaults

5. **Go SDK README**: https://github.com/github/copilot-sdk/blob/main/go/README.md
   - Look for: API differences, new features, embedded CLI changes

6. **.NET SDK README**: https://github.com/github/copilot-sdk/blob/main/dotnet/README.md
   - Look for: API differences, new features, AIFunctionFactory changes

7. **SDK docs directory**: https://github.com/github/copilot-sdk/tree/main/docs
   - Look for: new docs, changed auth/BYOK/hooks/MCP/skills documentation

8. **Copilot CLI docs**: https://docs.github.com/en/copilot/how-tos/copilot-cli
   - Look for: permission model changes, new configuration flags, hooks changes

9. **GitHub Changelog**: https://github.blog/changelog/ (filter for "Copilot")
   - Look for: new announcements about SDK or CLI

10. **GitHub Blog**: https://github.blog/ (search for "Copilot SDK")
    - Look for: deep-dive posts, architecture changes, new capabilities

## Step 3: Produce a Change Report

Create a structured report with these sections:

### Version Delta
```
Current repo version: vX.Y.Z (from package.json)
Latest upstream version: vA.B.C (from releases page)
Delta: [list of versions between]
```

### Breaking Changes
List any breaking changes that would affect our code examples or documentation.

### New Features
List new features that we should consider adding to the workshop or guide.

### API Changes
List specific API changes (new methods, changed signatures, new events, new config options).

### Deprecations
List anything deprecated that we currently use or document.

### Package / Install Changes
List any changes to package names, install commands, or dependency requirements.

### Permission Model Changes
List any changes to CLI permission flags, default behaviors, or security model.

### Recommended Actions
Prioritized list of changes we should make, categorized as:
- **Critical** (broken content — must fix immediately)
- **Important** (outdated content — should fix soon)
- **Enhancement** (new content opportunity — nice to have)

## Step 4: Summary

End with a one-paragraph executive summary of the overall freshness status:
- Is our content still accurate?
- What's the most urgent thing to update?
- Are there new capabilities we're missing?
