import { createContext } from 'react';
import { Color, Route, Routes, Train } from '../types';

export const PopoverContainerContext = createContext<HTMLDivElement | null>(null);

export const getTrainRoutePairsForLine = (
    trainsByRoute: Record<string, Train[]>,
    routes: Routes
) => {
    const pairs: { train: Train; route: Route }[] = [];
    if (trainsByRoute) {
        Object.entries(trainsByRoute).forEach(([routeId, trains]) => {
            const route = routes[routeId];
            if (route) {
                trains.forEach((train) => {
                    pairs.push({ train, route });
                });
            }
        });
    }
    return pairs;
};

export const setCssVariable = (variable: string, value: string | null) => {
    document.documentElement.style.setProperty(variable, value);
};

let doesPreferReducedMotion: boolean | null = null;
export const prefersReducedMotion = () => {
    if (doesPreferReducedMotion === null) {
        doesPreferReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return doesPreferReducedMotion;
};

/*
Station-name abbreviations for the SVG map, where horizontal space is tight.

Deliberately a different table from the one in labels.tsx, which abbreviates for
the popover: the map shortens "Boston College" to "B.C.", the popover leaves it
alone. Both are tested so the divergence is visible rather than surprising.
*/
export const abbreviateStationNameForMap = (station: string) =>
    station
        .replace('Boston College', 'B.C.')
        .replace('Hynes Convention Center', 'Hynes')
        .replace('Heath Street', 'Heath');

/* Routes other than the focused one are dimmed; with nothing focused, all are full. */
export const getRouteColor = (
    colors: Color,
    routeId: string,
    focusedRouteId: string | null | undefined
) => {
    return routeId === focusedRouteId || focusedRouteId === null || focusedRouteId === undefined
        ? colors.route
        : colors.unfocusedRoute;
};
