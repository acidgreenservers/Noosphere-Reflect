// Pure transformation functions for user JSX/TSX code.
// No DOM, no React — testable in isolation.

/** Escape closing script tags to prevent breaking out of the <script> context. */
export const escapeScriptTags = (code: string): string =>
    code.replace(/<\/script>/gi, '<\\/script>');

export interface TransformResult {
    code: string;
    componentName: string | null;
}

const REACT_MODULE = 'react';

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

    if (moduleName === REACT_MODULE) {
        // Determine what's being imported.
        // Default import pattern: `import React, { ... }` (default followed by comma)
        const defaultMatch = statement.match(/^\s*import\s+([A-Za-z_$][\w$]*)\s*,/);
        // Named-only import pattern: `import { useState } from 'react'`
        const braceMatch = statement.match(/\{\s*([\s\S]*?)\s*\}/);

        if (braceMatch) {
            const specifiers = normalizeSpecifiers(braceMatch[1]);
            if (defaultMatch) {
                return `const ${defaultMatch[1]} = window.React;\nconst { ${specifiers} } = React;`;
            }
            return `const { ${specifiers} } = React;`;
        }
        // Bare default import: `import React from 'react'`
        if (defaultMatch) {
            return `const ${defaultMatch[1]} = window.React;`;
        }
        return null;
    }

    // Non-react import — no bundler inside iframe to resolve it. Remove with a marker.
    return `/* unsupported import removed: ${moduleName} */`;
};

/** Extract component name from export default statement. */
export const extractDefaultExportName = (code: string): string | null => {
    const fnMatch = code.match(/^\s*export\s+default\s+function\s+([A-Za-z_$][\w$]*)/m);
    if (fnMatch) return fnMatch[1];
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
 * Remap ES module statements for sandboxed execution:
 * - React imports → UMD global destructuring
 * - non-React imports → removed with inline marker
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