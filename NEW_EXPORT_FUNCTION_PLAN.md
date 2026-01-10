# New Export Function Plan

## Overview
This document outlines the plan to enhance the export functionality in Noosphere Reflect by:
1. Adding model names to exported filenames
2. Creating export metadata JSON files

## Current State Analysis

### Current Export Functionality
- Exports chats as standalone HTML files via `generateHtml()` in `converterService.ts`
- Uses `SavedChatSession` objects containing chat data and metadata
- Supports both single and batch exports
- Current filename format: `{title}.html`

### Current Metadata Structure
```typescript
interface SavedChatSession {
  id: string;
  chatData: ChatData;
  metadata: ChatMetadata;
  // ... other fields
}

interface ChatMetadata {
  title: string;
  model: string; // This is what we'll use for filename prefix
  date: string; // ISO format
  tags: string[];
  author?: string;
  sourceUrl?: string;
  exportedBy?: {
    tool: string;
    version: string;
  };
}
```

## Proposed Changes

### 1. Enhanced File Naming

**Current Format**: `{title}.html`
**New Format**: `[model] - {title}.html`

**Examples**:
- `claude-3-5-sonnet - research-notes.html`
- `gpt-4-turbo - debugging-session.html`
- `gemini-2.0-flash - brainstorming.html`

**Implementation Details**:
- Modify filename generation in export functions
- Use `metadata.model` from `SavedChatSession`
- Handle cases where model might be empty/undefined
- Apply to both single and batch exports

### 2. Export Metadata JSON

**File Name**: `export-metadata.json`
**Location**: Root of export directory
**Format**: JSON with comprehensive but concise metadata

**Proposed Structure**:
```json
{
  "exportDate": "2026-01-10T10:34:23.000Z",
  "exportedBy": {
    "tool": "Noosphere Reflect",
    "version": "0.5.0"
  },
  "chats": [
    {
      "filename": "claude-3-5-sonnet - research-notes.html",
      "originalTitle": "research-notes",
      "model": "claude-3-5-sonnet",
      "exportDate": "2026-01-10T10:34:23.000Z",
      "originalDate": "2026-01-09T14:30:00.000Z",
      "messageCount": 12,
      "artifactCount": 3,
      "tags": ["research", "important"],
      "author": "user@example.com",
      "wordCount": 1842,
      "characterCount": 9876
    }
  ],
  "summary": {
    "totalChats": 1,
    "totalMessages": 12,
    "totalArtifacts": 3,
    "totalWordCount": 1842,
    "exportSizeBytes": 45678,
    "fileCount": 4 // HTML files + metadata + artifacts
  }
}
```

**Implementation Details**:
- Create new function `generateExportMetadata()`
- Collect data during export process
- Calculate statistics (word count, character count, etc.)
- Write JSON file to export directory
- Handle batch exports with multiple chats

## Implementation Plan

### Phase 1: Analysis
- [ ] Read current export implementation in `converterService.ts`
- [ ] Identify all export entry points (single vs batch)
- [ ] Understand current filename generation logic
- [ ] Review existing metadata handling

### Phase 2: File Naming Implementation
- [ ] Create utility function `generateExportFilename(session: SavedChatSession): string`
- [ ] Modify single export functionality
- [ ] Modify batch export functionality
- [ ] Add configuration option for filename format
- [ ] Handle edge cases (empty model, special characters)

### Phase 3: Metadata JSON Implementation
- [ ] Create `generateExportMetadata()` function
- [ ] Implement metadata collection for single exports
- [ ] Implement metadata collection for batch exports
- [ ] Add file writing logic
- [ ] Handle error cases gracefully

### Phase 4: Integration
- [ ] Update UI components that trigger exports
- [ ] Add user-facing options/configuration
- [ ] Update documentation
- [ ] Add feature to changelog

### Phase 5: Testing
- [ ] Test single export with new naming
- [ ] Test batch export with new naming
- [ ] Verify metadata JSON generation
- [ ] Test edge cases (empty fields, special characters)
- [ ] Verify backward compatibility

## Technical Details

### Filename Generation Function
```typescript
function generateExportFilename(session: SavedChatSession): string {
  const safeModel = session.metadata.model
    ?.replace(/[\\/:*?"<>|]/g, '-') // Remove invalid filename characters
    ?.trim();

  const safeTitle = session.metadata.title
    ?.replace(/[\\/:*?"<>|]/g, '-')
    ?.trim();

  if (safeModel && safeTitle) {
    return `${safeModel} - ${safeTitle}.html`;
  } else if (safeTitle) {
    return `${safeTitle}.html`;
  } else {
    return `export-${Date.now()}.html`;
  }
}
```

