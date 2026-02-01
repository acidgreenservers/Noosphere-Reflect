# Noosphere Reflect - Metadata Format Standard

## Overview

Noosphere Reflect uses **standardized metadata markers** to identify messages and their content types. The Universal Native Scraper automatically attaches these markers to all exported content.

## Metadata Markers

### User Message Marker
```
## Prompt:
```

Used to identify user/human input messages in exported content.

### AI Response Marker
```
## Response:
```

Used to identify AI/assistant response messages in exported content.

### Thought Block Markers
```
<thoughts>

... thinking content ...

</thoughts>
```

Used to wrap Claude or Gemini thinking/reasoning processes in the User interface for previews.

### Attribution Footer
```
*Exported by Noosphere Reflect - Universal Native Scraper v2.0*
*Platform: [platform] | Tool Version: Universal Native*
```

Identifies the export source and tool version.

---

## Export Format Examples

### Markdown Format

```markdown
# Chat Title

**Platform:** Claude | **Date:** Jan 12, 2026
**Source:** [Source Chat](https://...)
**Tags:** claude, export

---

## Prompt:
What is machine learning?

---

## Response:
<thoughts>

The user is asking for an explanation of machine learning. I should provide a clear, comprehensive answer covering the basics.

</thoughts>

Machine learning is a subset of artificial intelligence that...

---

## Prompt:
Can you give me an example?

---

## Response:
Sure! Here's a practical example...

---

*Exported by Noosphere Reflect - Universal Native Scraper v2.0*
*Platform: claude | Tool Version: Universal Native*
```

### JSON Format

```json
{
  "messages": [
    {
      "type": "prompt",
      "marker": "## Prompt:",
      "content": "What is machine learning?",
      "timestamp": "2026-01-12T22:30:00Z",
      "isEdited": false,
      "platform": "claude"
    },
    {
      "type": "response",
      "marker": "## Response:",
      "content": "<thoughts>\nThe user is asking...\n</thoughts>\n\nMachine learning is a subset...",
      "timestamp": "2026-01-12T22:30:05Z",
      "isEdited": false,
      "platform": "claude"
    }
  ],
  "metadata": {
    "title": "Chat Title",
    "model": "Claude",
    "date": "2026-01-12T22:36:00Z",
    "tags": ["claude", "export"],
    "sourceUrl": "https://claude.ai/chat/...",
    "platform": "claude"
  },
  "exportedBy": {
    "tool": "Noosphere Reflect",
    "version": "Universal Native Scraper v2.0",
    "method": "native-copy-button-intercept",
    "noosphereMetadata": {
      "userMarker": "## Prompt - [Username]:",
      "aiMarker": "## Response - [Model]:",
      "thoughtMarker": "<thoughts>",
      "thoughtMarkerEnd": "</thoughts>"
    }
  }
}
```

---

## How the Scraper Uses These Markers

### Collection Phase
1. User clicks native copy button on a message
2. Script extracts message text
3. Determines if message is user prompt or AI response
4. **Attaches appropriate marker** (`## Prompt:` or `## Response:`)
5. **Extracts thought blocks** if present (`<thought>...</thought>`)
6. Stores with full metadata

### Export Phase

#### For Markdown Export:
```javascript
// Each message formatted as:
${marker}
${thoughtBlock}   // if present
${content}
---
```

#### For JSON Export:
```javascript
// Each message includes:
{
  "marker": "## Prompt:",
  "content": "...",
  // ... other metadata
}
```

Plus metadata block includes marker definitions:
```javascript
"noosphereMetadata": {
  "userMarker": "## Prompt:",
  "aiMarker": "## Response:",
  "thoughtMarker": "<thought>",
  "thoughtMarkerEnd": "</thought>"
}
```

---

## Compatibility with Converters

The Noosphere converter (`converterService.ts`) expects exactly this format:

```javascript
// Converter detection logic:
if (line.startsWith('## Prompt:')) {
  // Parse as user message
}
if (line.startsWith('## Response:')) {
  // Parse as AI response
}
if (line.includes('<thought>')) {
  // Extract and preserve thought block
}
```

---

## Message Format Preservation

### Thought Blocks (Claude & Gemini)

When a message contains thinking/reasoning:

```markdown
## Response:
<thoughts>

This is my reasoning process for solving this problem...
- First I considered...
- Then I realized...
- Finally I concluded...

</thoughts>

Here's my actual response based on that thinking...
```

The scraper:
1. **Detects** `<thought>...</thought>` blocks in message content
2. **Extracts** the thoughts separately
3. **Preserves** the wrapper tags
4. **Keeps** the actual response content below the thoughts
5. **Maintains** proper formatting in all exports

### Multi-line Content

```markdown
## Response:
This response spans multiple lines
with code blocks, lists, and formatting:

- Item 1
- Item 2
  - Nested item

```python
def example():
    return "code preserved"
