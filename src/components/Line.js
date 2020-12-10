import React, { useMemo, useState, useLayoutEffect, useEffect } from 'react';
import classNames from 'classnames';
import * as timeago from 'timeago.js';

import { prerenderLine } from '../prerender';
import { renderTextTrainlabel } from '../labels';

import Train from './Train';
import { PopoverContainerContext, getTrainRoutePairsForLine, setCssVariable } from './util';
import { getInitialDataByKey } from '../initialData';

const abbreviateStationName = station =>
    station
        .replace('Boston College', 'B.C.')
        .replace('Hynes Convention Center', 'Hynes')
        .replace('Heath Street', 'Heath');

const sortTrainRoutePairsByDistance = (pairs, stationPositions) => {
    const distanceMap = new Map(
        pairs.map(pair => {
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
    return pairs.sort((a, b) => distanceMap.get(a) - distanceMap.get(b));
};

const renderEmptyNoticeForLine = line => {
    const sightings = getInitialDataByKey('sightings');
    const sightingForLine = sightings && sightings[line];
    if (sightingForLine) {
        const { car, time } = sightingForLine;
        const ago = timeago.format(time);
        return `A new ${line} Line train (#${car}) was last seen ${ago}.`;
    }
    return `No new trains on the ${line} Line right now.`;
};

const Line = props => {
    const { api, line } = props;
    const { getStationLabelPosition, shouldLabelTrain, fixedTrainLabelPosition } = line;
    const { stationsByRoute, trainsByRoute, routesInfo } = api;
    const [viewbox, setViewbox] = useState(undefined);
    const [svg, setSvg] = useState(null);
    const [shouldFocusOnFirstTrain, setShouldFocusOnFirstTrain] = useState(true);

    const colors = {
        lines: 'white',
        newTrains: line.color,
        background: line.colorSecondary,
    };

    const [container, setContainer] = useState(null);

    const { pathDirective, routes, stationPositions, stations } = useMemo(
        () => prerenderLine(line, stationsByRoute, routesInfo),
        [line, stationsByRoute, routesInfo]
    );

    const trainRoutePairs = getTrainRoutePairsForLine(trainsByRoute, routes);
    const hasTrains = trainRoutePairs.length > 0;

    const sortedTrainRoutePairs = sortTrainRoutePairsByDistance(trainRoutePairs, stationPositions);

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
            setCssVariable('--line-bbox-height', height);
            setCssVariable('--line-bbox-width', width);
        }
    }, [svg]);

    const renderLine = () => {
        return <path d={pathDirective} stroke={colors.lines} fill="transparent" />;
    };

    const renderStations = () => {
        return Object.entries(stationPositions).map(([stationId, pos]) => {
            const labelPosition = getStationLabelPosition(stationId);
            const stationName =
                stations[stationId] && abbreviateStationName(stations[stationId].name);

            const label = labelPosition && stationName && (
                <text
                    fontSize={4}
                    fill={colors.lines}
                    textAnchor={labelPosition === 'right' ? 'start' : 'end'}
                    x={labelPosition === 'right' ? 4 : -4}
                    y={1.5}
                    aria-hidden="true"
                >
                    {stationName}
                </text>
            );

            return (
                <g key={stationId} transform={`translate(${pos.x}, ${pos.y})`}>
                    <circle cx={0} cy={0} r={1} fill={colors.lines} />
                    {label}
                </g>
            );
        });
    };

    const renderTrains = () => {
        return sortedTrainRoutePairs.map(({ train, route }, index) => (
            <Train
                focusOnMount={shouldFocusOnFirstTrain && index === 0}
                key={train.label}
                train={train}
                route={route}
                colors={colors}
                alwaysLabelTrain={shouldLabelTrain(train)}
                labelPosition={fixedTrainLabelPosition}
            />
        ));
    };

    const renderTrainsForScreenreader = () => {
        return (
            <ul className="screenreader-only" aria-label={`New trains on the ${line.name} Line`}>
                {sortedTrainRoutePairs.map(({ train, route }) => (
                    <li key={train.id}>{renderTextTrainlabel(train, route)}</li>
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
                    {renderStations()}
                    {renderTrains()}
                </svg>
                {renderTrainsForScreenreader()}
            </PopoverContainerContext.Provider>
        </div>
    );
};

export default Line;
