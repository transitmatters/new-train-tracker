import { useMemo, useState, useLayoutEffect, useEffect } from 'react';
import classNames from 'classnames';
import * as timeago from 'timeago.js';

import { prerenderLine } from '../prerender';
import { renderTextTrainlabel } from '../labels';

import { Train } from './Train';
import { PopoverContainerContext, getTrainRoutePairsForLine, setCssVariable } from './util';
import { getInitialDataByKey } from '../initialData';
import { Line as TLine, Pair, StationPositions } from '../types';
import { MBTAApi } from '../hooks/useMbtaApi';

interface LineProps {
    api: MBTAApi;
    line: TLine;
}

const abbreviateStationName = (station: string) =>
    station
        .replace('Boston College', 'B.C.')
        .replace('Hynes Convention Center', 'Hynes')
        .replace('Heath Street', 'Heath');

const sortTrainRoutePairsByDistance = (pairs: Pair[], stationPositions: StationPositions) => {
    const distanceMap = new Map(
        pairs.map((pair) => {
            const { train } = pair;
            const station = stationPositions[train.stationId];
            if (station) {
                const { x, y } = station;
                const distance = Math.sqrt(x ** 2 + y ** 2);
                return [pair, distance];
            }
            return [pair, 0];
        })
    );
    // @ts-expect-error pair could in theory not exist in map, resulting in undefined subtraction, but unlikely
    return pairs.sort((a, b) => distanceMap.get(a) - distanceMap.get(b));
};

const renderEmptyNoticeForLine = (line) => {
    const sightings = getInitialDataByKey('sightings');
    const sightingForLine = sightings && sightings[line];
    if (sightingForLine) {
        const { car, time } = sightingForLine;
        const ago = timeago.format(time);
        return `A new ${line} Line train (#${car}) was last seen ${ago}.`;
    }
    return `No new trains on the ${line} Line right now.`;
};

const getRouteColor = (colors, routeId, focusedRouteId) => {
    return routeId === focusedRouteId || focusedRouteId === null
        ? colors.route
        : colors.unfocusedRoute;
};

