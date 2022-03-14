import { line, start, stationRange, wiggle } from './paths';

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
    'place-tufts',
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
    stationRange({
        stations: glSharedStations,
        commands: [line(70)],
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
    start(0, 0, 90),
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
    start(0, 0, 90),
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
    start(0, -25, 90),
    stationRange({
        stations: ['place-union'],
        commands: [line(1)],
    }),
    line(24),
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
    start(20, -70, 90),
    stationRange({
        stations: ['place-eastsom', 'place-gilman', 'place-magoun', 'place-ball', 'place-tufts'],
        commands: [line(40)],
    }),
    wiggle(30, -20),
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
    getStationLabelPosition: ({ stationId, routeId, isRouteFocused }) => {
        if (labeledGreenLineStations.includes(stationId)) {
            return stationId === 'place-hymnl' ? 'left' : 'right';
        }
        if (isRouteFocused) {
            return routeId === 'Green-E' ? 'left' : 'right';
        }
        return null;
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
    fixedTrainLabelPosition: 'right',
    routes: {
        Orange: {
            shape: [
                start(0, 0, 90),
                stationRange({
                    start: 'place-ogmnl',
                    end: 'place-forhl',
                    commands: [line(250)],
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
        commands: [line(70)],
    }),
];

export const redLine = {
    name: 'Red',
    abbreviation: 'RL',
    color: '#E37C7C',
    colorSecondary: '#D13434',
    getStationLabelPosition: () => 'right',
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
