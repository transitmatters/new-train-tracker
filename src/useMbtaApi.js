/*

Funcs that fetch data served by the backend in the form of the Initial Request Data JSON

*/

import { useEffect, useState, useCallback } from 'react';

import { getInitialDataByKey } from './initialData';

const getIsTestMode = () => {
    const params = new URLSearchParams(window.location.search);
    const val = params.get('testMode');
    return val === 'true' || !!parseInt(val);
};

// if isFirstRequest is true, get train positions from intial request data JSON
// if isFirstRequest is false, makes request for new train positions through backend server via Flask route defined in application.py
export const getTrainPositions = (routes, isTestMode, isFirstRequest) => {
    if (isFirstRequest) {
        const initialTrainsData = getInitialDataByKey('vehicles');
        if (initialTrainsData) {
            return Promise.resolve(initialTrainsData);
        }
    }
    const testSuffix = isTestMode ? '?testMode=1' : '';
    return fetch(`/trains/${routes.join(',')}${testSuffix}`).then(res => res.json());
};

export const getStationsForRoute = route => {
    const initialStopsData = getInitialDataByKey('stops');
    if (initialStopsData && initialStopsData[route]) {
        return Promise.resolve(initialStopsData[route]);
    }
    return fetch(`/stops/${route}`).then(res => res.json());
};

export const getRoutesInfo = routes => {
    const initialRoutesData = getInitialDataByKey('routes');
    if (initialRoutesData) {
        return Promise.resolve(initialRoutesData);
    }
    return fetch(`/routes/${routes.join(',')}`).then(res => res.json());
};

export const useMbtaApi = lines => {
    const routeNames = lines
        .map(line => Object.keys(line.routes))
        .reduce((a, b) => [...a, ...b], [])
        .sort((a, b) => (a > b ? 1 : -1));

    const routeNamesKey = routeNames.join(',');
    const [routesInfoByRoute, setRoutesInfoByRoute] = useState(null);
    const [stationsByRoute, setStationsByRoute] = useState(null);
    const [trainsByRoute, setTrainsByRoute] = useState(null);
    const [isInitialFetch, setIsInitialFetch] = useState(true);
    const isReady = !!stationsByRoute && !!trainsByRoute && !!routesInfoByRoute;

    const getTrains = useCallback(() => {
        const testMode = getIsTestMode();
        const nextTrainsByRoute = {};
        routeNames.forEach(routeName => {
            nextTrainsByRoute[routeName] = [];
        });
        getTrainPositions(routeNames, testMode, isInitialFetch).then(trains => {
            trains.forEach(train => nextTrainsByRoute[train.route].push(train));
            setTrainsByRoute(nextTrainsByRoute);
        });
        setIsInitialFetch(false);
    }, [routeNames, isInitialFetch]);

    useEffect(() => {
        const nextStopsByRoute = {};
        Promise.all(
            routeNames.map(routeName =>
                getStationsForRoute(routeName).then(data => {
                    nextStopsByRoute[routeName] = data;
                })
            )
        ).then(() => setStationsByRoute(nextStopsByRoute));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [routeNamesKey]);

    useEffect(() => {
        const nextRoutesInfo = {};
        getRoutesInfo(routeNames).then(routes => {
            routes.forEach(route => {
                nextRoutesInfo[route.id] = route;
            });
            setRoutesInfoByRoute(nextRoutesInfo);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [routeNamesKey]);

    useEffect(getTrains, [routeNamesKey]);

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
