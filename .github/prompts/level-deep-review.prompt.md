---
description: Deep-dive review of a specific workshop level for quality, accuracy, and learning effectiveness.
---

# Level Deep Review

You are performing a **deep quality review** of a specific workshop level. This goes beyond accuracy checking into pedagogical effectiveness and learning experience quality.

## Input Required

Which level to review? (1-8)

## Review Dimensions

### 1. Learning Flow Analysis

Read the level's README.md from Exercise 1 through Exercise 12 sequentially and evaluate:

- **Progression**: Does each exercise build naturally on the previous one?
- **Cognitive load**: Are there any sudden jumps in complexity?
- **Scaffolding**: Does the learner have enough context before each new concept?
- **Motivation**: Are early exercises rewarding enough to keep the learner engaged?
- **Pacing**: Are exercises roughly balanced in effort (some can be longer, but none should be 5x others)?

### 2. Exercise Quality (per exercise)

For each of the 12 exercises, evaluate:

| Criterion | Check |
|-----------|-------|
| **Goal clarity** | Can the learner understand what they'll achieve in one reading? |
| **Step completeness** | Can the learner follow the steps without guessing? |
| **Code correctness** | Would the code blocks work if copy-pasted? |
| **Key Concept value** | Does the insight teach something non-obvious? |
| **Checkpoint verifiability** | Can the learner objectively verify they succeeded? |

### 3. Sample App Alignment

For each `.ts` file in the level's `sample-app/`:

- Does it demonstrate what the corresponding exercise teaches?
- Is it well-commented enough to learn from by reading (not just running)?
- Does the JSDoc header accurately describe the file?
- Are there any code patterns that contradict what the exercises teach?

### 4. CHEATSHEET Completeness

Compare the CHEATSHEET against the exercises:
- Does the CHEATSHEET cover every API/concept introduced in the exercises?
- Are there CHEATSHEET entries that aren't taught in any exercise?
- Is the CHEATSHEET useful as a standalone quick-reference during exercises?
- Are the "Common Mistakes" relevant to what learners will actually encounter?

### 5. Self-Assessment Rubric Quality

For each of the 12 rubric items:
- Does it test understanding, not just completion?
- Is the 1-2-3 scale well-differentiated?
- Does "3" (highest) represent genuine mastery, not just "did the exercise"?

### 6. Connections to Other Levels

- Does the "Prerequisites" section accurately list what's needed?
- Does the "What's Next" section properly set expectations for the next level?
- Are there missed opportunities to reference earlier levels' concepts?

## Output Format

```markdown
## Level N Deep Review Summary

### Overall Quality: [Excellent | Good | Needs Work | Significant Issues]

### Strengths
1. ...
2. ...

### Issues Found
| # | Exercise | Dimension | Severity | Description |
|---|----------|-----------|----------|-------------|
| 1 | Ex 3     | Code      | High     | Missing import in step 3.2 |
| 2 | Ex 7     | Flow      | Medium   | Jump from basic to advanced too fast |

### Recommendations
1. [Actionable recommendation with specific location]
2. ...

### Changes Made
1. [file:line] Description of fix applied
2. ...
```

## Guidelines

- Fix minor issues (typos, formatting, small code fixes) directly
- Flag major issues (restructuring, reordering exercises) for discussion
- Preserve the 12-exercise structure — don't add or remove exercises
- Preserve the overall level theme and scope
