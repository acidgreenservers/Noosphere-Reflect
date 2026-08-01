// Pinned CDN versions for sandboxed iframe rendering.
// Loaded INSIDE the iframe — never in the app bundle. Single source of truth.

export const REACT_CDN = 'https://unpkg.com/react@18.3.1/umd/react.development.js';
export const REACT_DOM_CDN = 'https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js';
export const BABEL_CDN = 'https://unpkg.com/@babel/standalone@7.24.7/babel.min.js';
export const TAILWIND_CDN = 'https://cdn.tailwindcss.com';

// Lucide React — icon library used by many AI-generated JSX artifacts.
// UMD build exposes window.LucideReact with named exports (Moon, Sun, etc.)
export const LUCIDE_REACT_CDN = 'https://unpkg.com/lucide-react@0.544.0/dist/umd/lucide-react.min.js';
