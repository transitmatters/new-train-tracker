export type LineName =
    | 'Green'
    | 'Red'
    | 'Orange'
    | 'Blue'
    | 'Mattapan'
    | 'Worcester'
    | 'Fairmount'
    | 'Fitchburg'
    | 'Franklin'
    | 'Greenbush'
    | 'Haverhill'
    | 'Kingston'
    | 'Lowell'
    | 'Needham'
    | 'Providence';

export interface Line {
    name: LineName;
    abbreviation: string;
    color: string;
    colorSecondary: string;
    routes: Routes;
    fixedTrainLabelPosition?: string;
    getStationLabelPosition: ({
        stationId,
        routeId,
        isRouteFocused,
    }: {
        stationId: string;
        routeId: string;
        isRouteFocused: boolean;
    }) => string | null;
}

export interface Route {
    shape: LineShape[];
    directionDestinations?: string[];
    directionNames?: string[];
    stations?: Station[];
    stationPositions?: StationPositions;
    derivedFromRouteId?: string;
    pathDirective?: string;
    pathInterpolator?: (path: number) => Turtle;
    id?: string;
}

export interface Color {
    route: string;
    unfocusedRoute: string;
    train: string;
    background: string;
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
    label: string;
    latitude: number;
    longitude: number;
    route: string;
    stationId: string;
    isFourCar: boolean;
    carriages: Carriage[];
    tripId: string;
    updatedAt: string;
    isPrideCar: boolean;
    isHeritageCar: boolean;
    speed: number | null;
}

export interface Station {
    id: string;
    latitude: number;
    longitude: number;
    name: string;
    route?: { id: string; type: string };
    offset: number;
}

export interface Shape {
    type: ShapeType;
    path?: string;
    turtle?: Turtle;
    length?: number;
    stations?: string[];
    commands?: Array<(command: Turtle) => Segment>;
    start?: string;
    end?: string;
    get?: (frac: number) => { x: number; y: number };
}

type ShapeType = 'start' | 'line' | 'branch' | 'stationRange';

export type LineShape = Shape | ((turtle: Turtle) => Shape);

export interface Segment {
    type: SegmentType;
    path: string;
    length: number;
    turtle: Turtle;
    get: (frac: number) => Turtle;
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

export type VehicleCategory = 'vehicles' | 'new_vehicles' | 'old_vehicles' | 'pride' | 'heritage';

export interface Prediction {
    departure_time: Date;
}
