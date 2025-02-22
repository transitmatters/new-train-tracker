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
    isReady: boolean;
}

// if isFirstRequest is true, get train positions from intial request data JSON
// if isFirstRequest is false, makes request for new train positions through backend server via chalice route defined in app.py
const getTrainPositions = (routes: string[]): Promise<Train[]> => {
    return fetch(`${APP_DATA_BASE_PATH}/trains/${routes.join(',')}`).then((res) => res.json());
};

const filterNew = (trains: Train[] | undefined) => {
    return trains?.filter((train) => train.isNewTrain);
};

const filterOld = (trains: Train[] | undefined) => {
    return trains?.filter((train) => !train.isNewTrain);
};

const filterGoogly = (trains: Train[] | undefined) => {
    return trains?.filter((train) => train.hasGooglyEyes);
};

const filterTrains = (trains: Train[] | undefined, vehiclesAge: VehicleCategory) => {
    let selectedTrains: Train[] | undefined = [];
    if (vehiclesAge === 'new_vehicles') {
        selectedTrains = filterNew(trains);
    } else if (vehiclesAge === 'old_vehicles') {
        selectedTrains = filterOld(trains);
    } else if (vehiclesAge === 'googly_eyes_vehicles') {
        selectedTrains = filterGoogly(trains);
    } else {
        selectedTrains = trains;
    }
    return selectedTrains;
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
): MBTAApi => {
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
        filterTrains(allTrains, vehiclesAge)?.forEach((train) =>
            nextTrainsByRoute[train.route].push(train)
        );
        return nextTrainsByRoute;
    }, [allTrains, routeNames, vehiclesAge]);

    useQuery({
        queryKey: ['getStations', routeNamesKey],
        queryFn: () => {
            const nextStopsByRoute: Record<string, Station[]> = {};
            Promise.all(
                routeNames.map((routeName) =>
                    getStationsForRoute(routeName).then((data) => {
                        nextStopsByRoute[routeName] = data;
                    })
                )
            ).then(() => setStationsByRoute(nextStopsByRoute));
        },
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

    const isReady = !!stationsByRoute && !!trainsByRoute && !!routesInfoByRoute && !isLoadingAllTrains;

    return {
        routesInfo: routesInfoByRoute,
        stationsByRoute,
        trainsByRoute,
        isReady,
    };
};
