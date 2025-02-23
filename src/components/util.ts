import { createContext } from 'react';
import { Route, Routes, Train } from '../types';

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
