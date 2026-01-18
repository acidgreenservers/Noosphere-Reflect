# Noosphere Reflect: Governance & Protocols

This directory contains the core governance documents that guide development, architecture decisions, and AI-human collaboration on this project.

---

## 📋 Core Protocols (In Reading Order)

### 1. **COMPARTMENTALIZATION_PROTOCOL.md** 🤝
**The Collaboration Framework**

When to extract code, how humans and AI make architectural decisions together.

**Use when**:
- You think "this file is too big"
- You want to extract a feature into its own module
- You need to decide between 2 architectural approaches
- You're adding a new platform/parser/exporter

**Key Concepts**:
- Two-stage decision process (AI analysis → Human decision)
- 4 questions that align refactoring with project goals
- Anti-patterns to avoid
- Documentation requirements for extracted files

**Example**: "Should we extract the Gemini parser?" → Follow this protocol to decide collaboratively.

---

### 2. **REFACTOR_SCAN.md** 🔍
**The Diagnostic Tool**

Systematically identify monolithic files, cascading risks, and refactoring opportunities.

**Use when**:
- At project kickoff (understand current state)
- After major feature (check if debt introduced)
- Quarterly review (track health)
- Before refactoring (validate scope)

**Key Concepts**:
- 3-lens analysis (Size/Complexity, Coupling, State Management)
- Risk assessment matrix
- Metrics dashboard (current vs. projected)
- Re-scan frequency & triggers

**Example**: Run the scan, identify that converterService.ts is 2,929 lines with 11+ imports → schedule Phase 1 (Parser Extraction).

---

### 3. **REFACTOR_ROADMAP_CUSTOMIZED.md** 🗺️
**Your Personalized Action Plan**

The complete 8-phase refactoring plan tailored to your priorities.

**Use when**:
- Starting the refactoring (Phase 1)
- Checking timeline (how long each phase takes)
- Understanding architecture trade-offs
- Tracking progress through phases

**Key Concepts**:
- 8 phases from "Parsers" to "Tests & Documentation"
- Exact file structure for each phase
- Implementation steps with line numbers
- Success metrics per phase

**Example**: Starting Phase 1, you know exactly:
- Which files to create
- What moves from converterService.ts
- Which imports need updating
- Why this fixes cascading failures

---

## 🔗 How They Work Together

```
REFACTOR_SCAN.md identifies the problem
        ↓
COMPARTMENTALIZATION_PROTOCOL guides the decision
        ↓
REFACTOR_ROADMAP_CUSTOMIZED provides the action plan
        ↓
You execute Phase 1, then Phase 2, etc.
        ↓
REFACTOR_SCAN.md again (quarterly) to verify health
```

---

## 📚 Other Governance Files (In CLAUDE.md)

These are referenced in `/home/dietpi/Documents/VSCodium/GitHub/Noosphere-Reflect/CLAUDE.md`:

| File | Purpose |
|------|---------|
| **AI_COLLABORATION_PROTOCOL** | Role boundaries, handoff procedures, conflict resolution |
| **CODING_STANDARDS_PROTOCOL** | Code style, React/TypeScript patterns, security gates |
| **DESIGN_SYSTEM_PROTOCOL** | Noosphere Nexus visual standards |
| **EXTENSION_BRIDGE_PROTOCOL** | Chrome extension communication patterns |
| **MEMORY_BANK_PROTOCOL** | Context persistence across sessions |
| **QA_TESTING_PROTOCOL** | Security and regression testing |
| **RELEASE_PROTOCOL** | Version management and deployment |

---

## 🎯 Quick Start

### For Architecture Decisions
1. Read **COMPARTMENTALIZATION_PROTOCOL.md**
2. Answer the 4 key questions (pain point, scope, vision, trade-offs)
3. Wait for AI analysis + personalized proposal
4. Execute using **REFACTOR_ROADMAP_CUSTOMIZED.md**

### For Technical Debt Review
1. Run **REFACTOR_SCAN.md**
2. Identify Red/Yellow files
3. Prioritize using the risk matrix
4. Plan next quarter's refactoring

### For Individual Features
1. Check if file is in Red/Yellow list
2. If yes, consider extracting first
3. If no, implement feature safely
4. Document why if you don't extract

---

## 🚀 Current Refactoring Status

**Phase**: Planning (User approved full sprint)
**Timeline**: 8 weeks, ~155 hours
**Pain Point**: Cascading failures when fixing parsers/exporters
**Vision**: Simple, navigable codebase (understand by reading 2-3 files)

**Next Steps**:
1. ✅ Identify critical files (converterService, ArchiveHub, BasicConverter)
2. ✅ Plan 8 phases (parsers → exporters → storage → hooks → modals → components → types → tests)
3. ⏳ Phase 1: Parser Extraction (25h) — Ready to begin

---

## 💡 Key Philosophy

> **Architecture decisions require two minds.**
>
> AI analyzes patterns; humans understand vision.
> Together, we build systems that scale with the codebase.

This is why all three protocols exist:
- **Scan** = AI can identify problems
- **Protocol** = Humans provide context, vision, trade-offs
- **Roadmap** = Structured execution plan

---

## 📖 Reading Order (Recommended)

1. **REFACTOR_SCAN.md** (understand current state) — 15 min
2. **COMPARTMENTALIZATION_PROTOCOL.md** (learn process) — 20 min
3. **REFACTOR_ROADMAP_CUSTOMIZED.md** (see your plan) — 15 min
4. **CLAUDE.md** (understand other governance) — 30 min

**Total**: ~80 minutes to understand entire governance framework

---

## 🔄 Review & Update Schedule

- **Weekly**: Check for new monolithic files (> 500 lines)
- **Monthly**: Run REFACTOR_SCAN.md, update metrics
- **Per-phase**: Review and update REFACTOR_ROADMAP_CUSTOMIZED.md progress
- **Quarterly**: Full architectural review, adjust future phases

---

## ❓ Common Questions

**Q: What if my pain point doesn't match the refactoring phases?**
A: Answer the 4 questions in COMPARTMENTALIZATION_PROTOCOL, and we'll customize the roadmap.

**Q: Can we do a smaller refactoring (just one parser)?**
A: Yes! Use COMPARTMENTALIZATION_PROTOCOL to decide scope. The roadmap is flexible.

**Q: How do we know if refactoring is working?**
A: Run REFACTOR_SCAN.md quarterly. Metrics should improve (fewer critical files, better test coverage).

**Q: What if new architectural debt appears while refactoring?**
A: Run REFACTOR_SCAN.md, add to roadmap, adjust priorities.

**Q: Can I refactor without this protocol?**
A: You can, but you'll likely miss hidden dependencies, create new circular imports, or introduce untested code. The protocol exists to prevent these issues collaboratively.

---

## 🎓 Learning Path

This governance system teaches you:

1. **How to identify architectural problems** (REFACTOR_SCAN)
2. **How to make decisions collaboratively** (COMPARTMENTALIZATION_PROTOCOL)
3. **How to execute systematically** (REFACTOR_ROADMAP)
4. **How to avoid cascading failures** (CLAUDE.md protocols)

Over time, you'll internalize these patterns and make better architectural decisions automatically.

---

**Next**: Ready to start Phase 1? Just say "Let's begin Phase 1" and we'll extract the parsers! 🚀
