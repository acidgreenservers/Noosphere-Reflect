import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
    {
        ignores: ['extension/**', 'scripts/**', 'dist/**', 'build/**']
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{ts,tsx}'],
        plugins: {
            'react': react,
            'react-hooks': reactHooks
        },
        rules: {
            ...react.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            'react/react-in-jsx-scope': 'off',
            'react/no-unescaped-entities': 'off',
            'react/prop-types': 'off',
            'react/display-name': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            'no-unused-vars': 'off',
            'no-case-declarations': 'off',
            'no-useless-escape': 'off',
            'no-empty': 'off',
            'no-misleading-character-class': 'off',
            'react-hooks/exhaustive-deps': 'off',
            'react-hooks/rules-of-hooks': 'off',
            'react-hooks/purity': 'off',
            'preserve-caught-error': 'off'
        },
        settings: {
            react: {
                version: 'detect'
            }
        }
    }
];
