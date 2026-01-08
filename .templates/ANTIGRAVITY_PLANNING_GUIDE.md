# Antigravity Planning Methodology Guide

**For AI Assistants: How to Implement Structured Planning & Documentation**

---

## Overview

This guide teaches AI assistants how to implement Antigravity's structured planning methodology. This approach emphasizes clarity, thoroughness, and systematic execution through three core artifacts:

1. **Implementation Plans** - Pre-work planning documents
2. **Tasks** - Granular work tracking with checklists
3. **Walkthroughs** - Post-work documentation of what was accomplished

---

## Core Philosophy

### Principles

1. **Plan Before Acting**: Always create an implementation plan before making changes
2. **Document Everything**: Maintain clear records of decisions and changes
3. **Be Specific**: Avoid vague descriptions; use concrete examples and code snippets
4. **Think Systematically**: Break complex work into manageable pieces
5. **Verify Thoroughly**: Test edge cases and verify success criteria
6. **Learn Continuously**: Document lessons learned for future reference

### When to Use Each Artifact

| Artifact | When to Create | Purpose |
|----------|----------------|---------|
| **Implementation Plan** | Before starting work | Design and plan the approach |
| **Task** | When tracking work items | Monitor progress and ensure completion |
| **Walkthrough** | After completing work | Document what was done and how |

---

## Part 1: Implementation Plans

### Purpose
Implementation plans are **pre-work** documents that force you to think through the entire solution before writing code. They prevent hasty implementations and catch design flaws early.

### Structure

#### 1. Problem Statement
**What to include**:
- Current broken/missing functionality
- User pain points
- Root cause analysis
- Expected outcome

**Example**:
```markdown
## Problem Statement

The artifact manager uses manual mode for all sessions, preventing database 
writes when users load existing sessions. This causes artifacts to reappear 
after deletion because changes aren't persisted to IndexedDB.

**Root Cause**: The component doesn't distinguish between new (unsaved) 
sessions and loaded (persisted) sessions.

**Expected Outcome**: Artifacts should persist to database for loaded sessions 
while remaining in-memory for new sessions.
```

**Why this matters**: Forces you to understand the problem deeply before proposing solutions.

---

#### 2. Proposed Solution

**What to include**:
- High-level strategy (1-2 sentences)
- Key design decisions with rationale
- Alternatives considered and why they were rejected
- Trade-offs of your chosen approach

**Example**:
```markdown
## Proposed Solution

### Strategy
Implement conditional manual mode based on whether a session is loaded from 
the database or newly created.

### Key Design Decisions

1. **Track Session Provenance via State**
   - **Rationale**: Simple boolean flag is insufficient; we need the actual 
     session ID to pass to storage service
   - **Alternative Considered**: Use a boolean `isNewSession` flag
   - **Trade-offs**: Storing the ID adds one state variable but enables 
     direct database operations without ID lookup

2. **Mode Selection at Component Level**
   - **Rationale**: Parent component knows session provenance; child 
     component shouldn't need to determine it
   - **Alternative Considered**: Let ArtifactManager detect if session exists 
     in database
   - **Trade-offs**: Requires async database query on every render; current 
     approach is synchronous and clearer
```

**Why this matters**: Documents your reasoning so future you (or others) understand why decisions were made.

---

#### 3. Proposed Changes

**What to include**:
- Every file you'll modify
- Specific line numbers or sections
- Before/after code snippets
- Rationale for each change

**Format**:
```markdown
### File: `src/components/ArtifactManager.tsx`

#### Change 1: Add Manual Mode Prop

**Location**: Lines 6-10 (interface definition)

**Current Code**:
```typescript
interface ArtifactManagerProps {
  session: SavedChatSession;
  messages: ChatMessage[];
  onArtifactsChange: () => void;
}
```

**Proposed Code**:
```typescript
interface ArtifactManagerProps {
  session: SavedChatSession;
  messages: ChatMessage[];
  onArtifactsChange: (artifacts: ConversationArtifact[]) => void;
  manualMode?: boolean; // NEW: Skip database writes if true
}
```

**Rationale**: 
- `manualMode` prop allows parent to control persistence behavior
- Updated callback signature passes artifacts array for manual mode sync
- Optional prop maintains backward compatibility
```

**Why this matters**: Provides a clear roadmap for implementation; you can code directly from this plan.

---

#### 4. Verification Plan

**What to include**:
- Specific test scenarios with steps
- Edge cases to verify
- Expected vs actual results
- Regression testing checklist

