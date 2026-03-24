# 🎯 Claude DOM Selector Reference Guide
## Complete Verification of Claude Code's Suggestions vs. Reality

---

## 📊 Summary Statistics

| Category | Working | Not Found | Hit Rate |
|----------|---------|-----------|----------|
| Message Elements | 2/3 | 1/3 | 66% |
| Conversation Structure | 1/5 | 4/5 | 20% |
| Metadata Elements | 0/6 | 6/6 | 0% |
| Code & Artifacts | 4/6 | 2/6 | 66% |
| **TOTAL** | **7/26** | **19/26** | **27%** |

---

## ✅ WORKING SELECTORS

| Selector | Purpose | Count | Notes |
|----------|---------|-------|-------|
| `[data-testid="user-message"]` | User messages | 13 | Reliable |
| `.font-claude-response` | Claude responses | 13 | Best option |
| `[data-test-render-count]` | Message turns | 26 | Groups pairs |
| `.standard-markdown` | Content area | 31 | Text/markup |
| `button.group\/status` | Thought header | - | Claude 3.7+ Reasoning |
| `.flex-col.font-ui` | Thought container | - | Multi-step reasoning |
| `pre.code-block__code` | Code blocks | 219 | Formatted code |
| `pre` | All code blocks | 219 | Generic fallback |
| `[class*="language-"]` | Language tags | 205 | Code language |

---

## ❌ NOT FOUND - Claude Code's Wrong Suggestions (19)

### Message Issues
| Selector | Why It Failed |
|----------|---------------|
| `[data-testid="chat-message-container"]` | Element doesn't exist |
| `[data-testid="assistant-message"]` | Use .font-claude-response instead |
| `[data-message-id]` | No such attribute |

### Conversation Structure (All Failed)
| Selector | Why It Failed |
|----------|---------------|
| `[data-testid="conversation-panel"]` | Different structure used |
| `[data-testid="chat-history"]` | Element doesn't exist |
| `[data-testid="input-area"]` | Element doesn't exist |
| `main[role="main"]` | No main element |
| `[data-conversation-id]` | No such attribute |

### Metadata (0/6 - Complete Failure)
| Selector | Issue |
|----------|-------|
| `[data-timestamp]` | Not in DOM |
| `[data-model-name]` | Not exposed |
| `[data-tokens-used]` | Not exposed |
| `[data-model-config]` | Not exposed |
| `[data-user-id]` | Not available |
| `[data-request-id]` | Not available |

### Artifacts & Extended
| Selector | Issue |
|----------|-------|
| `[data-testid="artifact-container"]` | Not in this chat |
| `[class*="artifact"]` | No artifacts present |
| `[data-file-id]` | Not in DOM |
| `[data-context-window]` | Not in DOM |
| `script[type="application/json"]` | Not in DOM |

---

## 🎯 USE THESE SELECTORS

### Message Extraction
```javascript
const userMessages = document.querySelectorAll('[data-testid="user-message"]');
const claudeResponses = document.querySelectorAll('.font-claude-response');
const messageTurns = document.querySelectorAll('[data-test-render-count]');
```

### Content Extraction
```javascript
const responseContent = document.querySelectorAll('.standard-markdown');
const codeBlocks = document.querySelectorAll('pre.code-block__code');
const tables = document.querySelectorAll('table');
```

---

## 📝 Key Findings

1. **Only 27% accuracy** - Claude Code's suggestions were mostly wrong
2. **No metadata in DOM** - Timestamps, tokens, model info aren't exposed
3. **Your script is better** - Your selectors actually work!
4. **Use class selectors** - data-testid works but data-* metadata attrs don't exist

---

**TLDR:** Use your current selectors. Don't rely on data attributes for metadata.
