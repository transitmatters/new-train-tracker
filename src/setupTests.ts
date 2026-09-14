import '@testing-library/jest-dom';

// jsdom does not implement matchMedia, which src/components/util.ts calls.
// Note: prefersReducedMotion() memoises the result in a module-level variable,
// so a test that needs `matches: true` must use jest.isolateModules().
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string): MediaQueryList =>
        ({
            matches: false,
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        }) as unknown as MediaQueryList,
});
