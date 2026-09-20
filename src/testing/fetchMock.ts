/*
fetch stubbing for the five GET->JSON endpoints the frontend consumes.

Deliberately not MSW: there are four API endpoints plus a static JSON file, all
plain GETs, so MSW's request matching and handler sharing buy nothing -- while
MSW v2 under jest+jsdom needs its own polyfill stack (TransformStream,
ReadableStream, BroadcastChannel, customExportConditions).

Match on pathname, never the full URL: jsdom serves pages from http://localhost/,
so src/constants.ts resolves APP_DATA_BASE_PATH to http://localhost:5555 inside
tests, and full-string matching would silently stop working if that map changes.
*/

const toPathname = (input: RequestInfo | URL): string => {
    const raw =
        typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    return new URL(raw, 'http://localhost').pathname;
};

const jsonResponse = (body: unknown, status = 200): Response =>
    ({
        ok: status >= 200 && status < 300,
        status,
        statusText: status === 200 ? 'OK' : `Status ${status}`,
        json: async () => body,
    }) as Response;

/*
Routes are matched by exact pathname, e.g.
  mockFetchJson({ '/trains/Green-B': [train], '/stops/Green-B': stations })
An unmatched request rejects, so a test can never silently pass against a
request it did not intend to make.
*/
export const mockFetchJson = (routes: Record<string, unknown>) =>
    jest.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
        const pathname = toPathname(input);
        if (pathname in routes) {
            return jsonResponse(routes[pathname]);
        }
        throw new Error(`Unexpected fetch for ${pathname}`);
    });

/* Every request fails with the given HTTP status. */
export const mockFetchStatus = (status: number, body: unknown = { error: 'nope' }) =>
    jest.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse(body, status));

/* Every request succeeds but returns the given (malformed) payload. */
export const mockFetchPayload = (body: unknown) =>
    jest.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse(body));
