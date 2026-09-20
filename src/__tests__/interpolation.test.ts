import { createInterpolatorForSegments, interpolateTrainOffset } from '../interpolation';
import { line, start } from '../paths';
import { makeStationLine, makeTrain } from '../testing/factories';
import { Segment } from '../types';

/*
Stations are laid out north-to-south with latitude and offset both increasing
with index -- the same monotonic relationship prerenderRoute produces and the
backend's maybe_reverse() guarantees.
*/
const stations = makeStationLine(['a', 'b', 'c', 'd'], { spacing: 10, latStep: 1 });

describe('interpolateTrainOffset', () => {
    it("returns a stopped train's station offset exactly", () => {
        const train = makeTrain({ stationId: 'c', currentStatus: 'STOPPED_AT', latitude: 2 });

        expect(interpolateTrainOffset(train, stations)).toBe(20);
    });

    it('interpolates midway between stations when travelling in direction 0', () => {
        // Heading toward 'c' (offset 20) from 'b' (offset 10), halfway there.
        const train = makeTrain({
            stationId: 'c',
            direction: 0,
            currentStatus: 'IN_TRANSIT_TO',
            latitude: 1.5,
        });

        expect(interpolateTrainOffset(train, stations)).toBeCloseTo(15);
    });

    /*
    The direction-1 case is the one that regressed: offsetDistance is negative
    for every inbound train, because fromStation is stations[i + 1].
    */
    it('stays near the station it just left when travelling in direction 1', () => {
        // Heading toward 'b' (offset 10) from 'c' (offset 20), only just departed.
        const train = makeTrain({
            stationId: 'b',
            direction: 1,
            currentStatus: 'IN_TRANSIT_TO',
            latitude: 1.9,
        });

        expect(interpolateTrainOffset(train, stations)).toBeCloseTo(19);
    });

    it('reaches the destination offset at the end of a direction-1 leg', () => {
        const train = makeTrain({
            stationId: 'b',
            direction: 1,
            currentStatus: 'IN_TRANSIT_TO',
            latitude: 1,
        });

        expect(interpolateTrainOffset(train, stations)).toBeCloseTo(10);
    });

    it('moves monotonically toward the destination in direction 1', () => {
        const offsetAt = (latitude: number) =>
            interpolateTrainOffset(
                makeTrain({
                    stationId: 'b',
                    direction: 1,
                    currentStatus: 'IN_TRANSIT_TO',
                    latitude,
                }),
                stations
            )!;

        // Latitude falls from 2 to 1 as the train travels from 'c' to 'b'.
        expect(offsetAt(1.75)).toBeLessThan(offsetAt(2));
        expect(offsetAt(1.25)).toBeLessThan(offsetAt(1.75));
    });

    it('clamps to the destination offset when the train has overshot', () => {
        const train = makeTrain({
            stationId: 'c',
            direction: 0,
            currentStatus: 'IN_TRANSIT_TO',
            latitude: 5,
        });

        expect(interpolateTrainOffset(train, stations)).toBe(20);
    });

    it('falls back to the nearest station when the train has left the route', () => {
        // A Green-B train that turned at Park but reads as bound for Gov't Center.
        const train = makeTrain({
            stationId: 'not-on-this-route',
            currentStatus: 'IN_TRANSIT_TO',
            latitude: 2.1,
        });

        expect(interpolateTrainOffset(train, stations)).toBe(20);
    });

    it('returns undefined when there are no stations at all', () => {
        expect(interpolateTrainOffset(makeTrain(), undefined)).toBeUndefined();
    });

    it('returns the destination offset at the head of the line', () => {
        // No preceding station exists, so there is nothing to interpolate from.
        const train = makeTrain({ stationId: 'a', direction: 0, currentStatus: 'IN_TRANSIT_TO' });

        expect(interpolateTrainOffset(train, stations)).toBe(0);
    });
});

describe('createInterpolatorForSegments', () => {
    // Three 10-unit segments heading due east: total length 30.
    const segments: Segment[] = (() => {
        let turtle = start(0, 0, 0).turtle!;
        return [10, 10, 10].map((length) => {
            const segment = line(length)(turtle);
            turtle = segment.turtle;
            return segment;
        });
    })();

    it('maps zero to the start of the first segment', () => {
        expect(createInterpolatorForSegments(segments)(0)).toMatchObject({ x: 0, y: 0 });
    });

    it('maps a position inside the second segment', () => {
        expect(createInterpolatorForSegments(segments)(15).x).toBeCloseTo(15);
    });

    it('maps an exact segment boundary without double counting', () => {
        expect(createInterpolatorForSegments(segments)(10).x).toBeCloseTo(10);
        expect(createInterpolatorForSegments(segments)(20).x).toBeCloseTo(20);
    });

    it('maps the total length to the end of the last segment', () => {
        expect(createInterpolatorForSegments(segments)(30).x).toBeCloseTo(30);
    });

    /*
    The bounds guard used to be `ptr < segments.length`, so ptr ran one past the
    end and the next iteration threw a TypeError on segments[ptr].length -- the
    explicit error below was unreachable.
    */
    it('throws a descriptive error past the end of the track', () => {
        expect(() => createInterpolatorForSegments(segments)(31)).toThrow(/Ran out of track/);
    });
});
