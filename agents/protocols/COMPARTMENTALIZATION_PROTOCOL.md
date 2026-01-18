# Compartmentalization Protocol
## Collaborative Decision Framework for File Organization

**Version**: 1.0
**Purpose**: Guide AI-Human collaboration on architectural decisions—when to create new files vs. append to existing ones, how to organize code, and what to consider before splitting modules.

**Core Philosophy**: Architecture decisions require **two minds**—AI brings code pattern analysis; humans bring product vision. Neither should decide alone.

---

## 🎯 The Core Question

**When do we create a new file vs. append to an existing monolith?**

This decision cascades to:
- Testability (can we test in isolation?)
- Reusability (will other parts of the code need this?)
- Maintainability (will changes here break something else?)
- Cognitive load (can a developer understand this without reading 5 other files?)

---

## 📋 Two-Stage Decision Process

### Stage 1: AI Analysis (Async, Self-Service)

**When triggered**: User says "should we extract X?" or "this file is too big"

**AI provides**:
1. **Current State Analysis** (< 2 min read)
   - File size + line count
   - Responsibility count (how many distinct concerns?)
   - Coupling analysis (which files depend on this?)
   - Duplication scan (is this logic repeated elsewhere?)

2. **Extraction Proposal** (specific, not abstract)
   - New file structure (exact paths + file names)
   - What gets extracted (copy/paste example)
   - What stays behind (why?)
   - Impact analysis (which files import from this?)

3. **Trade-Offs** (honest assessment)
   - Pro: Easier testing, clearer responsibility
   - Con: More files to navigate, import overhead
   - Risk: Circular dependency potential

4. **Three Options** (not "yes/no/maybe")
   - **Option A** (Conservative): Extract only core logic, keep UI helpers inline
   - **Option B** (Balanced): Clean separation, some shared utilities
   - **Option C** (Aggressive): Maximum modularity, splinter into 5+ files

**Example Output Format**:
```
## Analysis: Should we extract parseGeminiHtml?

### Current State
- converterService.ts: 2,929 lines
- parseGeminiHtml: 150 lines (5% of file)
- Parsing logic: 800+ lines of 11 parsers mixed together
- Duplication: 40% redundancy in DOM extraction across parsers

### Proposed Extraction
Extract to: src/services/parsers/gemini/parseGeminiHtml.ts
Also extract: src/services/parsers/gemini/geminiDetection.ts
Shared utils: src/services/parsers/utils/extractMarkdownFromHtml.ts (used by 5 parsers)

### Trade-Offs
✅ Pro:
- Can test Gemini parser independently
- Fixing Gemini HTML changes won't affect Claude/ChatGPT
- New platform support becomes mechanical

❌ Con:
- 3 new files to manage
- Import statements needed in converterService

⚠️ Risk:
- extractMarkdownFromHtml used by all parsers—must be stable interface

### Options to Choose From
🟢 Option A (Conservative): Extract parseGeminiHtml only, keep shared utils in converterService
🟡 Option B (Balanced): Extract parser + detection, create shared parser utils folder
🔴 Option C (Aggressive): Full modularization—10 parsers + separate utilities + factory pattern
```

---

### Stage 2: Human Decision (Interactive Conversation)

**User reviews** the AI analysis and makes decisions by answering:

#### Question 1: **Current Pain Points**
*"Before we refactor, what problems are you actually experiencing?"*

**Why this matters**: Refactoring for "cleanliness" wastes time. Refactoring for a pain you feel = high ROI.

**Examples of valid pain**:
- ❌ "The file is long" (vague, low priority)
- ✅ "Every time I fix a ChatGPT parser bug, I have to search through 2,900 lines to find it" (specific, high priority)
- ✅ "I tried to add Grok support and accidentally broke Claude parsing" (concrete pain, worth solving)
- ❌ "This violates SRP" (architectural purity, can wait)

**User should articulate**:
- What broke or was hard?
- How often does this happen?
- What would make it easier?

---

#### Question 2: **Scope of Work**
*"How much refactoring are you willing to do, and on what timeline?"*

**This is critical** because refactoring cascades:
- Extract converterService parsing → must update all import statements
- Create ParserFactory → need tests for factory
- Split ArchiveHub hooks → affects 8 modals and state management

**User decides**:
- **Surgical**: Fix ONE specific pain (e.g., "just extract Gemini parser")
- **Moderate**: Refactor one layer (e.g., "reorganize all parsers")
- **Ambitious**: Full architectural overhaul (e.g., "restructure entire service layer")

**Example**:
```
User: "The pain is that I keep breaking the Gemini parser when I change converterService.
I want to extract JUST the Gemini parser and utils it uses.
Maybe 4-6 hours of work max. I have this weekend."

AI Response:
"✅ That's surgical and achievable. Let's extract:
- src/services/parsers/gemini/parseGeminiHtml.ts
- src/services/parsers/gemini/geminiUtils.ts (helper functions)
- src/services/parsers/utils/extractMarkdownFromHtml.ts (share with other parsers)

Timeline: ~2-3 hours of extraction + testing. Let's do it."
```

---