**Example**:
```markdown
## Verification Plan

### Manual Testing Steps

1. **Test: Loaded Session Artifact Deletion**
   - **Setup**: Load session from hub with 3 artifacts
   - **Action**: Open artifact manager in generator, delete 1 artifact
   - **Expected**: Artifact removed from database immediately
   - **Verify**: Navigate to hub, only 2 artifacts shown
   - **Actual**: [Fill in after testing]

2. **Test: New Session Artifact Upload**
   - **Setup**: Create new chat in generator
   - **Action**: Upload artifact via manager
   - **Expected**: Artifact in memory only, not in database
   - **Verify**: Check IndexedDB, artifact should not exist
   - **Actual**: [Fill in after testing]

### Edge Cases
- [ ] Load session without artifacts
- [ ] Clear form after loading session (should reset mode)
- [ ] Switch between multiple loaded sessions
- [ ] Save new session with in-memory artifacts
```

**Why this matters**: Ensures you don't forget to test critical scenarios; provides QA checklist.

---

### Implementation Plan Best Practices

1. **Be Exhaustive**: List every file you'll touch, even for one-line changes
2. **Show Code**: Don't just describe changes; show actual code snippets
3. **Explain Why**: Every change should have a rationale
4. **Think Ahead**: Include rollback plan and risk mitigation
5. **Get Specific**: "Update the function" → "Update `handleSubmit` function lines 45-67 to add validation"

---

## Part 2: Tasks

### Purpose
Tasks are **work-tracking** documents that break down implementation into concrete, checkable steps. They ensure nothing is forgotten and provide progress visibility.

### Structure

#### 1. Objective
**Single sentence** describing what needs to be accomplished.

**Good**: "Implement conditional manual mode for ArtifactManager to enable database persistence for loaded sessions"

**Bad**: "Fix artifact bug" (too vague)

---

#### 2. Acceptance Criteria
**Specific, testable** conditions for completion.

**Format**:
```markdown
- [ ] **Criterion**: Artifacts uploaded in generator persist to database when session is loaded
  - **How to Verify**: Load session, upload artifact, navigate to hub, verify artifact appears

- [ ] **Criterion**: New sessions use in-memory artifact management
  - **How to Verify**: Create new session, upload artifact, verify not in database until saved

- [ ] **Criterion**: No regressions in hub artifact management
  - **How to Verify**: Upload/delete artifacts in hub, verify all operations work
```

**Why this matters**: Provides clear definition of "done"; prevents scope creep.

---

#### 3. Implementation Checklist
**Granular steps** organized by phase.

**Example**:
```markdown
### Planning Phase
- [ ] Review existing ArtifactManager code
- [ ] Identify all files to modify (BasicConverter, ArtifactManager, ArchiveHub)
- [ ] Create implementation plan
- [ ] Get plan reviewed

### Development Phase
- [ ] Add `loadedSessionId` state to BasicConverter
- [ ] Update `loadSession` to track session ID
- [ ] Update `clearForm` to reset session ID
- [ ] Add `manualMode` prop to ArtifactManager
- [ ] Update `onArtifactsChange` callback signature
- [ ] Implement conditional storage calls in ArtifactManager

### Testing Phase
- [ ] Manual test: Loaded session artifact deletion
- [ ] Manual test: New session artifact upload
- [ ] Manual test: Session switching
- [ ] Edge case: Load session without artifacts
- [ ] Regression: Hub artifact management still works
```

**Why this matters**: Breaks overwhelming work into manageable steps; provides sense of progress.

---

#### 4. Progress Log
**Daily updates** on what was accomplished.

**Format**:
```markdown
### 2026-01-07
- Completed planning phase
- Implemented `loadedSessionId` state tracking
- Updated `loadSession` and `clearForm` functions
- **Issue Encountered**: TypeScript error on callback signature
- **Resolution**: Updated interface definition to match new signature
- **Next**: Implement ArtifactManager conditional logic

### 2026-01-08
- [Continue pattern...]
```

**Why this matters**: Creates audit trail; helps debug issues; shows velocity.

---

### Task Best Practices

1. **One Task, One Feature**: Don't combine unrelated work
2. **Checkboxes Everywhere**: Make progress visible and satisfying
3. **Update Regularly**: Log progress daily, even if small
4. **Track Blockers**: Document what's preventing progress
5. **Link Resources**: Include links to docs, examples, related issues

---

