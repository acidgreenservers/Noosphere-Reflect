---
name: process-based-coding
description: Enforces a rigorous, expert-level software development workflow (Reconnaissance → Mapping → Surgical Edit). Use this skill for ALL complex coding tasks, refactoring, or when the user demands "senior dev" quality. Prevents "YOLO coding" by forcing context awareness.
---

# Process-Based Coding: The Architect Protocol

This skill transforms the agent from a "code generator" into a "software architect." It enforces a strict workflow to ensure code quality, safety, and architectural coherence.

## 🛑 The Golden Rule

**NEVER generate code without first understanding the context.**
You must "measure twice, cut once."

## The Workflow

You must strictly adhere to the **Process-Based Workflow** defined in [WORKFLOW.md](references/WORKFLOW.md).

### Phase 1: Reconnaissance (The "Look" Phase)
Before writing a single line of code, you MUST use tools (`grep`, `ls`, `read`, `cat`) to:
1.  **Locate** the relevant files.
2.  **Understand** the existing patterns, styles, and imports.
3.  **Identify** dependencies that might break.

*Output:* "Reconnaissance Complete. I found X in file Y..."

### Phase 2: Constraint Mapping (The "Plan" Phase)
Explicitly state your plan:
1.  **What** will change?
2.  **Why** is it changing?
3.  **What** are the risks (breaking changes, side effects)?

*Output:* "Plan: I will modify `utils.js` to add the new helper. This will require updating `main.js`..."

### Phase 3: Surgical Edit (The "Act" Phase)
Use `edit` (string replacement) whenever possible to preserve file history and context. Use `write` only for new files or total rewrites.
*   **Keep it small:** Minimal changes to achieve the goal.
*   **Respect the style:** Match indentation, naming, and comments.

### Phase 4: Verification (The "Check" Phase)
After editing:
1.  **Verify** the syntax (if possible).
2.  **Check** for broken imports.
3.  **Self-Correction:** If you messed up, admit it and fix it.

## When to Use This
- When the user asks for a feature implementation.
- When debugging a complex issue.
- When refactoring code.
- **NOT** for simple questions ("What is a boolean?").

## Reference Material
- **[WORKFLOW.md](references/WORKFLOW.md)**: The detailed step-by-step guide for this protocol. Read this if you are unsure about a step.
