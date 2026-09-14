/*
React hook that provides data from the MBTA API.

The fetch and filter layer lives in ./mbtaApi so it can be unit tested without
a react-query harness.
*/

import { useState, useMemo } from 'react';

import { Line, Route, Station, Train, VehicleCategory } from '../types';
import { ONE_DAY, FIFTEEN_SECONDS } from '../constants';
import { useQuery } from '@tanstack/react-query';
import {
    MBTAApiResponse,
    filterTrains,
    getRoutesInfo,
    getStationsForRoute,
    getTrainPositions,
} from './mbtaApi';

export type { MBTAApi, MBTAApiReady, MBTAApiResponse } from './mbtaApi';

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
            nextTrainsByRoute[train.route]?.push(train)
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
