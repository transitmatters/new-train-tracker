import { start, line, wiggle, stationRange } from './paths';
import { Line, LineShape } from './types';

const GLStations = {
    MedfordTufts: 'place-mdftf',
    BallSqaure: 'place-balsq',
    MagounSquare: 'place-mgngl',
    GilmanSquare: 'place-gilmn',
    EastSomerville: 'place-esomr',
    UnionSquare: 'place-unsqu',
    Lechemere: 'place-lech',
    SciencePark: 'place-spmnl',
    NorthStation: 'place-north',
    Haymarket: 'place-haecl',
    GovernmentCenter: 'place-gover',
    ParkSt: 'place-pktrm',
    Boylston: 'place-boyls',
    Arlington: 'place-armnl',
    Copley: 'place-coecl',
    Hynes: 'place-hymnl',
    Kenmore: 'place-kencl',
    HeathSt: 'place-hsmnl',
    Riverside: 'place-river',
    ClevelandCircle: 'place-clmnl',
    BostonCollege: 'place-lake',
    BlanfordStreet: 'place-bland',
    StMarysStreet: 'place-smary',
    Fenway: 'place-fenwy',
    Prudential: 'place-prmnl',
} as const;

const glxStations = [
    GLStations.MedfordTufts,
    GLStations.BallSqaure,
    GLStations.MagounSquare,
    GLStations.GilmanSquare,
    GLStations.EastSomerville,
];

const glSharedStations = [
    GLStations.Lechemere,
    GLStations.SciencePark,
    GLStations.NorthStation,
    GLStations.Haymarket,
    GLStations.GovernmentCenter,
    GLStations.ParkSt,
    GLStations.Boylston,
    GLStations.Arlington,
    GLStations.Copley,
];

const labeledGreenLineStations = [
    GLStations.MedfordTufts,
    GLStations.UnionSquare,
    ...glSharedStations,
    GLStations.Hynes,
    GLStations.Kenmore,
    GLStations.HeathSt,
    GLStations.Riverside,
    GLStations.ClevelandCircle,
    GLStations.BostonCollege,
];

const greenShared: LineShape[] = [
    stationRange({
        stations: glSharedStations,
        commands: [line(100)],
    }),
];

const greenBCDTrunk: LineShape[] = [
    line(20),
    stationRange({
        start: GLStations.Hynes,
        end: GLStations.Kenmore,
        commands: [line(20)],
    }),
];

const greenBShape: LineShape[] = [
    start(0, 0, 90),
    ...greenShared,
    ...greenBCDTrunk,
    wiggle(30, -20),
    stationRange({
        start: GLStations.BlanfordStreet,
        end: GLStations.BostonCollege,
        commands: [line(100)],
    }),
];

const greenCShape: LineShape[] = [
    start(0, 0, 90),
    ...greenShared,
    ...greenBCDTrunk,
    line(30),
    stationRange({
        start: GLStations.StMarysStreet,
        end: GLStations.ClevelandCircle,
        commands: [line(110)],
    }),
];

const greenDShape: LineShape[] = [
    start(-20, -31, 90),
    stationRange({
        stations: [GLStations.UnionSquare],
        commands: [line(1)],
    }),
    wiggle(30, 20),
    ...greenShared,
    ...greenBCDTrunk,
    wiggle(30, 20),
    stationRange({
        start: GLStations.Fenway,
        end: GLStations.Riverside,
        commands: [line(100)],
    }),
];

const greenEShape: LineShape[] = [
    start(0, -55, 90),
    stationRange({
        start: GLStations.MedfordTufts,
        end: GLStations.EastSomerville,
        commands: [line(40)],
    }),
    line(15),
    ...greenShared,
    wiggle(60, 40),
    stationRange({
        start: GLStations.Prudential,
        end: GLStations.HeathSt,
        commands: [line(100)],
    }),
];

export const greenLine: Line = {
    name: 'Green',
    abbreviation: 'GL',
    color: '#114529',
    colorSecondary: '#159765',
    getStationLabelPosition: ({ stationId, routeId, isRouteFocused }) => {
        if (labeledGreenLineStations.includes(stationId)) {
            return stationId === GLStations.Hynes ? 'left' : 'right';
        }
        if (isRouteFocused && glxStations.includes(stationId)) {
            return 'right';
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

const enum OLStations {
    OakGrove = 'place-ogmnl',
    ForestHills = 'place-forhl',
}

export const orangeLine: Line = {
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
                    start: OLStations.OakGrove,
                    end: OLStations.ForestHills,
                    commands: [line(250)],
                }),
            ],
        },
    },
};

const enum RLStations {
    Alewife = 'place-alfcl',
    UmassJFK = 'place-jfk',
    SavinHill = 'place-shmnl',
    Ashmont = 'place-asmnl',
    NorthQuincy = 'place-nqncy',
    Braintree = 'place-brntn',
}

const redShared: LineShape[] = [
    start(0, 0, 90),
    stationRange({
        start: RLStations.Alewife,
        end: RLStations.UmassJFK,
        commands: [line(120)],
    }),
];

const redA: LineShape[] = [
    ...redShared,
    wiggle(30, -20),
    stationRange({
        start: RLStations.SavinHill,
        end: RLStations.Ashmont,
        commands: [line(50)],
    }),
];

const redB: LineShape[] = [
    ...redShared,
    wiggle(30, 20),
    stationRange({
        start: RLStations.NorthQuincy,
        end: RLStations.Braintree,
        commands: [line(70)],
    }),
];

export const redLine: Line = {
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
