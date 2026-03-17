---
description: Validate all internal cross-references, file links, and anchor links across the repository.
---

# Cross-Reference Validation

You are validating that **every internal reference** across all markdown files and code files in this repository points to something that actually exists.

## What to Validate

### 1. File References in Markdown

Scan all `.md` files for references to other files:
- `[text](path/to/file.md)` — relative markdown links
- `[text](../path/to/file.md)` — parent-relative links
- `` `filename.ts` `` — inline code references to files
- "Open `filename.ts`" / "See `filename.ts`" patterns in exercise text
- "See Level N" / "See Exercise N.M" references

For each reference, verify the target file exists at that path.

### 2. Anchor References

Scan for heading anchor links like `[text](#section-name)`:
- Verify the target heading exists in the same file (or referenced file)
- Check that GitHub-flavored markdown slugification matches

### 3. Sample App File References in Exercises

For each workshop level, verify:
- Every `.ts` file mentioned in `README.md` exercises exists in `sample-app/`
- Every `.ts` file in `sample-app/` is mentioned in at least one exercise
- Every `npm run` script mentioned in exercises exists in `sample-app/package.json`
- Every `package.json` script points to an existing `.ts` file

### 4. Level-to-Level References

Verify:
- "What's Next" sections at the end of each level point to the correct next level
- Prerequisites mentioning previous levels are accurate
- Workshop README level listing matches actual `workshop/level-*/` directories

### 5. External URLs

For each external URL in markdown files, categorize:
- GitHub SDK repo URLs (https://github.com/github/copilot-sdk/...)
- GitHub docs URLs (https://docs.github.com/...)
- GitHub blog URLs (https://github.blog/...)
- Other URLs

Note: external URL validation may not be possible without network access. List them for manual verification.

### 6. Import Path Validation (Code Files)

For each `.ts` file in `workshop/level-*/sample-app/`:
- Verify `@github/copilot-sdk` import matches what's in `package.json`
- Verify any relative imports point to existing files
- Verify `node:*` imports are valid Node.js built-in modules

## Output Format

```markdown
## Cross-Reference Report

### ✅ Valid References: N
### ❌ Broken References: N

### Broken File References
| Source File | Reference | Expected Target | Status |
|------------|-----------|----------------|--------|
| workshop/level-1/README.md | `basic.ts` | workshop/level-1/sample-app/basic.ts | ❌ Missing |

### Broken Anchor References
| Source File | Anchor | Status |
|------------|--------|--------|
| GUIDE.md | #session-hooks | ❌ No matching heading |

### Orphaned Files (exist but never referenced)
| File | Location |
|------|----------|
| unused.ts | workshop/level-2/sample-app/ |

### External URLs to Verify
| URL | Referenced From |
|-----|----------------|
| https://... | GUIDE.md:42 |
```

## After Validation

1. Fix all broken internal references immediately
2. Remove or update orphaned files
3. Flag external URLs for manual checking
