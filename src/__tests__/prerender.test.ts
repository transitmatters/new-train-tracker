import { blueLine, greenLine, mattapanLine, orangeLine, redLine } from '../lines';
import { line, start, stationRange } from '../paths';
import { prerenderLine } from '../prerender';
import { makeStationLine } from '../testing/factories';
import { Line, Route, Station } from '../types';

const makeLine = (routes: Record<string, { shape: Line['routes'][string]['shape'] }>): Line => ({
    name: 'Orange',
    abbreviation: 'OL',
    color: '#fff',
    colorSecondary: '#000',
    getStationLabelPosition: () => 'right',
    routes: routes as Line['routes'],
});

const emptyRoutesInfo = (line: Line): Record<string, Route> =>
    Object.fromEntries(Object.keys(line.routes).map((id) => [id, { shape: [] }]));

const prerender = (line: Line, stationsByRoute: Record<string, Station[]>) =>
    prerenderLine(line, stationsByRoute, emptyRoutesInfo(line));

describe('prerenderLine path building', () => {
    it('emits each subpath exactly once', () => {
        // createPathBuilder used to append the first path twice, prefixing every
        // route directive with a duplicate of its opening M...L command.
        const line1 = makeLine({
            Orange: {
                shape: [start(0, 0, 90), stationRange({ stations: ['a'], commands: [line(100)] })],
            },
        });

        const { pathDirective } = prerender(line1, { Orange: makeStationLine(['a']) });

        expect(pathDirective.match(/M /g)).toHaveLength(1);
        expect(pathDirective.trim()).toBe('M 0 0 L 0 100');
    });

    it('concatenates the directives of multiple routes', () => {
        const line1 = makeLine({
            A: { shape: [start(0, 0, 90), line(10)] },
            B: { shape: [start(50, 0, 90), line(10)] },
        });

        const { pathDirective } = prerender(line1, { A: [], B: [] });

        expect(pathDirective.match(/M /g)).toHaveLength(2);
    });

    it('rejects a route whose first shape is not start()', () => {
        // Note the guard only catches a non-function Shape here; a bare curried
        // command such as line(10) slips past it and yields an undefined turtle.
        const line1 = makeLine({
            Orange: { shape: [stationRange({ stations: ['a'], commands: [line(10)] })] },
        });

        expect(() => prerender(line1, { Orange: [] })).toThrow(/must begin with a start/);
    });
});

describe('prerenderLine station offsets', () => {
    const lineOf = (shape: Line['routes'][string]['shape']) => makeLine({ Orange: { shape } });

    it('spreads a station list evenly across the range', () => {
        const line1 = lineOf([
            start(0, 0, 90),
            stationRange({ stations: ['a', 'b', 'c'], commands: [line(100)] }),
        ]);

        const { routes } = prerender(line1, { Orange: makeStationLine(['a', 'b', 'c']) });
        const offsets = routes.Orange.stations!.map((s) => s.offset);

        expect(offsets).toEqual([0, 50, 100]);
    });

    it('centres a lone station within its range', () => {
        const line1 = lineOf([
            start(0, 0, 90),
            stationRange({ stations: ['a'], commands: [line(100)] }),
        ]);

        const { routes } = prerender(line1, { Orange: makeStationLine(['a']) });

        expect(routes.Orange.stations![0].offset).toBe(50);
    });

    it('accounts for track laid before the range begins', () => {
        const line1 = lineOf([
            start(0, 0, 90),
            line(20),
            stationRange({ stations: ['a', 'b'], commands: [line(100)] }),
        ]);

        const { routes } = prerender(line1, { Orange: makeStationLine(['a', 'b']) });

        expect(routes.Orange.stations!.map((s) => s.offset)).toEqual([20, 120]);
    });

    it('slices a start/end range inclusively', () => {
        const line1 = lineOf([
            start(0, 0, 90),
            stationRange({ start: 'b', end: 'd', commands: [line(100)] }),
        ]);
        const stations = makeStationLine(['a', 'b', 'c', 'd', 'e']);

        const { routes } = prerender(line1, { Orange: stations });
        const placed = routes.Orange.stations!.filter((s) => s.offset !== undefined);

        expect(placed.map((s) => s.id)).toEqual(['b', 'c', 'd']);
    });

    it('places nothing when the range endpoints are not in the station list', () => {
        const line1 = lineOf([
            start(0, 0, 90),
            stationRange({ start: 'nope', end: 'also-nope', commands: [line(100)] }),
        ]);

        const { stationPositions } = prerender(line1, { Orange: makeStationLine(['a', 'b']) });

        expect(stationPositions).toEqual({});
    });

    it('survives an empty station list without throwing', () => {
        // The backend returns [] when the MBTA API errors and no stale data
        // exists, so this is a live code path, not a hypothetical.
        const line1 = lineOf([
            start(0, 0, 90),
            stationRange({ start: 'a', end: 'b', commands: [line(100)] }),
        ]);

        expect(() => prerender(line1, { Orange: [] })).not.toThrow();
    });

    it('survives a missing route entry without throwing', () => {
        const line1 = lineOf([start(0, 0, 90), line(10)]);

        expect(() => prerender(line1, {})).not.toThrow();
    });
});

