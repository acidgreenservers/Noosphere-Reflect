# Task Template

## Task Overview

**Task Name**: [Clear, action-oriented name]  
**Priority**: [High/Medium/Low]  
**Status**: [Not Started/In Progress/Blocked/Complete]  
**Assigned To**: [Name/AI/Team]  
**Due Date**: [YYYY-MM-DD or "Flexible"]

---

## Objective

[Single sentence describing what needs to be accomplished]

**Example**:
> Implement conditional manual mode for the ArtifactManager to enable database persistence for loaded sessions while maintaining in-memory behavior for new sessions.

---

## Context

### Why This Task Exists
[Explain the background and motivation]

**Example**:
> Users reported that artifacts deleted in the generator page reappear after closing the modal. Investigation revealed that the ArtifactManager always uses manual mode, preventing database writes for loaded sessions.

### Related Work
- **Depends On**: [List tasks that must be completed first]
- **Blocks**: [List tasks that are waiting for this]
- **Related To**: [List related but non-blocking tasks]

---

## Acceptance Criteria

Define specific, measurable criteria for completion:

- [ ] **Criterion 1**: [Specific outcome]
  - **How to Verify**: [Concrete test steps]
  
- [ ] **Criterion 2**: [Another outcome]
  - **How to Verify**: [Test steps]

- [ ] **Criterion 3**: [Continue pattern...]

**Example**:
- [ ] Artifacts uploaded in generator persist to database when session is loaded
  - **How to Verify**: Load session, upload artifact, navigate to hub, verify artifact appears
  
- [ ] New sessions still use in-memory artifact management
  - **How to Verify**: Create new session, upload artifact, verify not in database until saved

---

## Scope

### In Scope
- [What IS included in this task]
- [Specific features/changes to implement]
- [Specific files to modify]

### Out of Scope
- [What is NOT included]
- [Features deferred to future tasks]
- [Explicitly excluded work]

---

## Implementation Checklist

### Planning Phase
- [ ] Review existing code
- [ ] Identify all files to modify
- [ ] Create implementation plan
- [ ] Get plan reviewed/approved

### Development Phase
- [ ] Implement change 1: [Brief description]
- [ ] Implement change 2: [Brief description]
- [ ] Implement change 3: [Continue...]
- [ ] Add error handling
- [ ] Add input validation
- [ ] Update type definitions (if applicable)

### Testing Phase
- [ ] Write/update unit tests
- [ ] Write/update integration tests
- [ ] Manual testing: Scenario 1
- [ ] Manual testing: Scenario 2
- [ ] Edge case testing
- [ ] Regression testing

### Documentation Phase
- [ ] Update code comments
- [ ] Update README (if needed)
- [ ] Update API docs (if needed)
- [ ] Create walkthrough document
- [ ] Update changelog

### Review Phase
- [ ] Self-review code
- [ ] Run linter
- [ ] Check for console errors
- [ ] Verify no breaking changes
- [ ] Request peer review (if applicable)

---

## Technical Approach

### High-Level Strategy
[Describe the approach in 2-3 sentences]

### Key Components to Modify
1. **Component/File 1**: [What needs to change]
2. **Component/File 2**: [What needs to change]

### Potential Challenges
1. **Challenge**: [What might be difficult]
   - **Mitigation**: [How to address it]

---

## Resources

### Documentation
- [Link to relevant docs]
- [Link to API reference]
- [Link to design patterns]

### Examples
- [Link to similar implementation]
- [Link to reference code]

### Tools Needed
- [Tool/library 1]
- [Tool/library 2]

---

## Estimates

**Complexity**: [1-10 rating]  
**Estimated Time**: [X hours/days]

**Breakdown**:
- Planning: [X hours]
- Implementation: [Y hours]
- Testing: [Z hours]
- Documentation: [W hours]

---

## Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| [Risk 1] | High/Med/Low | High/Med/Low | [How to prevent/handle] |
| [Risk 2] | High/Med/Low | High/Med/Low | [How to prevent/handle] |

---

## Success Metrics

[How will you measure success?]

**Quantitative**:
- [Metric 1]: [Target value]
- [Metric 2]: [Target value]

**Qualitative**:
- [User feedback expectation]
- [Code quality goal]

---

## Notes

### Open Questions
- [ ] Question 1: [What needs clarification]
- [ ] Question 2: [What needs decision]

### Decisions Made
- **Decision 1**: [What was decided]
  - **Date**: [YYYY-MM-DD]
  - **Rationale**: [Why]

### Blockers
- [Blocker 1]: [Description and status]
- [Blocker 2]: [Description and status]

---

## Progress Log

### [YYYY-MM-DD]
- [What was accomplished]
- [Any issues encountered]
- [Next steps]

### [YYYY-MM-DD]
- [Continue pattern...]

---

## Completion Checklist

Before marking this task as complete:

- [ ] All acceptance criteria met
- [ ] All implementation checklist items complete
- [ ] Code reviewed and approved
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Walkthrough document created
- [ ] No known bugs or regressions
- [ ] Stakeholders notified

---

**Task Status**: [Not Started/In Progress/Blocked/Complete]  
**Last Updated**: [YYYY-MM-DD HH:MM]  
**Completion Date**: [YYYY-MM-DD or "N/A"]