#### Question 3: **Architectural Vision**
*"What's your vision for how this code should be organized in 6 months?"*

**Why**: Incremental refactoring should trend toward a coherent architecture, not random cleanup.

**Helps clarify**:
- Is this a one-off fix, or part of a larger vision?
- Should we extract parsers modularly now, knowing Memory + Prompt exports will need similar treatment?
- Is the app heading toward a plugin architecture?

**User articulates** (can be rough):
- "I want each AI platform to be its own plugin/module"
- "I want services organized by domain (parsing, storage, export)"
- "I want to keep it simple—just make large files smaller"

---

#### Question 4: **Trade-Off Preference**
*"When we have trade-offs, what matters most to you?"*

Different people optimize for different things:

**Option A**: Optimize for **testability**
- Extract granularly, even if it means more files
- "I want to catch bugs early with unit tests"

**Option B**: Optimize for **ease of navigation**
- Extract smartly, but not to extremes
- "I want to understand the code by reading 2-3 files, not 10"

**Option C**: Optimize for **implementation speed**
- Extract only what's strictly necessary
- "I want to get features done, refactoring is secondary"

**Example**:
```
User: "Testability. I want to be able to test each parser independently."

AI: "Then we go aggressive on separation:
- Each parser in its own file
- Each parser exports a simple interface: { parse(input: string): ChatData }
- We create ParserFactory that dispatches to the right parser
- This means 11 files instead of 1 2,900-line file, but each is 100-150 lines and independently testable"
```

---

## 🤝 The Collaboration Loop

Once user answers the 4 questions, AI proposes a **detailed implementation plan**:

```
1. **File Structure**
   Exact paths, what goes where, with line numbers

2. **Extraction Steps**
   Step 1: Create src/services/parsers/gemini/parseGeminiHtml.ts
   Step 2: Move lines 1893-2058 from converterService.ts to new file
   Step 3: Create src/services/parsers/gemini/geminiUtils.ts
   ... etc

3. **Update Import Statements**
   Files that need updating: [list with line numbers]

4. **Testing Checklist**
   Before/after verification steps

5. **Estimated Effort**
   "~3 hours: 1h extraction, 1h testing, 1h import updates"
```

---

## 📐 Decision Rules (When to Extract)

These are **guidelines, not law**. Use them to inform the 4 questions above.

### 🔴 STRONG Signal to Extract

- **File > 1,500 lines**: Almost always extract
- **Duplication**: Same logic in 3+ places → create shared utility
- **Multiple independent tests**: If you'd write separate test suites, extract
- **Dependency cascade**: Change breaks 5+ other files → too coupled
- **Single Responsibility Violation**: "And also" 3+ times in file description

**Example**: converterService.ts has:
```
"parses HTML AND exports to HTML AND exports to Markdown AND exports to JSON AND..."
```
→ Extract exporters into separate files

### 🟡 MODERATE Signal to Extract

- **File 800-1,500 lines**: Consider if other signals present
- **3+ distinct concerns**: If you can articulate them separately, split
- **Future reuse likely**: "I'll probably need this in another page"
- **Team scalability**: "If we hire another dev, they need to understand this"

### 🟢 WEAK Signal to Extract (OK to keep together)

- **File < 500 lines**: Probably fine as-is
- **Tightly coupled logic**: "This function can't work without this helper"
- **One-off functionality**: "No other code will ever need this"
- **Trivial extraction cost**: "More work to extract than benefit"

---

## ❓ Questions AI Will Ask You (During Extraction)

### When Proposing Extraction:
1. **"Is this the real pain, or a symptom?"**
   - If you say "fix the big file," AI asks: "What about the big file causes problems?"
   - This reveals the actual issue (coupling, duplication, testability)

2. **"Will this extraction enable future work?"**
   - If extracting Gemini parser, ask: "Are we adding Perplexity next?"
   - If yes, structure for extensibility. If no, keep it simple.

3. **"Who will maintain this?"**
   - If it's you alone: Can be more specialized
   - If team will touch it: Must be more standardized/documented

4. **"Can we test this?"**
   - If extracted code can't be unit tested, extraction may not help
   - Better to extract differently

5. **"Are we ready to commit to this API?"**
   - If we extract ParserFactory, we're saying "all parsers implement this interface"
   - Is that true, or will we have exceptions?

---

## 📚 Documentation (Part of Extraction)

When a new file is created, it must include:

### Top-of-file comment block:
```typescript
/**
 * Gemini HTML Parser Module
 *
 * Responsibility: Extract messages from Google Gemini HTML exports
 *
 * Why separate: Gemini's DOM structure is unique (Angular components,
 * custom elements). Keeping it isolated prevents changes here from
 * affecting Claude/ChatGPT parsers.
 *
 * Interface: parseGeminiHtml(input: string): ChatData
 *
 * Failure modes to watch for:
 * - Angular _ngcontent attributes may change between versions
 * - Thinking blocks use custom <model-thoughts> element (may not parse in some DOMParsers)
 *
 * Related files:
 * - src/services/parsers/utils/extractMarkdownFromHtml.ts (shared)
 * - src/services/parsers/ParserFactory.ts (dispatcher)
 * - /scripts/reference-html-dom/gemini-aistudio-console-dom.html (reference)
 */
```

