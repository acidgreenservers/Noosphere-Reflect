# Active Context

## Current Work Focus
Refactoring the monolithic `ChatConverter.tsx` into a modular architecture to support the new "Dual Mode" vision.

## Recent Changes
- **Tailwind Mitigation**: Successfully migrated to Tailwind v4 (`@tailwindcss/vite`) to fix configuration issues.
- **Basic Mode Enhancements**: Added a "Copy" button to code blocks in the generated HTML.
- **Service Layer**: Rewrote `converterService.ts` to support both Regex-based (Basic) and Gemini-based (AI) parsing, correcting previous code duplication errors.
- **Strategic Pivot**: Decided to move from a toggle-switch UI to a separate-page architecture (Home -> Basic | AI).

## Next Steps
1.  **Install Router**: Add `react-router-dom` to manage navigation between Home, Basic, and AI screens.
2.  **Refactor Components**:
    *   Create `Home.tsx` (Dashboard).
    *   Rename/Refactor code from `ChatConverter.tsx` into `BasicConverter.tsx`.
    *   Scaffold `AIConverter.tsx` for future rich feature implementation.
3.  **Update Routing**: Configure `App.tsx` to handle the routes.

## Active Decisions
- **Architecture**: Split approach (Option B) chosen over unified UI (Option A) to allow the AI mode to diverge significantly in complexity without bloating the basic mode.
- **Styling**: Tailwind v4 is the standard. Design language is "Premium Dark/Glassmorphism".
- **State Management**: LocalStorage is used for saving sessions.