```
```

The scraper preserves all:
- Line breaks and whitespace
- Code blocks with language markers
- Lists and nested structures
- Links and formatting

---

## Attribution & Tracking

Every export includes footer attribution:

```markdown
*Exported by Noosphere Reflect - Universal Native Scraper v2.0*
*Platform: [platform] | Tool Version: Universal Native*
```

This includes:
- **Tool name** - "Noosphere Reflect"
- **Component** - "Universal Native Scraper"
- **Version** - "v2.0"
- **Platform** - Which AI platform (claude, chatgpt, gemini, lechat, grok)
- **Tool version type** - "Universal Native" (vs platform-specific)

---

## Metadata Fields Reference

### Per-Message Metadata

| Field | Example | Purpose |
|-------|---------|---------|
| `type` | "prompt" \| "response" | Message role |
| `marker` | "## Prompt:" \| "## Response:" | Noosphere marker |
| `content` | "Message text..." | Actual message content |
| `timestamp` | "2026-01-12T22:30:00Z" | ISO 8601 timestamp |
| `isEdited` | false | Whether user edited message |
| `platform` | "claude" | Source platform |

### Conversation Metadata

| Field | Example | Purpose |
|-------|---------|---------|
| `title` | "Chat Title" | Conversation title |
| `model` | "Claude" \| "ChatGPT" | AI model/platform |
| `date` | "2026-01-12T..." | Export date |
| `tags` | ["claude", "export"] | Categorization tags |
| `sourceUrl` | "https://claude.ai/..." | Original conversation URL |
| `platform` | "claude" | Platform identifier |

### Export Metadata

| Field | Example | Purpose |
|-------|---------|---------|
| `tool` | "Noosphere Reflect" | Application name |
| `version` | "Universal Native Scraper v2.0" | Version info |
| `method` | "native-copy-button-intercept" | Collection method |
| `noosphereMetadata` | {...} | Marker definitions |

---

## Why This Format?

### Machine-Readable
- Clear markers for automated parsing
- Standardized across all platforms
- Easy to validate and transform

### Human-Readable
- Markdown exports are clean and scannable
- Headers (`## Prompt:`, `## Response:`) are obvious
- Thought blocks are visually distinct

### Platform-Agnostic
- Works with Claude, ChatGPT, Gemini, LeChat, Grok
- Handles platform differences (thinking blocks, etc.)
- Gracefully handles missing metadata

### Converter-Compatible
- Direct integration with Noosphere Reflect converters
- No transformation needed
- Full fidelity preservation

---

## Integration Examples

### Using Exported JSON in Custom Scripts

```javascript
// Load exported JSON
const exported = JSON.parse(clipboardContent);

// Access marker definitions
const userMarker = exported.exportedBy.noosphereMetadata.userMarker;
// → "## Prompt:"

const aiMarker = exported.exportedBy.noosphereMetadata.aiMarker;
// → "## Response:"

// Process messages with markers
exported.messages.forEach(msg => {
  console.log(msg.marker);  // "## Prompt:" or "## Response:"
  console.log(msg.content); // Full message text with <thought> if present
});
```

### Using Exported Markdown with Converters

```markdown
# My Chat

## Prompt:
First user message

## Response:
<thoughts>

Thinking about the user's question...

</thoughts>

First AI response

## Prompt:
Follow-up question

## Response:
Follow-up response
```

→ Paste directly into Noosphere Reflect Basic Converter

---

## Validation

Exported content is valid if it contains:

✅ **Required:**
- At least one `## Prompt:` marker
- At least one `## Response:` marker
- Actual message content after each marker

✅ **Optional:**
- `<thought>...</thought>` blocks in responses
- Multiple message pairs
- Attribution footer

❌ **Invalid:**
- Missing markers entirely
- Mismatched thought tags
- Empty content after markers

---

## Future Extensions

Possible additions to metadata format:

- `## Thinking:` marker for explicit reasoning blocks
- Message IDs for linking/referencing
- Edit history tracking
- User/AI speaker names
- Confidence scores or ratings
- Integration tags for external systems

---

## Version History

- **v2.0** (Jan 12, 2026) - Universal Native Scraper
  - Standardized markers: `## Prompt:`, `## Response:`
  - Thought block support: `<thought>...</thought>`
  - Attribution footer
  - JSON metadata structure

- **v1.0** (Previous) - Platform-specific scrapers
  - Basic message extraction
  - Limited metadata

---

## Related Documentation

- `QUICKSTART.md` - How to use the scraper
- `NATIVE-BUTTON-STRATEGY.md` - Technical architecture
- `/src/services/converterService.ts` - Converter implementation
- `/reference-html-dom/MESSAGE-DETECTION-PATTERNS.md` - DOM patterns

---

**Last Updated:** January 12, 2026
**Status:** ✅ Production Standard
