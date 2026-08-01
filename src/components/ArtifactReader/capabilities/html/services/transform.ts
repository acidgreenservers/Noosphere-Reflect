// Pure transformation functions for user JSX/TSX code.
// No DOM, no React — testable in isolation.

/** Escape closing script tags to prevent breaking out of the <script> context. */
export const escapeScriptTags = (code: string): string =>
    code.replace(/<\/script>/gi, '<\\/script>');

export interface TransformResult {
    code: string;
    componentName: string | null;
}

/**
 * UMD global mapping for known libraries.
 * Each entry maps an ES module specifier to its window global.
 * This is the single registry — add new supported libraries here.
 */
const UMD_GLOBALS: Record<string, string> = {
    'react': 'window.React',
    'react-dom': 'window.ReactDOM',
    'lucide-react': 'window.LucideReact',
};

/**
 * Modules that should be silently removed (no UMD equivalent needed).
 * - react/jsx-runtime: Used by automatic JSX runtime, not needed with classic runtime + Babel
 * - type-only imports: Erased by TypeScript, no runtime code needed
 */
const SILENT_REMOVAL_PATTERNS: RegExp[] = [
    /^react\/jsx-runtime$/,
    /^react\/jsx-dev-runtime$/,
];

/** Normalize import specifiers: "useState, useCallback" | "useState as useS" → valid destructuring. */
const normalizeSpecifiers = (specifiers: string): string =>
    specifiers
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .map(spec => {
            const aliasMatch = spec.match(/^([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/);
            return aliasMatch ? `${aliasMatch[1]}: ${aliasMatch[2]}` : spec;
        })
        .join(', ');

/**
 * Transform a single import statement (which may span multiple lines) into
 * equivalent UMD-global code, or null if it should be removed entirely.
 */
const transformImport = (statement: string): string | null => {
    // Extract the module name from the final `from '...'` / `from "..."` clause
    const fromMatch = statement.match(/from\s+['"]([^'"]+)['"]/);
    if (!fromMatch) {
        // Side-effect import: import 'styles.css' — no file system inside iframe
        return null;
    }
    const moduleName = fromMatch[1];

    // Silently remove modules that don't need UMD equivalents
    if (SILENT_REMOVAL_PATTERNS.some(pattern => pattern.test(moduleName))) {
        return null;
    }

    // Check if this module has a known UMD global
    const umdGlobal = UMD_GLOBALS[moduleName];

    if (umdGlobal) {
        // Namespace import: `import * as React from 'react'`
        const namespaceMatch = statement.match(/^\s*import\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from/);
        if (namespaceMatch) {
            return `const ${namespaceMatch[1]} = ${umdGlobal};`;
        }

        // Default import pattern: `import React, { ... }` (default followed by comma)
        const defaultMatch = statement.match(/^\s*import\s+([A-Za-z_$][\w$]*)\s*,/);
        // Named-only import pattern: `import { useState } from 'react'`
        const braceMatch = statement.match(/\{\s*([\s\S]*?)\s*\}/);

        if (braceMatch) {
            const specifiers = normalizeSpecifiers(braceMatch[1]);
            if (defaultMatch) {
                return `const ${defaultMatch[1]} = ${umdGlobal};\nconst { ${specifiers} } = ${defaultMatch[1]};`;
            }
            return `const { ${specifiers} } = ${umdGlobal};`;
        }
        // Bare default import: `import React from 'react'`
        if (defaultMatch) {
            return `const ${defaultMatch[1]} = ${umdGlobal};`;
        }
        return null;
    }

    // Unknown import — no bundler inside iframe to resolve it. Remove with a marker.
    return `/* unsupported import removed: ${moduleName} */`;
};

/** Extract component name from export default statement. */
export const extractDefaultExportName = (code: string): string | null => {
    const fnMatch = code.match(/^\s*export\s+default\s+function\s+([A-Za-z_$][\w$]*)/m);
    if (fnMatch) return fnMatch[1];
    const classMatch = code.match(/^\s*export\s+default\s+class\s+([A-Za-z_$][\w$]*)/m);
    if (classMatch) return classMatch[1];
    const varMatch = code.match(/^\s*export\s+default\s+([A-Za-z_$][\w$]*)/m);
    return varMatch ? varMatch[1] : null;
};

/** Transform an export statement into plain declaration code. */
const transformExport = (line: string): string => {
    return line
        .replace(/^\s*export\s+default\s+(function|class)\s+/, '$1 ')
        .replace(/^\s*export\s+default\s+/, '')
        .replace(/^\s*export\s+(const|let|var|function|class)\s+/, '$1 ')
        .replace(/^\s*export\s+\{[^}]*\}\s*;?\s*$/, '');
};

/**
 * Check if a line is a TypeScript type-only import that should be removed.
 * `import type { Foo } from 'bar'` — no runtime code needed.
 */
const isTypeOnlyImport = (line: string): boolean =>
    /^\s*import\s+type\s/.test(line);

/**
 * Remap ES module statements for sandboxed execution:
 * - Known UMD imports (react, react-dom, lucide-react) → UMD global destructuring
 * - Namespace imports → UMD global assignment
 * - Silent removal modules (jsx-runtime) → removed entirely
 * - Type-only imports → removed entirely
 * - Unknown imports → removed with inline marker
 * - export statements → stripped (component name extracted separately)
 * Handles single-line AND multi-line import/export statements.
 */
export const transformModuleStatements = (code: string): TransformResult => {
    const componentName = extractDefaultExportName(code);

    const lines = code.split('\n');
    const output: string[] = [];
    let i = 0;

    while (i < lines.length) {
        const trimmed = lines[i].trim();

        // Type-only imports — remove entirely (no runtime code)
        if (isTypeOnlyImport(trimmed)) {
            // Skip multi-line type imports too
            let j = i;
            while (
                j < lines.length - 1 &&
                !/from\s+['"][^'"]+['"]\s*;?\s*$/.test(lines[j].trim())
            ) {
                j++;
            }
            i = j + 1;
            continue;
        }

        // Collect a full import statement — imports can span multiple lines
        if (trimmed.startsWith('import ')) {
            let statement = lines[i];
            let j = i;
            while (
                j < lines.length - 1 &&
                !/from\s+['"][^'"]+['"]\s*;?\s*$/.test(statement.trim())
            ) {
                j++;
                statement += '\n' + lines[j];
            }

            const transformed = transformImport(statement);
            if (transformed) output.push(transformed);
            i = j + 1;
            continue;
        }

        if (trimmed.startsWith('export ')) {
            output.push(transformExport(lines[i]));
            i++;
            continue;
        }

        output.push(lines[i]);
        i++;
    }

    const cleaned = output.join('\n').replace(/\n{3,}/g, '\n\n');
    return { code: cleaned, componentName };
};