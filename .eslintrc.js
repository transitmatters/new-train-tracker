module.exports = {
    env: {
        browser: true,
        es6: true,
        amd: true,
        node: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier',
    ],
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
        ecmaVersion: 2020,
        sourceType: 'module',
    },
    plugins: ['react', 'react-hooks', '@typescript-eslint', 'import', 'prettier'],
    rules: {
        'prettier/prettier': 'error',
        'react/jsx-no-target-blank': 0,
        'react/prop-types': 'off', // TODO: Turn on or move to TS
        'react/no-unescaped-entities': 'off',
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        'react/react-in-jsx-scope': 'off',
        'import/no-default-export': 'warn',
        '@typescript-eslint/no-explicit-any': 'warn',
    },
    settings: {
        react: {
            version: 'detect',
        },
    },
};