export const Line: React.FC<LineProps> = ({ api, line }) => {
    const { getStationLabelPosition, fixedTrainLabelPosition } = line;
    const { stationsByRoute, trainsByRoute, routesInfo } = api;
    const [viewbox, setViewbox] = useState<string>();
    const [svg, setSvg] = useState<SVGSVGElement | null>(null);
    const [shouldFocusOnFirstTrain, setShouldFocusOnFirstTrain] = useState(true);
    const [focusedRouteId, setFocusedRouteId] = useState<string | undefined>();

    const colors = {
        route: 'white',
        unfocusedRoute: '#ffffff55',
        train: line.color,
        background: line.colorSecondary,
    };

    const [container, setContainer] = useState<HTMLDivElement | null>(null);

    const { routes, stationPositions, stations } = useMemo(
        () => prerenderLine(line, stationsByRoute, routesInfo),
        [line, stationsByRoute, routesInfo]
    );

    const trainRoutePairs = getTrainRoutePairsForLine(trainsByRoute, routes);
    const hasTrains = trainRoutePairs.length > 0;
    const sortedTrainRoutePairs = sortTrainRoutePairsByDistance(trainRoutePairs, stationPositions);
    const renderedStationLabelIds = new Set();

    useEffect(() => {
        setShouldFocusOnFirstTrain(!hasTrains);
    }, [hasTrains]);

    useLayoutEffect(() => {
        if (svg) {
            const paddingX = 2;
            const paddingY = 2;
            const bbox = svg.getBBox();
            const x = bbox.x - paddingX;
            const width = bbox.width + paddingX * 2;
            const y = bbox.y - paddingY;
            const height = bbox.height + paddingY * 2;
            setViewbox(`${x} ${y} ${width} ${height}`);
            setCssVariable('--line-bbox-height', height.toString());
            setCssVariable('--line-bbox-width', width.toString());
        }
    }, [svg]);

    const renderLine = () => {
        const pathsByRoute = Object.entries(routes).map(([routeId, { pathDirective }]) => {
            const routeColor = getRouteColor(colors, routeId, focusedRouteId);
            return <path key={routeId} d={pathDirective} stroke={routeColor} fill="transparent" />;
        });
        return <>{pathsByRoute}</>;
    };

    const renderStationDots = () => {
        return Object.entries(routes)
            .map(([routeId, { stationPositions }]) => {
                const routeColor = getRouteColor(colors, routeId, focusedRouteId);
                if (stationPositions) {
                    return Object.entries(stationPositions).map(([stationId, pos]) => {
                        return (
                            <circle
                                cx={0}
                                cy={0}
                                r={1}
                                key={`${routeId}-${stationId}-dot`}
                                transform={`translate(${pos.x}, ${pos.y})`}
                                fill={routeColor}
                            />
                        );
                    });
                }
            })
            .flat();
    };

    const renderTrains = () => {
        return sortedTrainRoutePairs.map(({ train, route }, index) => (
            <Train
                focusOnMount={shouldFocusOnFirstTrain && index === 0}
                key={train.label}
                train={train}
                route={route}
                colors={colors}
                labelPosition={fixedTrainLabelPosition}
                onFocus={() => setFocusedRouteId(route.id)}
                onBlur={() => setFocusedRouteId(undefined)}
            />
        ));
    };

    const renderStationLabelsForRouteId = (routeId) => {
        const { stationPositions } = routes[routeId];
        const isRouteFocused = routeId === focusedRouteId;
        if (stationPositions) {
            return Object.entries(stationPositions).map(([stationId, pos]) => {
                if (renderedStationLabelIds.has(stationId)) {
                    return null;
                }
                const labelPosition = getStationLabelPosition({
                    stationId,
                    routeId,
                    isRouteFocused,
                });
                const stationName =
                    stations[stationId] && abbreviateStationName(stations[stationId].name);
                if (labelPosition && stationName) {
                    renderedStationLabelIds.add(stationId);
                    return (
                        <text
                            key={`station-label-${stationId}`}
                            fontSize={4}
                            fill={colors.route}
                            textAnchor={labelPosition === 'right' ? 'start' : 'end'}
                            x={labelPosition === 'right' ? 4 : -4}
                            y={1.5}
                            aria-hidden="true"
                            transform={`translate(${pos.x}, ${pos.y})`}
                        >
                            {stationName}
                        </text>
                    );
                }
                return null;
            });
        }
    };

    const renderLabelsForUnfocusedStations = () => {
        return Object.keys(routes)
            .filter((routeId) => routeId !== focusedRouteId)
            .map(renderStationLabelsForRouteId);
    };

    const renderLabelsForFocusedStations = () => {
        if (focusedRouteId) {
            return renderStationLabelsForRouteId(focusedRouteId);
        }
        return null;
    };

    const renderTrainsForScreenreader = () => {
        return (
            <ul className="screenreader-only" aria-label={`New trains on the ${line.name} Line`}>
                {sortedTrainRoutePairs.map(({ train, route }) => (
                    <li key={train.tripId}>{renderTextTrainlabel(train, route)}</li>
                ))}
            </ul>
        );
    };

    if (trainRoutePairs.length === 0) {
        return (
            <div className="line-pane empty">
                <div className="empty-notice">{renderEmptyNoticeForLine(line.name)}</div>
            </div>
        );
    }

    return (
        <div ref={setContainer} className={classNames('line-pane', line.name.toLowerCase())}>
            <PopoverContainerContext.Provider value={container}>
                <svg
                    ref={setSvg}
                    viewBox={viewbox}
                    aria-hidden="true"
                    preserveAspectRatio="xMidYMin"
                >
                    {renderLine()}
                    {renderLabelsForUnfocusedStations()}
                    {renderStationDots()}
                    {renderTrains()}
                    {renderLabelsForFocusedStations()}
                </svg>
                {renderTrainsForScreenreader()}
            </PopoverContainerContext.Provider>
        </div>
    );
};