### Metadata Generation Function
```typescript
async function generateExportMetadata(
  sessions: SavedChatSession[],
  exportDir: string
): Promise<void> {
  const chatMetadata = sessions.map(session => {
    const messageCount = session.chatData.messages.length;
    const artifactCount = session.chatData.artifacts?.length || 0;

    // Calculate word and character counts
    const textContent = session.chatData.messages
      .map(m => m.content)
      .join(' ');
    const wordCount = textContent.split(/\s+/).filter(Boolean).length;
    const characterCount = textContent.length;

    return {
      filename: generateExportFilename(session),
      originalTitle: session.metadata.title,
      model: session.metadata.model,
      exportDate: new Date().toISOString(),
      originalDate: session.metadata.date,
      messageCount,
      artifactCount,
      tags: session.metadata.tags,
      author: session.metadata.author,
      wordCount,
      characterCount
    };
  });

  const metadata = {
    exportDate: new Date().toISOString(),
    exportedBy: {
      tool: 'Noosphere Reflect',
      version: '0.5.0' // Should get from package.json
    },
    chats: chatMetadata,
    summary: {
      totalChats: sessions.length,
      totalMessages: chatMetadata.reduce((sum, chat) => sum + chat.messageCount, 0),
      totalArtifacts: chatMetadata.reduce((sum, chat) => sum + chat.artifactCount, 0),
      totalWordCount: chatMetadata.reduce((sum, chat) => sum + chat.wordCount, 0),
      exportSizeBytes: 0, // Would need to calculate actual export size
      fileCount: sessions.length + 1 // HTML files + metadata JSON
    }
  };

  // Write to file
  const metadataPath = path.join(exportDir, 'export-metadata.json');
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
}
```

## Configuration Options

### User Configurable Settings
```typescript
interface ExportSettings {
  filenameFormat: 'model-prefix' | 'original' | 'timestamp';
  includeMetadata: boolean;
  metadataDetailLevel: 'basic' | 'detailed';
}
```

### Default Settings
```typescript
const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  filenameFormat: 'model-prefix',
  includeMetadata: true,
  metadataDetailLevel: 'basic'
};
```

## Backward Compatibility

### Migration Strategy
1. **Default Behavior**: New format becomes default but can be configured
2. **Settings Migration**: Add migration logic for existing user preferences
3. **Fallback**: If metadata is missing, use original filename format
4. **Version Detection**: Check for existing exports and maintain compatibility

## Error Handling

### Potential Issues and Solutions
1. **Invalid Characters in Model/Title**: Replace with hyphens
2. **Missing Metadata**: Use fallback values or skip problematic fields
3. **File Write Permissions**: Show user-friendly error messages
4. **Large Exports**: Handle memory constraints for metadata generation
5. **Special Characters**: Properly escape in JSON and filenames

## Testing Requirements

### Test Cases
1. **Single Export**: Verify filename and metadata for single chat
2. **Batch Export**: Verify multiple chats with correct metadata
3. **Edge Cases**: Empty model, special characters, long titles
4. **Error Handling**: Permission errors, invalid data
5. **Performance**: Large batch exports with many chats

### Test Data
```typescript
// Test session with full metadata
const testSession: SavedChatSession = {
  id: 'test-123',
  metadata: {
    title: 'Test Chat with Special Chars: /\\',
    model: 'claude-3-5-sonnet',
    date: '2026-01-01T00:00:00.000Z',
    tags: ['test', 'special-chars'],
    author: 'test@example.com'
  },
  chatData: {
    messages: [
      { type: 'prompt', content: 'Hello', isEdited: false },
      { type: 'response', content: 'Hi there!', isEdited: false }
    ],
    artifacts: [
      { name: 'test.txt', content: 'test' }
    ]
  }
};
```

## Integration Points

### UI Integration
1. **Export Dialog**: Add options for filename format and metadata inclusion
2. **Settings Page**: Add export preferences section
3. **Batch Export**: Ensure metadata file is included in zip downloads
4. **Export Status**: Show metadata generation progress

### Documentation Updates
1. **README.md**: Add export features section
2. **CLINE.md**: Update with new export functionality
3. **User Guide**: Add export customization instructions
4. **Changelog**: Document new features

## Future Enhancements

### Potential Additions
1. **Custom Filename Templates**: User-defined patterns
2. **Export Profiles**: Save different export configurations
3. **Metadata Search**: Index metadata for search functionality
4. **Export History**: Track all exports with timestamps
5. **Cloud Sync**: Sync metadata with cloud storage

## Open Questions

1. Should we include the original HTML content in metadata for searchability?
2. Should metadata files be included in batch export zips?
3. Should we add a visual indicator in the UI for the new export format?
4. Should we maintain a global export history across all sessions?

## Next Steps

1. Review and approve this plan
2. Read current export implementation details
3. Create detailed code implementation
4. Implement features
5. Test thoroughly
6. Document changes
7. Release update