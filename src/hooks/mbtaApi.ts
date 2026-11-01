/*
Data access for the backend API, split out of useMbtaApi so it can be tested
without a react-query harness.

These are not hooks: they are the fetch + filter layer the hook composes.
*/
import { APP_DATA_BASE_PATH } from '../constants';
import { Route, Station, Train, VehicleCategory } from '../types';

export interface MBTAApi {
    routesInfo: Record<string, Route> | null;
    stationsByRoute: Record<string, Station[]> | null;
    trainsByRoute: Record<string, Train[]> | null;
    isReady: false;
}

export interface MBTAApiReady {
    routesInfo: Record<string, Route>;
    stationsByRoute: Record<string, Station[]>;
    trainsByRoute: Record<string, Train[]>;
    isReady: true;
}

export type MBTAApiResponse = MBTAApi | MBTAApiReady;

// The API has returned non-array error payloads under rate limiting, so shape
// is checked before the data reaches the render path.
const isValidArray = <T>(data: unknown): data is T[] => {
    return Array.isArray(data);
};

export const getTrainPositions = async (routes: string[]): Promise<Train[]> => {
    const res = await fetch(`${APP_DATA_BASE_PATH}/trains/${routes.join(',')}`);
    if (!res.ok) {
        throw new Error(`Failed to fetch trains: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    if (!isValidArray<Train>(data)) {
        throw new Error(`Invalid train data received: ${JSON.stringify(data).slice(0, 100)}`);
    }
    return data;
};

export const getStationsForRoute = async (route: string): Promise<Station[]> => {
    const res = await fetch(`${APP_DATA_BASE_PATH}/stops/${route}`);
    if (!res.ok) {
        throw new Error(`Failed to fetch stations for ${route}: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    if (!isValidArray<Station>(data)) {
        throw new Error(`Invalid station data for ${route}: ${JSON.stringify(data).slice(0, 100)}`);
    }
    return data;
};

export const getRoutesInfo = async (routes: string[]): Promise<Route[]> => {
    const res = await fetch(`${APP_DATA_BASE_PATH}/routes/${routes.join(',')}`);
    if (!res.ok) {
        throw new Error(`Failed to fetch routes info: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    if (!isValidArray<Route>(data)) {
        throw new Error(`Invalid routes info received: ${JSON.stringify(data).slice(0, 100)}`);
    }
    return data;
};

const filterNew = (trains: Train[]) => trains.filter((train) => train.isNewTrain);
const filterOld = (trains: Train[]) => trains.filter((train) => !train.isNewTrain);
const filterPride = (trains: Train[]) => trains.filter((train) => train.isPrideCar);
const filterHoliday = (trains: Train[]) => trains.filter((train) => train.isHolidayCar);

export const filterTrains = (trains: Train[], vehiclesAge: VehicleCategory) => {
    if (vehiclesAge === 'new_vehicles') {
        return filterNew(trains);
    } else if (vehiclesAge === 'old_vehicles') {
        return filterOld(trains);
    } else if (vehiclesAge === 'pride') {
        return filterPride(trains);
    } else if (vehiclesAge === 'holiday') {
        return filterHoliday(trains);
    }
    return trains;
};
