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
};

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

const enum BLStations {
    Bowdoin = 'place-bomnl',
    Wonderland = 'place-wondl',
}

export const blueLine: Line = {
    name: 'Blue',
    abbreviation: 'BL',
    colorSecondary: '#3434D1',
    color: '#7CA5E3',
    getStationLabelPosition: () => 'right',
    fixedTrainLabelPosition: 'right',
    routes: {
        Blue: {
            shape: [
                start(0, 0, 90),
                stationRange({
                    end: BLStations.Bowdoin,
                    start: BLStations.Wonderland,
                    commands: [line(150)],
                }),
            ],
        },
    },
};

const enum MattapanStations {
    Ashmont = 'place-asmnl',
    Mattapan = 'place-matt',
}

export const mattapanLine: Line = {
    name: 'Mattapan',
    abbreviation: 'MT',
    color: '#E37C7C',
    colorSecondary: '#D13434',
    getStationLabelPosition: () => 'right',
    fixedTrainLabelPosition: 'right',
    routes: {
        Mattapan: {
            shape: [
                start(0, 0, 90),
                stationRange({
                    start: MattapanStations.Ashmont,
                    end: MattapanStations.Mattapan,
                    commands: [line(150)],
                }),
            ],
        },
    },
};

const enum commuterRailStations {
    SouthStation = 'place-sstat',
    NorthStation = 'place-north',
    Haverhill = 'place-WR-0329',
    Worcester = 'place-WML-0442',
    Readville = 'place-DB-0095',
    Wachusett = 'place-FR-3338',
    Kingston = 'place-KB-0351',
    Lowell = 'place-NHRML-0254',
    NeedhamHeights = 'place-NB-0137',
    Greenbush = 'place-GRB-0276',
    Franklin = 'place-FB-0275',
    Foxboro = 'place-FS-0049',
    WindsorGardens = 'place-FB-0166',
    ForgePark = 'place-FB-0303',
    Walpole = 'place-FB-0191',
    BackBay = 'place-bbsta',
    Ruggles = 'place-rugg',
    ForestHills = 'place-forhl',
    HydePark = 'place-NEC-2203',
    Endicott = 'place-FB-0109',
    DedhamCorporateCenter = 'place-FB-0118',
    Islington = 'place-FB-0125',
    NorwoodDepot = 'place-FB-0143',
    NorwoodCentral = 'place-FB-0148',
    Norfolk = 'place-FB-0230',
    Stoughton = 'place-SB-0189',
    CantonCenter = 'place-SB-0156',
    WickfordJunction = 'place-NEC-1659',
    TFGreen = 'place-NEC-1768',
    Providence = 'place-NEC-1851',
    Pawtucket = 'place-NEC-1891',
    SouthAttleboro = 'place-NEC-1919',
    Attleboro = 'place-NEC-1969',
    Mansfield = 'place-NEC-2040',
    Sharon = 'place-NEC-2108',
    CantonJunction = 'place-NEC-2139',
    Route128 = 'place-NEC-2173',
}

export const crworcesterLine: Line = {
    name: 'Worcester',
    abbreviation: 'FW',
    color: '#c276b1ff',
    colorSecondary: '#80276C',
    getStationLabelPosition: () => 'right',
    fixedTrainLabelPosition: 'right',
    routes: {
        'CR-Worcester': {
            shape: [
                start(0, 0, 90),
                stationRange({
                    start: commuterRailStations.Worcester,
                    end: commuterRailStations.SouthStation,
                    commands: [line(150)],
                }),
            ],
        },
    },
};

export const crfairmountLine: Line = {
    name: 'Fairmount',
    abbreviation: 'FM',
    color: '#c276b1ff',
    colorSecondary: '#80276C',
    getStationLabelPosition: () => 'right',
    fixedTrainLabelPosition: 'right',
    routes: {
        'CR-Fairmount': {
            shape: [
                start(0, 0, 90),
                stationRange({
                    start: commuterRailStations.Readville,
                    end: commuterRailStations.SouthStation,
                    commands: [line(150)],
                }),
            ],
        },
    },
};

export const crfitchburgLine: Line = {
    name: 'Fitchburg',
    abbreviation: 'FB',
    color: '#c276b1ff',
    colorSecondary: '#80276C',
    getStationLabelPosition: () => 'right',
    fixedTrainLabelPosition: 'right',
    routes: {
        'CR-Fitchburg': {
            shape: [
                start(0, 0, 90),
                stationRange({
                    start: commuterRailStations.Wachusett,
                    end: commuterRailStations.NorthStation,
                    commands: [line(150)],
                }),
            ],
        },
    },
};

export const crkingstonLine: Line = {
    name: 'Kingston',
    abbreviation: 'KL',
    color: '#c276b1ff',
    colorSecondary: '#80276C',
    getStationLabelPosition: () => 'right',
    fixedTrainLabelPosition: 'right',
    routes: {
        'CR-Kingston': {
            shape: [
                start(0, 0, 90),
                stationRange({
                    start: commuterRailStations.Kingston,
                    end: commuterRailStations.SouthStation,
                    commands: [line(150)],
                }),
            ],
        },
    },
};

