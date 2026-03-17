# Coding Agent Configuration

This is a learning repository for the **GitHub Copilot SDK** containing an 8-level progressive workshop, a conceptual guide (GUIDE.md), and quick-start samples.

## Repository Structure

```
GUIDE.md            ← Deep conceptual guide (15 chapters, 5 parts)
workshop/           ← 8-level learning path (96 exercises)
├── level-N/
│   ├── README.md        ← 12 exercises per level
│   ├── CHEATSHEET.md    ← Quick reference card
│   └── sample-app/      ← Runnable TypeScript code
.github/            ← Copilot instructions and config
```

## When Modifying Workshop Content

- Follow the exercise format: `## Exercise N: Title` → `### Goal` → `### Steps` → `### Key Concept` → `### ✅ Checkpoint`
- Level 8 uses one deeper heading level (`###` Exercise → `####` Goal) due to section grouping
- Each level has exactly 12 exercises with progressive difficulty
- Include a self-assessment rubric at the end of each level README
- Cross-reference `.github/copilot-instructions.md` for SDK API accuracy
- TypeScript only for all sample apps (other languages may be added later)

## When Modifying Sample Apps

- Use `@github/copilot-sdk` and `tsx` as dependencies
- ESM modules: `"type": "module"` in package.json
- Always call `client.stop()` and `process.exit(0)` at the end
- Use `process.stdout.write()` for streaming (not `console.log`)
- Wrap SDK calls in try-catch with `client.stop()` in finally
- Each `.ts` file must be self-contained and runnable with `npx tsx`
- Include JSDoc-style header comment with exercise number and description
- Each `.ts` file must be self-contained and runnable with `npx tsx`
- All `createSession()` calls MUST include `onPermissionRequest: approveAll` (import `approveAll` from `@github/copilot-sdk`)

## When Modifying GUIDE.md

- Maintain the 5-part, 15-chapter structure
- Every factual claim must be traceable to an upstream source (SDK repo, language READMEs, CLI docs)
- Include cross-language notes where API patterns differ between TypeScript, Python, Go, and .NET
- Link to specific workshop exercises where learners can practice the concept
- Use the "Design implication" pattern: explain the concept, then explain what it means for real products
- Preserve the "Gotchas" subsections — they are the most valuable part for practitioners

## Testing

- Verify `npm install` completes without errors in each sample-app/
- Verify all `.ts` files compile (import check with `npx tsx --eval "import('./file.ts')"`)
- Verify npm scripts in package.json point to real files

---

## Freshness Maintenance — Keeping Content Current with SDK/CLI Changes

The Copilot SDK and Copilot CLI are in **Technical Preview** and release frequently (often multiple times per week). This section defines the process for keeping all content accurate and up-to-date.

### Upstream Sources to Monitor

Check these sources for changes, in priority order:

| Source | URL | What to look for |
|--------|-----|------------------|
| **SDK repo releases** | https://github.com/github/copilot-sdk/releases | New versions, breaking changes, new features |
| **SDK repo README** | https://github.com/github/copilot-sdk/blob/main/README.md | Package names, install commands, FAQ changes |
| **Node.js SDK README** | https://github.com/github/copilot-sdk/blob/main/nodejs/README.md | New APIs, events, options, deprecations |
| **Python SDK README** | https://github.com/github/copilot-sdk/blob/main/python/README.md | API differences, new features |
| **Go SDK README** | https://github.com/github/copilot-sdk/blob/main/go/README.md | API differences, new features |
| **.NET SDK README** | https://github.com/github/copilot-sdk/blob/main/dotnet/README.md | API differences, new features |
| **SDK docs directory** | https://github.com/github/copilot-sdk/tree/main/docs | Auth, BYOK, hooks, MCP, skills, debugging changes |
| **Copilot CLI docs** | https://docs.github.com/en/copilot/how-tos/copilot-cli | Permission model, configuration, hooks |
| **GitHub Changelog** | https://github.blog/changelog/ (filter: Copilot) | New announcements, feature launches |
| **GitHub Blog** | https://github.blog/ (search: Copilot SDK) | Deep-dive posts, architecture changes |

### What to Check on Each Update

When a new SDK/CLI version is released, check for:

1. **Package name changes** — The SDK has already renamed packages once (e.g., `@github/copilot-cli-sdk` → `@github/copilot-sdk`). Verify install commands in GUIDE.md, workshop READMEs, and sample-app package.json files.

2. **New or changed API methods** — Check for:
   - New session config options (e.g., new model names, new provider types)
   - New event types (beyond `assistant.message_delta`, `session.idle`, etc.)
   - Changed method signatures or return types
   - New hook types or hook input/output fields
   - New tool definition patterns

3. **New features** — Things that might need new workshop exercises or guide chapters:
   - New MCP capabilities
   - New auth methods (e.g., Entra ID support added)
   - New session management features
   - New streaming/reasoning capabilities

4. **Behavioral changes** — Defaults that change:
   - Permission model changes (e.g., `--allow-all` behavior)
   - Infinite session defaults
   - Compaction thresholds
   - Transport mode changes

5. **Deprecations and removals** — APIs or features being removed.

### What to Update When Changes Are Found

| Content file | What to update |
|-------------|----------------|
| `GUIDE.md` | Factual claims, code examples, architecture diagrams, gotchas, cross-language notes |
| `workshop/level-*/README.md` | Exercise steps, code snippets, expected outputs, key concepts |
| `workshop/level-*/CHEATSHEET.md` | API tables, event lists, quick-reference code |
| `workshop/level-*/sample-app/*.ts` | Import paths, API calls, type annotations |
| `workshop/level-*/sample-app/package.json` | Package names, version constraints |
| `.github/copilot-instructions.md` | SDK reference material, learning roadmap, code examples |
| `README.md` | Prerequisites, install commands, quick-start examples |

### Quality Checklist After Updates

- [ ] All package names and install commands match the current SDK repo
- [ ] All code examples use current API signatures (no deprecated methods)
- [ ] All event type names match current SDK event enums
- [ ] GUIDE.md cross-language notes are still accurate
- [ ] Workshop exercises reference correct sample-app filenames
- [ ] Sample apps' `npm install` succeeds without errors
- [ ] CHEATSHEET.md tables match current API surface
- [ ] No broken links to upstream docs

### Version Tracking

When performing an update, note in the commit message:
```
chore: sync content with Copilot SDK vX.Y.Z

- Updated: [list of specific changes]
- Upstream: [link to release/changelog]

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
```
