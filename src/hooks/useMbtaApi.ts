/*
File that contains a React hook that provides data from the MBTA API
*/

import { useEffect, useState, useMemo } from 'react';

import { Line, Route, Station, Train, VehicleCategory } from '../types';
import { APP_DATA_BASE_PATH, ONE_HOUR, TEN_SECONDS } from '../constants';
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

// if isFirstRequest is true, get train positions from intial request data JSON
// if isFirstRequest is false, makes request for new train positions through backend server via chalice route defined in app.py
const getTrainPositions = (routes: string[]): Promise<Train[]> => {
    return fetch(`${APP_DATA_BASE_PATH}/trains/${routes.join(',')}`).then((res) => res.json());
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

const filterTrains = (trains: Train[], vehiclesAge: VehicleCategory) => {
    if (vehiclesAge === 'new_vehicles') {
        return filterNew(trains);
    } else if (vehiclesAge === 'old_vehicles') {
        return filterOld(trains);
    } else if (vehiclesAge === 'pride') {
        return filterPride(trains);
    }
    return trains;
};

const getStationsForRoute = (route: string) => {
    return fetch(`${APP_DATA_BASE_PATH}/stops/${route}`).then((res) => res.json());
};

const getRoutesInfo = (routes: string[]) => {
    return fetch(`${APP_DATA_BASE_PATH}/routes/${routes.join(',')}`).then((res) => res.json());
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
        staleTime: TEN_SECONDS,
        refetchInterval: TEN_SECONDS,
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
        queryFn: () => {
            const nextStopsByRoute: Record<string, Station[]> = {};
            return Promise.all(
                routeNames.map((routeName) =>
                    getStationsForRoute(routeName).then((data) => {
                        nextStopsByRoute[routeName] = data;
                    })
                )
            ).then(() => {
                setStationsByRoute(nextStopsByRoute);
                return nextStopsByRoute;
            });
        },
        // if routeNames is empty, don't make the request
        enabled: !!routeNames && routeNames.length > 0,
        staleTime: ONE_HOUR,
    });

    useEffect(() => {
        const nextRoutesInfo: Record<string, Route> = {};
        getRoutesInfo(routeNames).then((routes: Route[]) => {
            routes.forEach((route: Route) => {
                if (route.id) {
                    nextRoutesInfo[route.id] = route;
                }
            });
            setRoutesInfoByRoute(nextRoutesInfo);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [routeNamesKey]);

    const isReady =
        !!stationsByRoute && !!trainsByRoute && !!routesInfoByRoute && !isLoadingAllTrains;

    if (!isReady) {
        return { routesInfo: routesInfoByRoute, stationsByRoute, trainsByRoute, isReady };
    }
    return { routesInfo: routesInfoByRoute, stationsByRoute, trainsByRoute, isReady };
};