/*
The real line definitions, fed synthetic stations. These catch a mistyped stop
id in lines.ts the moment it lands, without needing the live API.
*/
describe.each([
    ['Green', greenLine],
    ['Orange', orangeLine],
    ['Red', redLine],
    ['Blue', blueLine],
    ['Mattapan', mattapanLine],
])('%s line geometry', (_name, subject) => {
    // Enough stations per route that every declared stationRange resolves.
    const stationIdsForRoute = (routeId: string): string[] => {
        const ids = new Set<string>();
        subject.routes[routeId].shape.forEach((entry) => {
            if (typeof entry !== 'function' && entry.type === 'stationRange') {
                entry.stations?.forEach((id) => ids.add(id));
                if (entry.start) ids.add(entry.start);
                if (entry.end) ids.add(entry.end);
            }
        });
        return [...ids];
    };

    const stationsByRoute = Object.fromEntries(
        Object.keys(subject.routes).map((routeId) => [
            routeId,
            makeStationLine(stationIdsForRoute(routeId)),
        ])
    );

    const result = prerenderLine(subject, stationsByRoute, emptyRoutesInfo(subject));

    it('draws a path for every route', () => {
        Object.values(result.routes).forEach((route) => {
            expect(route.pathDirective).toMatch(/^M /);
            expect(route.pathDirective).not.toMatch(/NaN/);
        });
    });

    it('gives every declared station a finite offset and position', () => {
        Object.entries(result.routes).forEach(([routeId, route]) => {
            const declared = stationIdsForRoute(routeId);
            declared.forEach((stationId) => {
                const station = route.stations!.find((s) => s.id === stationId);
                expect(station).toBeDefined();
                expect(Number.isFinite(station!.offset)).toBe(true);
                expect(route.stationPositions![stationId]).toBeDefined();
            });
        });
    });

    it('keeps offsets increasing in station order', () => {
        /*
        The frontend half of the contract the backend's maybe_reverse() upholds:
        offsets must follow the order the API returns stops in. This is the
        invariant the twice-reverted blue-line direction fix kept breaking.
        */
        Object.values(result.routes).forEach((route) => {
            const offsets = route.stations!.map((s) => s.offset).filter(Number.isFinite);
            const sorted = [...offsets].sort((a, b) => a - b);
            expect(offsets).toEqual(sorted);
        });
    });

    it('interpolates a finite point at both ends of every route', () => {
        Object.values(result.routes).forEach((route) => {
            const offsets = route.stations!.map((s) => s.offset).filter(Number.isFinite);
            [Math.min(...offsets), Math.max(...offsets)].forEach((offset) => {
                const { x, y } = route.pathInterpolator!(offset);
                expect(Number.isFinite(x)).toBe(true);
                expect(Number.isFinite(y)).toBe(true);
            });
        });
    });

    it('emits one merged station map across all routes', () => {
        const everyDeclaredId = new Set(
            Object.keys(subject.routes).flatMap((routeId) => stationIdsForRoute(routeId))
        );
        // Shared stations (e.g. the Green Line trunk) appear once, not per branch.
        expect(Object.keys(result.stations).sort()).toEqual([...everyDeclaredId].sort());
    });
});
