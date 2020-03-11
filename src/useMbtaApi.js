import { useEffect, useState } from 'react';

export const getTrainPositions = (...routes) =>
    fetch(`/trains/${routes.join(',')}`).then(res => res.json());

export const getStationsForRoute = route =>
    fetch(`/stations/${route}`).then(res => res.json());

export const useMbtaApi = lines => {
    const routeNames = lines
        .map(line => Object.keys(line.routes))
        .reduce((a, b) => [...a, ...b], [])
        .sort((a, b) => (a > b ? 1 : -1));

    const routeNamesKey = routeNames.join(',');
    const [stationsByRoute, setStationsByRoute] = useState(null);
    const [trainsByRoute, setTrainsByRoute] = useState(null);
    const isReady = !!stationsByRoute && !!trainsByRoute;

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
        const nextTrainsByRoute = {};
        routeNames.forEach(routeName => {
            nextTrainsByRoute[routeName] = [];
        });
        getTrainPositions(routeNames).then(trains => {
            trains.forEach(train => nextTrainsByRoute[train.route].push(train));
            setTrainsByRoute(nextTrainsByRoute);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [routeNamesKey]);

    return { stationsByRoute, trainsByRoute, isReady };
};
