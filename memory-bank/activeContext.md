# Active Context

## Current Work Focus
Refining the specialized parsers (LeChat, Claude) to handle complex HTML structures, ensuring full fidelity exports (tables, lists, thought blocks) and exploring further enhancements for the reading experience.

## Recent Changes
## Recent Changes
- **Claude Parser Refinement**: Enhanced with deep DOM support for "Viewed memory edits", Action steps (Creating/Running/Reading), Artifacts, and specialized code snippet structures. Robust sidebar filtering added.
- **LeChat (Mistral) Support**: Implemented `ParserMode.LeChatHtml` with support for "Reasoning" blocks, "Tool Executions", "Context Badges", and "Searched Libraries".
- **Full HTML Fidelity**: Upgraded `extractMarkdownFromHtml` to convert HTML lists, tables, links, and formatting back to Markdown, serving all parser modes.
- **Inline Editing**: Added "Edit" functionality for messages before export, with an "(Edited)" badge.
- **Layout Fixes**: Resolved layout issues caused by unescaped HTML in code blocks for LeChat exports.
- **Tailwind Mitigation**: Successfully migrated to Tailwind v4.
- **Service Layer**: Robust `converterService.ts` supporting multiple specialized parser modes.

## Next Steps
1.  **Refine Export Styling**: Ensure the generated HTML is as beautiful as the source logs.
2.  **Add More Parsers**: Investigate other AI chat exports (ChatGPT, etc.) if requested.
3.  **Final Polish**: Review all UI elements for consistency.

## Active Decisions
- **Architecture**: Split approach (Option B) chosen over unified UI.
- **Styling**: Tailwind v4 is the standard. Design language is "Premium Dark/Glassmorphism".
- **State Management**: LocalStorage is used for saving sessions.
- **Parser Architecture**: Specialized parsers (Llamacoder, Claude, LeChat) added seamlessly alongside Basic/AI modes.
