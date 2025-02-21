export interface Line {
    name: string;
    abbreviation: string;
    color: string;
    colorSecondary: string;
    routes: Routes;
    fixedTrainLabelPosition?: string;
    getStationLabelPosition: ({ stationId, routeId, isRouteFocused }) => string | null;
}

export interface Route {
    shape: LineShape[];
    directionDestinations?: string[];
    directionNames?: string[];
    stations?: Station[];
    stationPositions?: StationPositions;
    derivedFromRouteId?: string;
    pathDirective?: string;
    pathInterpolator?: (any) => any;
    id?: string;
}

export type StationPositions = Record<string, Turtle>;

export interface Routes {
    [name: string]: Route;
}

export type CurrentStatus = 'IN_TRANSIT_TO' | 'INCOMING_AT' | 'STOPPED_AT';

export type OccupancyStatus =
    | 'NO_DATA_AVAILABLE'
    | 'EMPTY'
    | 'MANY_SEATS_AVAILABLE'
    | 'FEW_SEATS_AVAILABLE'
    | 'STANDING_ROOM_ONLY'
    | 'CRUSHED_STANDING_ROOM_ONLY'
    | 'FULL'
    | 'NOT_ACCEPTING_PASSENGERS';

interface Carriage {
    label: string;
    occupancy_status: OccupancyStatus;
    occupancy_percentage: number | null;
}

export interface Train {
    vehicleId: string;
    currentStatus: CurrentStatus;
    direction: number;
    isNewTrain: boolean;
    hasGooglyEyes: boolean;
    label: string;
    latitude: number;
    longitude: number;
    route: string;
    stationId: string;
    isFourCar: boolean;
    carriages: Carriage[];
    tripId: string;
    updatedAt: string;
}

export interface Station {
    id: string;
    latitude: number;
    longitude: number;
    name: string;
    route: { id: string; type: string };
}

export interface Shape {
    type: ShapeType;
    path?: string;
    turtle?: Turtle;
    length?: number;
    stations?: string[];
    commands?: null[];
    start?: string;
    end?: string;
    get?: (frac: any) => { x; y };
}

type ShapeType = 'start' | 'line' | 'branch' | 'stationRange';

export type LineShape = Shape | ((turtle: Turtle) => Shape);

export interface Segment {
    type: SegmentType;
    path: string;
    length: number;
    turtle: Turtle;
}

type SegmentType = 'line' | 'branch';

export interface Turtle {
    x: number;
    y: number;
    theta: number;
}

export interface Pair {
    route: Route;
    train: Train;
}

export type VehicleCategory = 'vehicles' | 'new_vehicles' | 'old_vehicles' | 'googly_eyes_vehicles';

export interface Prediction {
    departure_time: Date;
}
