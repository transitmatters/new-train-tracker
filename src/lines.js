import { start, line, curve, wiggle, stationRange } from './paths';

export const greenShared = [
    start(0, 0, 90),
    stationRange({
        stations: [
            'place-lech',
            'place-spmnl',
            'place-north',
            'place-haecl',
            'place-gover',
            'place-pktrm',
            'place-boyls',
            'place-armnl',
            'place-coecl',
        ],
        commands: [line(70)],
    }),
];

export const greenBCDTrunk = [
    stationRange({
        start: 'place-hymnl',
        end: 'place-kencl',
        commands: [line(20)],
    }),
];

export const greenBShape = [
    ...greenShared,
    ...greenBCDTrunk,
    wiggle(30, -20),
    stationRange({
        start: 'place-bland',
        end: 'place-lake',
        commands: [line(100)],
    }),
];

export const greenCShape = [
    ...greenShared,
    ...greenBCDTrunk,
    line(30),
    stationRange({
        start: 'place-smary',
        end: 'place-clmnl',
        commands: [line(105)],
    }),
];

export const greenDShape = [
    ...greenShared,
    ...greenBCDTrunk,
    wiggle(30, 20),
    stationRange({
        start: 'place-fenwy',
        end: 'place-river',
        commands: [line(100)],
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
    color: '#00843d',
    colorBright: '#159765',
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
