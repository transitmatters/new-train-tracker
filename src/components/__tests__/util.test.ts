import { Color } from '../../types';
import { makeRoute, makeTrain } from '../../testing/factories';
import { abbreviateStationNameForMap, getRouteColor, getTrainRoutePairsForLine } from '../util';

describe('getTrainRoutePairsForLine', () => {
    const routes = { 'Red-A': makeRoute({ id: 'Red-A' }), 'Red-B': makeRoute({ id: 'Red-B' }) };

    it('pairs every train with its route', () => {
        const pairs = getTrainRoutePairsForLine(
            {
                'Red-A': [makeTrain({ vehicleId: 'a1' }), makeTrain({ vehicleId: 'a2' })],
                'Red-B': [makeTrain({ vehicleId: 'b1' })],
            },
            routes
        );

        expect(pairs.map((p) => p.train.vehicleId)).toEqual(['a1', 'a2', 'b1']);
        expect(pairs[0].route.id).toBe('Red-A');
    });

    it('drops trains whose route is not part of this line', () => {
        // Guards the empty-trains bug: without the route lookup this pushed an
        // undefined route into the render path.
        const pairs = getTrainRoutePairsForLine(
            { 'Red-A': [makeTrain()], Orange: [makeTrain({ vehicleId: 'wrong-line' })] },
            routes
        );

        expect(pairs).toHaveLength(1);
        expect(pairs.every((pair) => pair.route !== undefined)).toBe(true);
    });

    it('returns an empty list when no trains are running', () => {
        expect(getTrainRoutePairsForLine({ 'Red-A': [], 'Red-B': [] }, routes)).toEqual([]);
    });

    it('returns an empty list for an empty payload', () => {
        expect(getTrainRoutePairsForLine({}, routes)).toEqual([]);
    });
});

describe('abbreviateStationNameForMap', () => {
    it.each([
        ['Boston College', 'B.C.'],
        ['Hynes Convention Center', 'Hynes'],
        ['Heath Street', 'Heath'],
    ])('abbreviates %s to %s', (input, expected) => {
        expect(abbreviateStationNameForMap(input)).toBe(expected);
    });

    it('leaves names it does not know alone', () => {
        expect(abbreviateStationNameForMap('Park Street')).toBe('Park Street');
    });
});

describe('getRouteColor', () => {
    const colors: Color = {
        route: 'white',
        unfocusedRoute: '#ffffff55',
        train: 'red',
        background: 'black',
    };

    it('dims routes other than the focused one', () => {
        expect(getRouteColor(colors, 'Red-A', 'Red-B')).toBe('#ffffff55');
    });

    it('keeps the focused route at full strength', () => {
        expect(getRouteColor(colors, 'Red-A', 'Red-A')).toBe('white');
    });

    it.each([[null], [undefined]])('keeps every route full when focus is %s', (focused) => {
        expect(getRouteColor(colors, 'Red-A', focused)).toBe('white');
    });
});
