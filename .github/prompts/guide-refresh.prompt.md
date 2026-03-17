---
description: Review and update GUIDE.md based on the latest Copilot SDK upstream changes.
---

# GUIDE.md Refresh

You are performing a **deep content refresh** of `GUIDE.md` to ensure every factual claim, code example, and cross-language note is accurate against the latest Copilot SDK and CLI documentation.

## Context

`GUIDE.md` is a 15-chapter, 5-part deep conceptual guide covering the Copilot SDK architecture, programming model, tools, security, and enterprise patterns. Every factual claim must be traceable to upstream sources.

## Pre-Check

Before making changes, run the `sdk-update-check` prompt first (or read its latest output) to understand what has changed upstream. If no update check has been done recently, do one now.

## Chapter-by-Chapter Review

For each of the 15 chapters in GUIDE.md, verify:

### Factual Accuracy
- [ ] All API method names match current SDK READMEs
- [ ] All event type names match current SDK event enums
- [ ] All session config options are current (no removed options, no missing new ones)
- [ ] All code examples use current import paths and method signatures
- [ ] Architecture descriptions match current SDK repo README
- [ ] Auth methods and priority order match current auth docs
- [ ] BYOK provider configuration matches current BYOK docs
- [ ] Permission model description matches current CLI docs
- [ ] MCP configuration matches current MCP docs

### Cross-Language Notes
- [ ] TypeScript patterns match current Node.js SDK README
- [ ] Python patterns match current Python SDK README
- [ ] Go patterns match current Go SDK README
- [ ] .NET patterns match current .NET SDK README
- [ ] Differences between languages are still accurately described

### Gotchas Sections
- [ ] All gotchas are still relevant (not fixed upstream)
- [ ] No new gotchas have emerged from upstream changes
- [ ] Azure endpoint gotcha is still accurate
- [ ] Package naming gotcha reflects current state

### Design Implications
- [ ] Implications still follow from the current architecture
- [ ] Enterprise patterns are still valid given current permission model
- [ ] Session persistence patterns match current workspace behavior

## Workshop Cross-References

Verify that GUIDE.md correctly references workshop exercises:
- [ ] "Practice this in Exercise X.Y" references point to existing exercises
- [ ] The concepts taught match what the referenced exercises cover

## Making Changes

When updating GUIDE.md:
1. Make the **smallest possible changes** to fix inaccuracies
2. Preserve the existing chapter/section structure
3. Add new content only if a significant new feature warrants it
4. Update the "Design implication" annotations if the implications have changed
5. If a chapter needs major rewriting, flag it for discussion rather than rewriting silently

## Output

After completing the review, provide:
1. A summary of changes made (with before/after for significant changes)
2. A list of items that need discussion before changing
3. An overall confidence score (1-5) for the guide's current accuracy
