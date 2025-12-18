/*
File that contains a React hook that provides data from the MBTA API
*/

import { useState, useMemo } from 'react';

import { Line, Route, Station, Train, VehicleCategory } from '../types';
import { APP_DATA_BASE_PATH, ONE_DAY, FIFTEEN_SECONDS } from '../constants';
import { useQuery } from '@tanstack/react-query';

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

// Helper to validate array responses from API
const isValidArray = <T>(data: unknown): data is T[] => {
    return Array.isArray(data);
};

// if isFirstRequest is true, get train positions from intial request data JSON
// if isFirstRequest is false, makes request for new train positions through backend server via chalice route defined in app.py
const getTrainPositions = async (routes: string[]): Promise<Train[]> => {
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

const filterNew = (trains: Train[]) => {
    return trains.filter((train) => train.isNewTrain);
};

const filterOld = (trains: Train[]) => {
    return trains.filter((train) => !train.isNewTrain);
};

const filterPride = (trains: Train[]) => {
    return trains.filter((train) => train.isPrideCar);
};

const filterHoliday = (trains: Train[]) => {
    return trains.filter((train) => train.isHolidayCar);
};

const filterTrains = (trains: Train[], vehiclesAge: VehicleCategory) => {
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

const getStationsForRoute = async (route: string): Promise<Station[]> => {
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

const getRoutesInfo = async (routes: string[]): Promise<Route[]> => {
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

export const useMbtaApi = (
    lines: Line[],
    vehiclesAge: VehicleCategory = 'new_vehicles'
): MBTAApiResponse => {
    const routeNames = lines
        .map((line) => Object.keys(line.routes))
        .reduce((a, b) => [...a, ...b], [])
        .sort((a, b) => (a > b ? 1 : -1));

    const routeNamesKey = routeNames.join(',');
    const [routesInfoByRoute, setRoutesInfoByRoute] = useState<Record<string, Route> | null>(null);
    const [stationsByRoute, setStationsByRoute] = useState<Record<string, Station[]> | null>(null);

    // Get all trains for all routes
    const { data: allTrains, isLoading: isLoadingAllTrains } = useQuery({
        queryKey: ['getTrains', routeNames],
        queryFn: () => getTrainPositions(routeNames),
        // if routeNames is empty, don't make the request
        enabled: !!routeNames,
        staleTime: FIFTEEN_SECONDS,
        refetchInterval: FIFTEEN_SECONDS,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });

    const trainsByRoute = useMemo(() => {
        const nextTrainsByRoute: Record<string, Train[]> = {};
        routeNames.forEach((routeName) => {
            nextTrainsByRoute[routeName] = [];
        });
        // if allTrains is empty or null, return null
        if (!allTrains) {
            return null;
        }
        // filter trains by selected vehiclesAge
        filterTrains(allTrains, vehiclesAge).forEach((train) =>
            nextTrainsByRoute[train.route].push(train)
        );
        return nextTrainsByRoute;
    }, [allTrains, routeNames, vehiclesAge]);

    useQuery({
        queryKey: ['getStations', routeNamesKey],
        queryFn: async () => {
            const nextStopsByRoute: Record<string, Station[]> = {};
            await Promise.all(
                routeNames.map(async (routeName) => {
                    const data = await getStationsForRoute(routeName);
                    nextStopsByRoute[routeName] = data;
                })
            );
            // Only update state on successful fetch
            setStationsByRoute(nextStopsByRoute);
            return nextStopsByRoute;
        },
        // if routeNames is empty, don't make the request
        enabled: !!routeNames && routeNames.length > 0,
        staleTime: ONE_DAY,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });

    useQuery({
        queryKey: ['getRoutesInfo', routeNamesKey],
        queryFn: async () => {
            const nextRoutesInfo: Record<string, Route> = {};
            const routes = await getRoutesInfo(routeNames);
            routes.forEach((route: Route) => {
                if (route.id) {
                    nextRoutesInfo[route.id] = route;
                }
            });
            // Only update state on successful fetch
            setRoutesInfoByRoute(nextRoutesInfo);
            return nextRoutesInfo;
        },
        enabled: !!routeNames && routeNames.length > 0,
        staleTime: ONE_DAY,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });

    const isReady =
        !!stationsByRoute && !!trainsByRoute && !!routesInfoByRoute && !isLoadingAllTrains;

    if (!isReady) {
        return { routesInfo: routesInfoByRoute, stationsByRoute, trainsByRoute, isReady };
    }
    return { routesInfo: routesInfoByRoute, stationsByRoute, trainsByRoute, isReady };
};
