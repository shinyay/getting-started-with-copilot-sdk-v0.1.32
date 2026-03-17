---
description: Review and update workshop exercise content based on the latest Copilot SDK changes.
---

# Workshop Content Refresh

You are performing a **deep content refresh** of the 8-level workshop to ensure all exercises, code snippets, and instructions are accurate against the latest Copilot SDK.

## Pre-Check

Before making changes, run the `sdk-update-check` prompt first (or read its latest output) to understand what has changed upstream.

## Level-by-Level Review

For each level (1-8), review all three files:

### README.md (Exercises)
- [ ] All code blocks use current SDK API signatures
- [ ] Import statements use current package names (`@github/copilot-sdk`)
- [ ] Event type names match current SDK (e.g., `assistant.message_delta`, `session.idle`)
- [ ] Session config options in examples are current and valid
- [ ] Tool definition patterns match current `defineTool` API
- [ ] Hook patterns match current hook API (input/output shapes)
- [ ] MCP configuration examples match current MCP docs
- [ ] Expected outputs described in exercises are still accurate
- [ ] "Key Concept" callouts are factually correct
- [ ] "Checkpoint" descriptions match what learners will actually see
- [ ] Exercise references to sample-app files point to existing files

### CHEATSHEET.md (Quick Reference)
- [ ] API tables list current methods with correct signatures
- [ ] Event tables list current event types
- [ ] Session config option tables are complete and accurate
- [ ] Quick-reference code snippets use current API
- [ ] Hook input/output field tables are accurate
- [ ] "Common Mistakes" sections are still relevant
- [ ] Troubleshooting tips are still valid

### sample-app/*.ts (Code Files)
- [ ] `package.json` uses current `@github/copilot-sdk` package name
- [ ] All imports resolve correctly
- [ ] API method calls match current SDK signatures
- [ ] Event handler registrations use current event names
- [ ] Tool definitions follow current patterns
- [ ] `npm install` would succeed with current package versions
- [ ] Each file is self-contained and runnable with `npx tsx`

## Cross-Level Consistency

- [ ] Concepts introduced in earlier levels are not contradicted in later levels
- [ ] Progressive difficulty is maintained (no advanced concepts too early)
- [ ] Each level builds on the previous without unnecessary repetition
- [ ] Level prerequisites accurately reflect what was taught before

## Making Changes

When updating workshop content:
1. Preserve the exercise format: `## Exercise N: Title` → `### Goal` → `### Steps` → `### Key Concept` → `### ✅ Checkpoint`
2. Keep 12 exercises per level
3. Update code blocks to match current SDK API
4. Update sample-app `.ts` files to match exercise descriptions
5. Update `package.json` dependencies if package names changed
6. Update CHEATSHEET tables to reflect any API changes

## Output

After completing the review, provide:
1. Per-level summary of changes made
2. Any exercises that need restructuring (flag for discussion)
3. Sample app files that need testing after changes
