import { start, line, curve, wiggle, stationRange } from './paths';

export const greenShared = [
    start(90, -90, 90),
    stationRange({
        start: 'place-lech',
        end: 'place-coecl',
        commands: [line(100), curve(20, 60), line(20)],
    }),
];

export const greenBCDTrunk = [
    stationRange({
        start: 'place-coecl',
        end: 'place-kencl',
        commands: [line(20)],
    }),
];

export const greenBShape = [
    ...greenShared,
    ...greenBCDTrunk,
    stationRange({
        start: 'place-bland',
        end: 'place-lake',
        commands: [wiggle(30, -20), line(100)],
    }),
];

export const greenCShape = [
    ...greenShared,
    ...greenBCDTrunk,
    stationRange({
        start: 'place-smary',
        end: 'place-clmnl',
        commands: [line(135)],
    }),
];

export const greenDShape = [
    ...greenShared,
    ...greenBCDTrunk,
    stationRange({
        start: 'place-fenwy',
        end: 'place-river',
        commands: [wiggle(30, 20), line(100)],
    }),
];

export const greenEShape = [
    ...greenShared,
    stationRange({
        start: 'place-prmnl',
        end: 'place-hsmnl',
        commands: [wiggle(60, 40), line(40)],
    }),
];

export const greenLine = {
    name: 'Green',
    routes: {
        'Green-B': {
            reversed: true,
            shape: greenBShape,
        },
        'Green-C': {
            reversed: true,
            shape: greenCShape,
        },
        'Green-D': {
            reversed: false,
            shape: greenDShape,
        },
        'Green-E': {
            reversed: true,
            shape: greenEShape,
        },
    },
};
