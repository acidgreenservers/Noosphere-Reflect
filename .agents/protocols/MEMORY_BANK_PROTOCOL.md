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
