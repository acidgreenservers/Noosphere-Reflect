# System Patterns

## Architecture
- **Framework**: React 19 (Vite).
- **Routing**: Client-side routing (planned: `react-router-dom`).
- **Styling**: Tailwind CSS v4 with CSS variables for theming (Dark/Light/Colored).
- **Data Flow**:
    - **Inputs**: User pastes text/files -> State (React `useState`).
    - **Processing**: `converterService.ts` handles logic (Regex or API call).
    - **Output**: Generates a string (HTML) -> Rendered in `iframe` (Preview) -> Blob (Download).

## Key Components
1.  **`App.tsx`**: Root layout and Router provider.
2.  **`Home.tsx`** (Planned): Landing page for mode selection.
3.  **`BasicConverter.tsx`**: Handles standard Regex parsing and HTML generation.
4.  **`AIConverter.tsx`**: Handles LLM-based parsing and "rich" features.
5.  **`GeneratedHtmlDisplay.tsx`**: Reusable component for previewing/downloading the output.

## Design Patterns
- **Service Pattern**: Parsing logic is isolated in `services/converterService.ts`, keeping UI components clean.
- **Theme Config**: Themes are defined as objects in `types.ts` and mapped to CSS classes, allowing easy extension.
- **Scoped CSS**: The generated HTML includes its own `<style>` block (Tailwind CDN + Custom CSS) to ensure it looks identical offline.