export const crLowellLine: Line = {
    name: 'Lowell',
    abbreviation: 'LL',
    color: '#c276b1ff',
    colorSecondary: '#80276C',
    getStationLabelPosition: () => 'right',
    fixedTrainLabelPosition: 'right',
    routes: {
        'CR-Lowell': {
            shape: [
                start(0, 0, 90),
                stationRange({
                    start: commuterRailStations.Lowell,
                    end: commuterRailStations.NorthStation,
                    commands: [line(150)],
                }),
            ],
        },
    },
};

export const crNeedhamLine: Line = {
    name: 'Needham',
    abbreviation: 'NL',
    color: '#c276b1ff',
    colorSecondary: '#80276C',
    getStationLabelPosition: () => 'right',
    fixedTrainLabelPosition: 'right',
    routes: {
        'CR-Needham': {
            shape: [
                start(0, 0, 90),
                stationRange({
                    start: commuterRailStations.NeedhamHeights,
                    end: commuterRailStations.SouthStation,
                    commands: [line(150)],
                }),
            ],
        },
    },
};

export const crGreenbushLine: Line = {
    name: 'Greenbush',
    abbreviation: 'GL',
    color: '#c276b1ff',
    colorSecondary: '#80276C',
    getStationLabelPosition: () => 'right',
    fixedTrainLabelPosition: 'right',
    routes: {
        'CR-Greenbush': {
            shape: [
                start(0, 0, 90),
                stationRange({
                    start: commuterRailStations.Greenbush,
                    end: commuterRailStations.SouthStation,
                    commands: [line(150)],
                }),
            ],
        },
    },
};

export const crHaverillLine: Line = {
    name: 'Haverhill',
    abbreviation: 'HL',
    color: '#c276b1ff',
    colorSecondary: '#80276C',
    getStationLabelPosition: () => 'right',
    fixedTrainLabelPosition: 'right',
    routes: {
        'CR-Haverhill': {
            shape: [
                start(0, 0, 90),
                stationRange({
                    start: commuterRailStations.Haverhill,
                    end: commuterRailStations.NorthStation,
                    commands: [line(150)],
                }),
            ],
        },
    },
};

const franklinShared: LineShape[] = [
    start(0, 0, 90),
    stationRange({
        stations: [
            commuterRailStations.SouthStation,
            commuterRailStations.BackBay,
            commuterRailStations.Ruggles,
            commuterRailStations.ForestHills,
            commuterRailStations.HydePark,
            commuterRailStations.Readville,
            commuterRailStations.Endicott,
            commuterRailStations.DedhamCorporateCenter,
            commuterRailStations.Islington,
            commuterRailStations.NorwoodDepot,
            commuterRailStations.NorwoodCentral,
            commuterRailStations.WindsorGardens,
        ],
        commands: [line(120)],
    }),
];

const franklinA: LineShape[] = [
    ...franklinShared,
    wiggle(30, -20),
    stationRange({
        stations: [
            commuterRailStations.Walpole,
            commuterRailStations.Norfolk,
            commuterRailStations.Franklin,
            commuterRailStations.ForgePark,
        ],
        commands: [line(50)],
    }),
];

const franklinB: LineShape[] = [
    ...franklinShared,
    wiggle(30, 20),
    stationRange({
        stations: [commuterRailStations.Foxboro],
        commands: [line(15)],
    }),
];

export const crFranklinLine: Line = {
    name: 'Franklin',
    abbreviation: 'FL',
    color: '#c276b1ff',
    colorSecondary: '#80276C',
    getStationLabelPosition: () => 'right',
    routes: {
        'CR-Franklin-A': {
            derivedFromRouteId: 'CR-Franklin',
            shape: franklinA,
        },
        'CR-Franklin-B': {
            derivedFromRouteId: 'CR-Franklin',
            shape: franklinB,
        },
    },
};

const providenceShared: LineShape[] = [
    start(0, 0, 90),
    stationRange({
        stations: [
            commuterRailStations.SouthStation,
            commuterRailStations.BackBay,
            commuterRailStations.Ruggles,
            commuterRailStations.ForestHills,
            commuterRailStations.HydePark,
            commuterRailStations.Route128,
            commuterRailStations.CantonJunction,
        ],
        commands: [line(120)],
    }),
];

const providenceA: LineShape[] = [
    ...providenceShared,
    wiggle(30, -20),
    stationRange({
        stations: [commuterRailStations.CantonCenter, commuterRailStations.Stoughton],
        commands: [line(50)],
    }),
];

const providenceB: LineShape[] = [
    ...providenceShared,
    wiggle(30, 20),
    stationRange({
        stations: [
            commuterRailStations.Sharon,
            commuterRailStations.Mansfield,
            commuterRailStations.Attleboro,
            commuterRailStations.SouthAttleboro,
            commuterRailStations.Pawtucket,
            commuterRailStations.Providence,
            commuterRailStations.TFGreen,
            commuterRailStations.WickfordJunction,
        ],
        commands: [line(50)],
    }),
];

export const crProvidenceLine: Line = {
    name: 'Providence',
    abbreviation: 'PL',
    color: '#c276b1ff',
    colorSecondary: '#80276C',
    getStationLabelPosition: () => 'right',
    routes: {
        'CR-Providence-A': {
            derivedFromRouteId: 'CR-Providence',
            shape: providenceA,
        },
        'CR-Providence-B': {
            derivedFromRouteId: 'CR-Providence',
            shape: providenceB,
        },
    },
};
