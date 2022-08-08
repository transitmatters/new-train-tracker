export interface Line {
    name: string;
    abbreviation: string;
    color: string;
    colorSecondary: string;
    routes: Routes;
    fixedTrainLabelPosition?: string;
}

export interface Route {
    shape: Shape;
}

export interface Routes {
    [name: string]: Route;
}

export type CurrentStatus = 'IN_TRANSIT_TO' | 'INCOMING_AT' | 'STOPPED_AT';

export interface Train {
    currentStatus: CurrentStatus;
    direction: number;
    isNewTrain: boolean;
    label: string;
    latitude: number;
    longitude: number;
    route: string;
    stationId: string;
    tripId: string;
}

interface Shape {
    type: ShapeType;
    path?: string;
    turtle?: Turtle;
    length?: number;
    stations?: string[];
    commands?: null[];
    start?: string;
    end?: string;
}

type ShapeType = 'start' | 'stationRange';

interface Turtle {
    x: number;
    y: number;
    theta: number;
}