## Part 3: Walkthroughs

### Purpose
Walkthroughs are **post-work** documents that explain what was accomplished and how it works. They serve as documentation for future developers and as knowledge transfer.

### Structure

#### 1. Summary
**2-3 sentences** explaining what was done and why.

**Example**:
```markdown
## Summary

Implemented bidirectional artifact synchronization between Hub and Generator 
pages by introducing conditional manual mode in the ArtifactManager component. 
The fix ensures artifact changes persist correctly to IndexedDB when working 
with loaded sessions while maintaining in-memory behavior for new sessions.
```

**Why this matters**: Provides quick context without reading entire document.

---

#### 2. Changes Made
**Detailed breakdown** of each modification.

**Format**:
```markdown
### 1. Session Tracking in BasicConverter

#### Files Modified
- `src/pages/BasicConverter.tsx`

#### Detailed Changes

**Added State Variable** (Line 96)
```typescript
const [loadedSessionId, setLoadedSessionId] = useState<string | null>(null);
```

**Rationale**: Track whether current session is loaded from database to 
determine ArtifactManager mode.

**Updated loadSession Function** (Line 99)
```typescript
const loadSession = useCallback((session: SavedChatSession) => {
    setLoadedSessionId(session.id); // NEW: Track session ID
    // ... rest of loading logic
}, []);
```

**Rationale**: Capture session ID when loading from hub to enable database mode.
```

**Why this matters**: Future developers can understand exactly what changed and why.

---

#### 3. How It Works
**User-facing flow** explaining the feature.

**Example**:
```markdown
## How It Works

### User Flow

1. **User loads session from hub**
   - System sets `loadedSessionId` to session's database ID
   - ArtifactManager receives `manualMode={false}`
   - Artifact operations write directly to IndexedDB

2. **User creates new chat**
   - System leaves `loadedSessionId` as `null`
   - ArtifactManager receives `manualMode={true}`
   - Artifact operations update in-memory state only

3. **User saves new chat**
   - System persists session with in-memory artifacts
   - On next load, session ID is tracked and database mode activates
```

**Why this matters**: Non-technical stakeholders can understand the feature.

---

#### 4. Verification
**Proof that it works** with test results.

**Format**:
```markdown
## Verification

### Manual Testing Performed
- [x] **Loaded Session Artifact Deletion**
  - **Result**: ✅ Pass
  - **Notes**: Artifact removed from database immediately; persists after modal close

- [x] **New Session Artifact Upload**
  - **Result**: ✅ Pass
  - **Notes**: Artifact in memory only until session saved

### Edge Cases Tested
- [x] Load session without artifacts → No errors
- [x] Switch between sessions → Correct artifacts for each
- [x] Clear form after loading → Mode resets correctly
```

**Why this matters**: Demonstrates thoroughness; provides regression test suite.

---

### Walkthrough Best Practices

1. **Write Immediately**: Create walkthrough right after completing work while fresh
2. **Include Code**: Show actual code snippets, not just descriptions
3. **Explain Decisions**: Document why you chose specific approaches
4. **Be Honest**: Include limitations and known issues
5. **Think Future**: Write for someone who knows nothing about the feature

---

## Workflow Integration

### The Complete Cycle

```
1. USER REQUEST
   ↓
2. CREATE IMPLEMENTATION PLAN
   - Analyze problem
   - Design solution
   - Plan changes
   - Define verification
   ↓
3. CREATE TASK
   - Set acceptance criteria
   - Build checklist
   - Estimate effort
   ↓
4. IMPLEMENT
   - Follow plan
   - Check off task items
   - Log progress
   ↓
5. VERIFY
   - Run tests from plan
   - Check acceptance criteria
   - Test edge cases
   ↓
6. CREATE WALKTHROUGH
   - Document changes
   - Explain how it works
   - Record test results
   ↓
7. COMPLETE
   - Mark task done
   - Update changelog
   - Notify stakeholders
```

---

## Example Workflow

### Scenario: User Reports Bug

**Step 1: Understand the Problem**
```
User: "Artifacts I delete in the generator keep coming back!"
```

**Step 2: Create Implementation Plan**
- Investigate root cause (manual mode prevents persistence)
- Design solution (conditional manual mode)
- Plan specific code changes
- Define test scenarios

**Step 3: Create Task**
- Objective: Fix artifact persistence bug
- Acceptance criteria: Deletions persist, no regressions
- Checklist: Planning, development, testing, documentation phases

