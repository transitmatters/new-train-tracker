/*
File that contains a React hook that provides data from the MBTA API
Provides the __NTT_INITIAL_DATA__ JSON blob that is embedded in the initial server response
*/

import { useEffect, useState, useCallback } from 'react';

import { getInitialDataByKey } from '../initialData';
import { Line, Route, Station, Train, VehiclesAge } from '../types';

export interface MBTAApi {
    routesInfo: Record<string, Route> | null;
    stationsByRoute: Record<string, Station> | null;
    trainsByRoute: Record<string, Train[]> | null;
    isReady: boolean;
}

// if isFirstRequest is true, get train positions from intial request data JSON
// if isFirstRequest is false, makes request for new train positions through backend server via Flask route defined in application.py
const getTrainPositions = (routes: string[], isFirstRequest: boolean | null) => {
    if (isFirstRequest) {
        const initialTrainsData = getInitialDataByKey('vehicles');
        if (initialTrainsData) {
            return Promise.resolve(initialTrainsData);
        }
    }
    return fetch(`/trains/${routes.join(',')}`).then((res) => {
        res.json();
    });
};

const filterNew = (trains: Train[]) => {
    return trains.filter((train) => train.isNewTrain);
};

const filterOld = (trains: Train[]) => {
    return trains.filter((train) => !train.isNewTrain);
};

const filterTrains = (trains: Train[], vehiclesAge: VehiclesAge) => {
    let selectedTrains: Train[] = [];
    if (vehiclesAge === 'new_vehicles') {
        selectedTrains = filterNew(trains);
    } else if (vehiclesAge === 'old_vehicles') {
        selectedTrains = filterOld(trains);
    } else {
        selectedTrains = trains;
    }
    return selectedTrains;
};

const getStationsForRoute = (route: string) => {
    const initialStopsData = getInitialDataByKey('stops');
    if (initialStopsData && initialStopsData[route]) {
        return Promise.resolve(initialStopsData[route]);
    }
    return fetch(`/stops/${route}`).then((res) => res.json());
};

const getRoutesInfo = (routes: string[]) => {
    const initialRoutesData = getInitialDataByKey('routes');
    if (initialRoutesData) {
        return Promise.resolve(initialRoutesData);
    }
    return fetch(`/routes/${routes.join(',')}`).then((res) => res.json());
};

export const useMbtaApi = (lines: Line[], vehiclesAge: VehiclesAge = 'new_vehicles'): MBTAApi => {
    const routeNames = lines
        .map((line) => Object.keys(line.routes))
        .reduce((a, b) => [...a, ...b], [])
        .sort((a, b) => (a > b ? 1 : -1));

    const routeNamesKey = routeNames.join(',');
    const [routesInfoByRoute, setRoutesInfoByRoute] = useState<Record<string, Route> | null>(null);
    const [stationsByRoute, setStationsByRoute] = useState<Record<string, Station> | null>(null);
    const [trainsByRoute, setTrainsByRoute] = useState<Record<string, Train[]> | null>(null);
    const [isInitialFetch, setIsInitialFetch] = useState<boolean | null>(true);
    const isReady = !!stationsByRoute && !!trainsByRoute && !!routesInfoByRoute;

    const getTrains = useCallback(() => {
        const nextTrainsByRoute: Record<string, Train[]> = {};
        routeNames.forEach((routeName) => {
            nextTrainsByRoute[routeName] = [];
        });
        getTrainPositions(routeNames, isInitialFetch).then((trains: Train[]) => {
            filterTrains(trains, vehiclesAge).forEach((train) =>
                nextTrainsByRoute[train.route].push(train)
            );
            setTrainsByRoute(nextTrainsByRoute);
        });
        setIsInitialFetch(false);
    }, [routeNames, isInitialFetch, vehiclesAge]);

    useEffect(() => {
        const nextStopsByRoute: Record<string, Station> = {};
        Promise.all(
            routeNames.map((routeName) =>
                getStationsForRoute(routeName).then((data) => {
                    nextStopsByRoute[routeName] = data;
                })
            )
        ).then(() => setStationsByRoute(nextStopsByRoute));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [routeNamesKey]);

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

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(getTrains, [routeNamesKey, vehiclesAge]);

    useEffect(() => {
        const timeout = setTimeout(getTrains, 10 * 1000);
        return () => clearTimeout(timeout);
    }, [getTrains]);

    return {
        routesInfo: routesInfoByRoute,
        stationsByRoute,
        trainsByRoute,
        isReady,
    };
};
