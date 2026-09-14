/*
Polyfills for globals that jsdom does not provide but our dependencies require.

This runs via jest's `setupFiles`, which executes BEFORE the test framework and
before any module import. `setupFilesAfterEnv` is too late: react-router reaches
for TextEncoder at module scope.

The casts are unavoidable: node's TextEncoder types its output as
Uint8Array<ArrayBufferLike> while the DOM lib wants Uint8Array<ArrayBuffer>.
The implementations are interchangeable at runtime.
*/
import { TextDecoder, TextEncoder } from 'node:util';

const g = globalThis as Record<string, unknown>;

g.TextEncoder ??= TextEncoder as unknown as typeof globalThis.TextEncoder;
g.TextDecoder ??= TextDecoder as unknown as typeof globalThis.TextDecoder;

/*
jest-environment-jsdom does not provide fetch, so jest.spyOn has nothing to
attach to. Install a default that fails loudly: a test that reaches the network
without stubbing it should say so, not hang or silently return undefined.
*/
g.fetch ??= (async (input: RequestInfo | URL) => {
    throw new Error(
        `Unstubbed fetch for ${String(input)} -- use mockFetchJson/mockFetchStatus from src/testing/fetchMock.`
    );
}) as typeof globalThis.fetch;
