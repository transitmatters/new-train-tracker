module.exports = {
    env: {
        browser: true,
        es6: true,
        amd: true,
    },
    extends: ['eslint:recommended', 'plugin:react/recommended', 'prettier'],
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
    },
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
        ecmaVersion: 2020,
        sourceType: 'module',
    },
    plugins: ['react', 'react-hooks', 'prettier'],
    rules: {
        'prettier/prettier': 'error',
        'react/jsx-no-target-blank': 0,
        'react/prop-types': 0,
        'react/no-unescaped-entities': 0,
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        'react/react-in-jsx-scope': 'off',
    },
    settings: {
        react: {
            version: 'detect',
        },
    },
};
