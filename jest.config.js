module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    // setupFiles runs before the test framework and before module imports;
    // setupFilesAfterEnv runs after, once `expect` exists.
    setupFiles: ['<rootDir>/src/testing/setupGlobals.ts'],
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
    transform: {
        // Point ts-jest at the test tsconfig so it agrees with `tsc -p tsconfig.test.json`.
        // esModuleInterop there is what makes `import dayjs from 'dayjs'` work under CJS emit.
        '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }],
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': '<rootDir>/src/testing/styleMock.ts',
        '\\.(png|jpe?g|gif|svg|webp|avif|ico)$': '<rootDir>/src/testing/fileMock.ts',
    },
    testMatch: [
        '<rootDir>/src/**/__tests__/**/*.(test|spec).(ts|tsx|js)',
        '<rootDir>/src/**/*.(test|spec).(ts|tsx|js)',
    ],
    clearMocks: true,
    restoreMocks: true,
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/index.tsx',
        '!src/types.ts',
        '!src/testing/**',
    ],
    // No coverageThreshold by design: coverage is reported, never gated. A global
    // floor rewards filler tests, which is the bloat this suite exists to avoid.
};