### README in new directory:
```
# Gemini Parser Module

## What's Here
- parseGeminiHtml.ts: Main parser function
- geminiUtils.ts: Helpers specific to Gemini structure
- test/gemini.test.ts: Unit tests for Gemini parser

## DOM Reference
See `/scripts/reference-html-dom/gemini-aistudio-console-dom.html` for current DOM structure.

## Testing
Run: npm test -- gemini.test.ts

## Maintenance
When Gemini changes their HTML structure:
1. Update reference HTML in /scripts/reference-html-dom/
2. Update geminiUtils.ts selectors
3. Run tests to verify
```

---

## 🚫 Anti-Patterns (What NOT to Do)

### ❌ "Extraction for Extraction's Sake"
**Wrong**: "Let's extract this 60-line helper function into its own file because SOLID principles"
**Right**: "Let's extract this if we'll reuse it, or if it's causing test issues"

### ❌ "Premature Modularity"
**Wrong**: Creating 20 files "in case we might need them someday"
**Right**: Create files when you have a concrete reason

### ❌ "Siloed Decisions"
**Wrong**: AI says "extract this" and user doesn't question it
**Right**: AI proposes, user validates against their actual needs

### ❌ "Extraction Without Tests"
**Wrong**: Extract code, but don't update tests
**Right**: Extraction = code moves + tests move + new tests added

### ❌ "Forgotten Imports"
**Wrong**: Extract file A from file B, but forget to update import in file B
**Right**: Generate import list before extraction, update systematically

---

## 🎓 Learning Outcomes

By following this protocol, you'll develop:

1. **Architectural intuition**: Why certain code should be grouped
2. **Coupling awareness**: Spotting when change cascades
3. **Testing mindset**: Thinking "can I test this in isolation?"
4. **Trade-off analysis**: Cost vs. benefit of modularity
5. **Collaboration patterns**: How to make decisions with code-aware assistance

---

## 🔄 Integration with CLAUDE.md

This protocol works alongside CLAUDE.md's core rules:

- **Rule 1** (User Approval): Compartmentalization decisions require user input (this protocol)
- **Rule 2** (Memory Bank Updates): When extracting, update activeContext.md with why we split files
- **Rule 3** (Challenge Assumptions): AI questions why user wants extraction; user questions if AI's proposal makes sense

---

## Template: Starting a Compartmentalization Discussion

**User initiates**:
> "Claude, I notice [problem]. I think we should extract [thing]. What do you think?"

**AI responds** (following this protocol):
```
Stage 1 Delivered: AI Analysis
├── Current state (X lines, Y concerns, Z duplications)
├── Proposed extraction (new files + what moves)
├── Trade-offs (3 honest pros/cons)
└── Three options (Conservative / Balanced / Aggressive)

Ready for Stage 2: Let me ask you 4 questions to make sure this aligns with your goals...

1️⃣ What pain point are we actually solving here?
2️⃣ How much refactoring bandwidth do you have?
3️⃣ What's your 6-month vision for this code?
4️⃣ When you have trade-offs, what matters most?
```

**User answers**, then:

**AI proposes** (detailed implementation plan)
```
## Detailed Extraction Plan

### Stage: File Structure
- New files: [list]
- What moves: [details]
- What stays: [details]

### Stage: Implementation Steps
Step 1: Create new files
Step 2: Move code
Step 3: Update imports
Step 4: Test

### Stage: Risk & Mitigation
Risk: [X]
Mitigation: [Y]
```

**User approves or refines**, then:

**AI executes** (with progress tracking)
```
Marking extraction as in_progress...
[Progress updates]
Extraction complete. Updated [N] files.
```

---

## Summary: The Two-Mind Collaboration

| Stage | AI Responsibility | User Responsibility |
|-------|-------------------|---------------------|
| **Analysis** | Pattern detection, duplication scan, coupling analysis | None yet (async) |
| **Proposal** | 3 options, trade-offs, impact analysis | Review proposals |
| **Decision** | Ask clarifying questions | Answer 4 key questions |
| **Planning** | Detailed extraction steps, file structure | Validate plan aligns with vision |
| **Execution** | Write code, move files, update imports | Approve/refine as needed |
| **Verification** | Run tests, verify imports | Test in app, sign off |
| **Documentation** | Write code comments, create README | Update CLAUDE.md if pattern repeats |

**The magic happens at stages 2-4, where the two minds align on what the code should become.**

---

## Appendix: Quick Reference Checklist

Before extracting a file, verify:

- [ ] AI provided Stage 1 analysis (current state + proposal)
- [ ] User articulated pain point (not just "it's big")
- [ ] User chose scope (surgical/moderate/ambitious)
- [ ] User shared 6-month vision (helps guide structure)
- [ ] User stated trade-off preference (testability/navigation/speed)
- [ ] AI proposed detailed plan with file structure
- [ ] User approved plan (or requested changes)
- [ ] Extraction tracked in Memory Bank (why we split, what we learned)
- [ ] Tests exist before extraction, pass after
- [ ] Documentation added to new file (why it exists, how to maintain)
