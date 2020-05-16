import React from 'react';

export const PopoverContainerContext = React.createContext(null);

export const getTrainRoutePairsForLine = (trainsByRoute, routes, newOnly = true) => {
    const pairs = [];
    Object.entries(trainsByRoute).forEach(([routeId, trains]) => {
        const route = routes[routeId];
        if (route) {
            trains.forEach(train => {
                if (!newOnly || train.isNewTrain) {
                    pairs.push({ train, route });
                }
            });
        }
    });
    return pairs;
};

export const setCssVariable = (variable, value) => {
    document.documentElement.style.setProperty(variable, value);
};

let doesPreferReducedMotion = null;
export const prefersReducedMotion = () => {
    if (doesPreferReducedMotion === null) {
        doesPreferReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return doesPreferReducedMotion;
};
