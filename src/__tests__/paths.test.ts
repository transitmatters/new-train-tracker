import { line, start, stationRange, wiggle } from '../paths';
import { makeTurtle } from '../testing/factories';
import { Segment } from '../types';

/*
curve() is deliberately untested: it is dead code (lines.ts imports only start,
line, wiggle and stationRange) and its `type: 'curve'` is not even a member of
SegmentType. It should be deleted rather than pinned.
*/

describe('start', () => {
    it('produces a zero-length anchor carrying the initial turtle', () => {
        expect(start(1, 2, 90)).toMatchObject({
            type: 'start',
            path: '',
            length: 0,
            turtle: { x: 1, y: 2, theta: 90 },
        });
    });
});

describe('line', () => {
    it('travels along +x at theta 0', () => {
        const segment = line(10)(makeTurtle());

        expect(segment.path).toBe('M 0 0 L 10 0');
        expect(segment.turtle).toEqual({ x: 10, y: 0, theta: 0 });
        expect(segment.length).toBe(10);
    });

    it('travels along +y at theta 90', () => {
        // Guards the degrees-vs-radians convention: Math.sin(90) would be ~0.89.
        const segment = line(10)(makeTurtle({ theta: 90 }));

        expect(segment.turtle.x).toBeCloseTo(0);
        expect(segment.turtle.y).toBeCloseTo(10);
    });

    it('continues from wherever the turtle already is', () => {
        expect(line(5)(makeTurtle({ x: 3, y: 4 })).path).toBe('M 3 4 L 8 4');
    });

    it('interpolates to the exact midpoint and preserves heading', () => {
        expect(line(10)(makeTurtle())!.get(0.5)).toMatchObject({ x: 5, y: 0, theta: 0 });
    });

    it('rounds path coordinates to two decimal places', () => {
        // Unrounded this would be 8.660254037844387, bloating every path string.
        expect(line(10)(makeTurtle({ theta: 30 })).path).toBe('M 0 0 L 8.66 5');
    });

    it('ends where its own interpolator says it ends', () => {
        const segment = line(10)(makeTurtle({ theta: 30 }));
        const end = segment.get(1);

        expect(end.x).toBeCloseTo(segment.turtle.x);
        expect(end.y).toBeCloseTo(segment.turtle.y);
    });
});

describe('wiggle', () => {
    const segment = wiggle(30, 20)(makeTurtle({ theta: 90 })) as Segment;

    it('is a branch drawn as a cubic bezier', () => {
        expect(segment.type).toBe('branch');
        expect(segment.path).toMatch(/^M .* C /);
    });

    it('offsets sideways by the given width', () => {
        // theta 90, width 20: forward is +y, and the sideways term is +x.
        expect(segment.turtle.x).toBeCloseTo(20);
        expect(segment.turtle.y).toBeCloseTo(30);
    });

    it('advances the heading by the given angle', () => {
        expect(wiggle(30, 20, 45)(makeTurtle({ theta: 90 })).turtle!.theta).toBe(135);
    });

    it('keeps the incoming heading when no angle is given', () => {
        expect(segment.turtle.theta).toBe(90);
    });

    it('is at least as long as the straight-line chord it spans', () => {
        const chord = Math.sqrt(30 ** 2 + 20 ** 2);
        expect(segment.length).toBeGreaterThanOrEqual(chord);
    });

    it('ends where its own interpolator says it ends', () => {
        const end = segment.get(1);

        expect(end.x).toBeCloseTo(segment.turtle.x);
        expect(end.y).toBeCloseTo(segment.turtle.y);
    });
});

describe('stationRange', () => {
    it('carries its declaration through untouched for prerender to consume', () => {
        const commands = [line(10)];

        expect(stationRange({ start: 'a', end: 'b', commands })).toEqual({
            type: 'stationRange',
            start: 'a',
            end: 'b',
            stations: undefined,
            commands,
        });
    });
});
