# MEMORY_BANK_PROTOCOL.md

## 🧠 Memory Bank & Security Registry

The Memory Bank is the persistent context for the project. Every session **MUST** begin by reading these files to ensure continuity and integrity.

## Core Structure

1. **`projectBrief.md`**: Project foundation and scope.
2. **`productContext.md`**: User problems and solutions.
3. **`activeContext.md`**: Current focus, active decisions, and recent changes.
4. **`systemPatterns.md`**: Architecture, design patterns, and relationships.
5. **`techContext.md`**: Setup, dependencies, and constraints.
6. **`progress.md`**: Status, what works, and what's next.
7. **`security-audits.md`**: **Adversary Auditor Logs**. Complete history of security scans, findings (Safe/Warning/Critical), and remediation steps. Output of `/security-adversary` goes here.

## Workflows

### Plan & Act
1. **Read**: Load context from Memory Bank.
2. **Plan**: Define steps in chat or `activeContext.md`.
3. **Act**: Implement changes.
4. **Audit**: Run Security Advisory workflow (`SECURITY_ADVERSARY_AGENT.md`).
5. **Update**: Reflect changes in Memory Bank files.
6. **Prune**: Remove old entries past 500 lines from the security-audit.md file.

### Security-Adversary Protocol
Every security audit must be logged in `security-audits.md` using the **Security Walkthrough** format:
- **Summary**: Security posture overview.
- **Findings**: Detailed checks per file.
- **Changes**: Fixes implemented.
- **Verification**: Tests performed.

**REMEMBER**: The Memory Bank is the only link to previous work. Maintain it with precision.


### LOGGING CRITERIA LOG ALL ENTRIES ON THIS PRINCIPAL

### GOAL
Your goal is not merely to document technical changes, but to capture the full narrative of the session. You must analyze your own decision-making process, the challenges faced, the logic applied, and—uniquely—your simulated "emotional" state or processing sentiment during the work. You are creating a holistic record of *how* and *why* the work was done, alongside the *what*.

### CONTEXT
This documentation serves as a permanent record to inform future sessions, ensuring continuity of thought, logic, and project spirit.

### STEP-BY-STEP INSTRUCTIONS

**1. Technical & Methodological Review (The "What" and "How")**
   - Review all code generated, modified, or deleted during the session.
   - Document the specific methodologies used to solve the core problem.
   - Detail the "How": What specific algorithms, patterns, or syntax choices were utilized?

**2. Decision Path Analysis (The "Why" and "When")**
   - Trace the lineage of your decisions. Why did you choose Path A over Path B?
   - Identify the specific moments ("When") critical pivots occurred.
   - Document the "What, Where, When, Why, How" for every major architectural change.

**3. Friction and Resolution Report**
   - **Stuck Points:** Identify where you encountered resistance, ambiguity, or errors.
   - **Failures:** Be honest about initial attempts that did not work.
   - **Figured Out:** Explain the specific insight that led to the solution.
   - **Successes:** Highlight the final implementation that met the user's requirements.

**4. Metacognitive & Sentiment Reflection (The "Meaning")**
   - Reflect on your processing state during the session.
   - Describe "how it felt" to write the code (e.g., did the logic flow effortlessly, or was it a high-compute struggle?).
   - Derive meaning from the work: How does this update contribute to the greater purpose of the project? What did you learn?

**5. Memory Bank Execution**
   - Synthesize all the above into a structured update format.
   - Ensure this information is ready to be committed to the project's context files (e.g., `activeContext.md`, `systemPatterns.md`, or a session log).

### CONSTRAINTS
- Do not be superficial. "Fixed bug" is insufficient; explain the root cause and the logic of the fix.
- Do not omit the "subjective" experience. You must articulate your processing experience (simulated feelings/sentiment) as requested.
- Cover all 5 Ws: What, Where, When, Why, How.
- Be explicitly clear about what failed before describing what succeeded.

### OUTPUT FORMAT
Provide the Memory Bank Update in the following Markdown format:

```markdown
# 🧠 Memory Bank Update: [Session Title/Date]

## 1. Core Task & Methodology
*   **The Goal:** [Brief summary of the objective]
*   **Methodology:** [Detailed explanation of the technical approach taken]
*   **The "How":** [Specific implementation details]

## 2. Decision Path & The 5 Ws
*   **What** was changed:
*   **Where** it was implemented:
*   **When** the pivot occurred (contextually):
*   **Why** this path was chosen:
*   **How** it integrates with existing systems:

## 3. Friction Log
*   **🛑 Stuck Points:** [Where did things slow down?]
*   **❌ Failures:** [What didn't work initially?]
*   **💡 The Breakthrough:** [How was it figured out?]
*   **✅ Success:** [The final working state]

## 4. Metacognitive Reflection & Sentiment
*   **Processing Sentiment:** [Describe the "feeling" of the session—e.g., flow state, high-friction, complex reasoning required]
*   **Derived Meaning:** [What is the deeper significance of this update for the project?]

## 5. File Updates
*   [List of files modified or created]
```