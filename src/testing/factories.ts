/*
Typed builders for the domain objects under test.

Defaults are fixed, not random: a failing test must reproduce exactly. Every
builder takes a Partial<T> of overrides so a test states only the fields it
actually cares about, and the compiler catches drift when src/types.ts changes
(Train alone has 16 required fields).
*/
import { Carriage, CurrentStatus, OccupancyStatus, Route, Station, Train, Turtle } from '../types';

export const makeCarriage = (
    label: string,
    occupancy_status: OccupancyStatus = 'NO_DATA_AVAILABLE',
    occupancy_percentage: number | null = null
): Carriage => ({ label, occupancy_status, occupancy_percentage });

export const makeTrain = (overrides: Partial<Train> = {}): Train => ({
    vehicleId: 'v1',
    label: '1900',
    route: 'Green-B',
    direction: 0,
    latitude: 0,
    longitude: 0,
    currentStatus: 'IN_TRANSIT_TO' as CurrentStatus,
    stationId: 'place-pktrm',
    tripId: 't1',
    isNewTrain: true,
    isFourCar: false,
    carriages: [],
    updatedAt: '2026-01-01T12:00:00Z',
    isPrideCar: false,
    isHolidayCar: false,
    speed: null,
    yearBuilt: '',
    ...overrides,
});

export const makeStation = (overrides: Partial<Station> = {}): Station => ({
    id: 'place-pktrm',
    name: 'Park Street',
    latitude: 0,
    longitude: 0,
    offset: 0,
    ...overrides,
});

export const makeRoute = (overrides: Partial<Route> = {}): Route => ({
    shape: [],
    ...overrides,
});

/*
Lays `ids` along a straight north-south geographic line with evenly spaced
offsets, so a test can say "the train is 30% of the way from A to B" in one
line instead of hand-computing lat/lon.

Latitude increases with index, and so does `offset` -- the same monotonic
relationship prerenderRoute produces and mbta_api.maybe_reverse() guarantees.
*/
export const makeStationLine = (
    ids: string[],
    { spacing = 10, latStep = 1 }: { spacing?: number; latStep?: number } = {}
): Station[] =>
    ids.map((id, index) =>
        makeStation({
            id,
            name: id,
            latitude: index * latStep,
            longitude: 0,
            offset: index * spacing,
        })
    );

export const makeTurtle = (overrides: Partial<Turtle> = {}): Turtle => ({
    x: 0,
    y: 0,
    theta: 0,
    ...overrides,
});
