import { useEffect, useState, useCallback } from 'react';

export const getIsTestMode = () => {
    const params = new URLSearchParams(window.location.search);
    const val = params.get('testMode');
    return val === 'true' || !!parseInt(val);
};

export const getTrainPositions = (routes, isTestMode) => {
    const testSuffix = isTestMode ? '?testMode=1' : '';
    return fetch(`/trains/${routes.join(',')}${testSuffix}`).then(res => res.json());
};

export const getStationsForRoute = route => fetch(`/stations/${route}`).then(res => res.json());

export const getRoutesInfo = routes => fetch(`/routes/${routes.join(',')}`).then(res => res.json());

export const useMbtaApi = lines => {
    const routeNames = lines
        .map(line => Object.keys(line.routes))
        .reduce((a, b) => [...a, ...b], [])
        .sort((a, b) => (a > b ? 1 : -1));

    const routeNamesKey = routeNames.join(',');
    const [routesInfoByRoute, setRoutesInfoByRoute] = useState(null);
    const [stationsByRoute, setStationsByRoute] = useState(null);
    const [trainsByRoute, setTrainsByRoute] = useState(null);
    const isReady = !!stationsByRoute && !!trainsByRoute && !!routesInfoByRoute;

    const getTrains = useCallback(() => {
        const testMode = getIsTestMode();
        const nextTrainsByRoute = {};
        routeNames.forEach(routeName => {
            nextTrainsByRoute[routeName] = [];
        });
        getTrainPositions(routeNames, testMode).then(trains => {
            trains.forEach(train => nextTrainsByRoute[train.route].push(train));
            setTrainsByRoute(nextTrainsByRoute);
        });
    }, [routeNames]);

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