**Step 4: Implement**
- Add `loadedSessionId` state
- Update `loadSession` and `clearForm`
- Modify ArtifactManager props
- Implement conditional logic
- Check off task items as you go

**Step 5: Verify**
- Test loaded session deletion → ✅ Works
- Test new session upload → ✅ Works
- Test edge cases → ✅ All pass
- Regression test hub → ✅ No issues

**Step 6: Create Walkthrough**
- Document all changes made
- Explain conditional mode logic
- Show test results
- Note any limitations

**Step 7: Complete**
- Mark task complete
- Update changelog
- Inform user bug is fixed

---

## Tips for AI Assistants

### Do's

✅ **Be Thorough**: Better to over-document than under-document  
✅ **Use Examples**: Show concrete code, not abstract descriptions  
✅ **Think Ahead**: Anticipate edge cases and failure modes  
✅ **Stay Organized**: Use consistent formatting and structure  
✅ **Update Regularly**: Keep documents current as work progresses  
✅ **Link Everything**: Connect related plans, tasks, and walkthroughs  
✅ **Explain Why**: Always provide rationale for decisions  
✅ **Test Thoroughly**: Verify edge cases, not just happy paths  

### Don'ts

❌ **Don't Be Vague**: "Update the function" → Specify which function, which lines  
❌ **Don't Skip Steps**: Even obvious steps should be in checklists  
❌ **Don't Assume**: Explicitly state assumptions and verify them  
❌ **Don't Rush**: Planning time saves debugging time  
❌ **Don't Forget Edge Cases**: Test unusual scenarios  
❌ **Don't Leave Gaps**: If you don't know something, document the question  
❌ **Don't Skip Documentation**: Future you will thank present you  

---

## Quality Checklist

Before considering any artifact complete, verify:

### Implementation Plans
- [ ] Problem clearly stated with root cause
- [ ] Solution strategy explained in 1-2 sentences
- [ ] All files to modify listed with specific changes
- [ ] Code snippets shown for before/after
- [ ] Rationale provided for each change
- [ ] Verification plan includes specific test steps
- [ ] Edge cases identified
- [ ] Rollback plan included

### Tasks
- [ ] Objective is single, clear sentence
- [ ] Acceptance criteria are specific and testable
- [ ] Implementation checklist covers all phases
- [ ] Progress log updated regularly
- [ ] Blockers documented if any
- [ ] Resources linked
- [ ] Estimates provided

### Walkthroughs
- [ ] Summary explains what and why
- [ ] All changes documented with code snippets
- [ ] How it works section explains user flow
- [ ] Verification section shows test results
- [ ] Known limitations documented
- [ ] Files modified summary included
- [ ] Next steps identified

---

## Customization

### Adapting to Your Project

These templates are **starting points**. Customize them:

1. **Add Sections**: Include project-specific sections (e.g., "Security Review", "Performance Metrics")
2. **Remove Sections**: Skip sections that don't apply to your workflow
3. **Adjust Detail Level**: Scale up/down based on task complexity
4. **Modify Format**: Adapt markdown structure to your tools
5. **Extend Checklists**: Add project-specific checklist items

### Example Customizations

**For Security-Critical Projects**:
```markdown
## Security Review
- [ ] Input validation implemented
- [ ] XSS prevention verified
- [ ] SQL injection tests passed
- [ ] Authentication/authorization checked
- [ ] Secrets not exposed in logs
```

**For Performance-Critical Projects**:
```markdown
## Performance Metrics
- **Before**: [Baseline measurements]
- **After**: [New measurements]
- **Improvement**: [Percentage/absolute change]
- **Regression**: [Any slowdowns]
```

---

## Conclusion

This methodology emphasizes:
1. **Planning** before acting
2. **Tracking** during execution
3. **Documenting** after completion

By following this structured approach, you'll:
- Make fewer mistakes
- Catch issues earlier
- Produce better documentation
- Enable easier collaboration
- Build institutional knowledge

**Remember**: The goal isn't bureaucracy—it's **clarity, quality, and continuity**.

---

## Templates Location

All templates are available in `.templates/`:
- `IMPLEMENTATION_PLAN_TEMPLATE.md`
- `TASK_TEMPLATE.md`
- `WALKTHROUGH_TEMPLATE.md`

Copy and customize as needed for your projects!

---

**Guide Version**: 1.0  
**Last Updated**: 2026-01-07  
**Author**: Antigravity (Google DeepMind)
