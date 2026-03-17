---
description: Upgrade all sample app dependencies and code to the latest Copilot SDK version.
---

# Sample App Upgrade

You are upgrading all sample applications in this repository to work with the latest version of the `@github/copilot-sdk` package.

## Step 1: Identify All Sample Apps

Find every `package.json` under:
- `workshop/level-*/sample-app/`

List them with their current `@github/copilot-sdk` version.

## Step 2: Check Latest SDK Version

Fetch the latest version from:
- https://github.com/github/copilot-sdk/releases
- Or check `npm view @github/copilot-sdk version` if npm registry is available

## Step 3: Update Package Files

For each `package.json` found:

1. **Update `@github/copilot-sdk` version** to the latest
2. **Check if the package name changed** (it has changed before: `@github/copilot-cli-sdk` → `@github/copilot-sdk`)
3. **Verify other dependencies** are still needed and current (e.g., `tsx`, `zod`, `readline`)
## Step 4: Update TypeScript Source Files

For each `.ts` file in `workshop/level-*/sample-app/`:

1. **Check import statements** — ensure they match the current package name
2. **Check API method calls** — verify against current Node.js SDK README:
   - `CopilotClient` constructor options
   - `createSession()` config options
   - `session.send()` / `session.sendAndWait()` signatures
   - Event names in `session.on()` handlers
   - `defineTool()` signature and schema format
   - Hook input/output types
3. **Check for deprecated APIs** — replace with current equivalents
4. **Verify streaming patterns** — delta event handling, idle detection
5. **Verify cleanup patterns** — `client.stop()` + `process.exit(0)`

## Step 5: Validate

For each sample app directory:

```bash
cd workshop/level-N/sample-app
npm install
# Verify no install errors
# Verify each .ts file at least parses:
npx tsx --eval "import('./filename.ts')" 2>&1 || echo "PARSE ERROR: filename.ts"
```

## Step 6: Commit

Use this commit message format:
```
chore: upgrade sample apps to Copilot SDK vX.Y.Z

- Updated @github/copilot-sdk from vOLD to vNEW in all workshop sample apps
- Updated API calls to match new SDK signatures (if any)
- Verified npm install succeeds in all sample-app directories

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
```
