import { start, line, wiggle, stationRange } from './paths';

const glSharedStations = [
    'place-lech',
    'place-spmnl',
    'place-north',
    'place-haecl',
    'place-gover',
    'place-pktrm',
    'place-boyls',
    'place-armnl',
    'place-coecl',
];

const labeledGreenLineStations = [
    ...glSharedStations,
    'place-hymnl',
    'place-kencl',
    'place-hsmnl',
    'place-river',
    'place-clmnl',
    'place-lake',
    'place-hsmnl',
];

export const greenShared = [
    start(0, 0, 90),
    stationRange({
        stations: glSharedStations,
        commands: [line(100)],
    }),
];

export const greenBCDTrunk = [
    line(20),
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
        commands: [line(110)],
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
    wiggle(60, 40),
    stationRange({
        start: 'place-prmnl',
        end: 'place-hsmnl',
        commands: [line(100)],
    }),
];

export const greenLine = {
    name: 'Green',
    abbreviation: 'GL',
    color: '#114529',
    colorSecondary: '#159765',
    shouldLabelTrain: ({ stationId }) =>
        stationId && !labeledGreenLineStations.includes(stationId),
    getStationLabelPosition: stationId => {
        if (stationId === 'place-hymnl') {
            return 'left';
        }
        if (labeledGreenLineStations.includes(stationId)) {
            return 'right';
        }
        return false;
    },
    routes: {
        'Green-B': {
            shape: greenBShape,
        },
        'Green-C': {
            shape: greenCShape,
        },
        'Green-D': {
            shape: greenDShape,
        },
        'Green-E': {
            shape: greenEShape,
        },
    },
};

export const orangeLine = {
    name: 'Orange',
    abbreviation: 'OL',
    colorSecondary: '#e66f00',
    color: '#ffaa21',
    getStationLabelPosition: () => 'right',
    shouldLabelTrain: () => false,
    routes: {
        Orange: {
            shape: [
                start(0, 0, 90),
                stationRange({
                    start: 'place-ogmnl',
                    end: 'place-forhl',
                    commands: [line(200)],
                }),
            ],
        },
    },
};

const redShared = [
    start(0, 0, 90),
    stationRange({
        start: 'place-alfcl',
        end: 'place-jfk',
        commands: [line(120)],
    }),
];

const redA = [
    ...redShared,
    wiggle(30, -20),
    stationRange({
        start: 'place-shmnl',
        end: 'place-asmnl',
        commands: [line(50)],
    }),
];

const redB = [
    ...redShared,
    wiggle(30, 20),
    stationRange({
        start: 'place-nqncy',
        end: 'place-brntn',
        commands: [line(90)],
    }),
];

export const redLine = {
    name: 'Red',
    abbreviation: 'RL',
    color: '#E37C7C',
    colorSecondary: '#D13434',
    getStationLabelPosition: () => 'right',
    shouldLabelTrain: () => false,
    routes: {
        'Red-A': {
            derivedFromRouteId: 'Red',
            shape: redA,
        },
        'Red-B': {
            derivedFromRouteId: 'Red',
            shape: redB,
        },
    },
};
