import React, {
    useMemo,
    useState,
    useEffect,
    useRef,
    useLayoutEffect,
} from 'react';
import classNames from 'classnames';

import { prerenderLine } from '../prerender';
import Train from './Train';
import { PopoverContainerContext, getTrainRoutePairsForLine } from './util';

const abbreviateStationName = station =>
    station
        .replace('Boston College', 'B.C.')
        .replace('Hynes Convention Center', 'Hynes')
        .replace('Heath Street', 'Heath');

const renderViewboxForBounds = (
    bounds,
    { paddingX = 5, paddingY = 5 } = {}
) => {
    const { top, bottom, left, right } = bounds;
    const width = right - left + paddingX * 2;
    const height = bottom - top + paddingY * 2;
    const minX = left - paddingX;
    const minY = top - paddingY;
    return `${minX} ${minY} ${width} ${height}`;
};

const renderRelativeStyles = ({ width, height }) => {
    if (width > height) {
        return { width: '100%' };
    }
    return { height: '100%' };
};

const LinePane = props => {
    const { api, line, headerElement } = props;
    const { getStationLabelPosition, shouldLabelTrain } = line;
    const { stationsByRoute, trainsByRoute, routesInfo } = api;
    const [lineOffset, setLineOffset] = useState(null);
    const firstStationRef = useRef(null);

    const colors = {
        lines: 'white',
        newTrains: line.color,
        background: line.colorBright,
    };

    const [container, setContainer] = useState(null);

    const {
        pathDirective,
        bounds,
        routes,
        stationPositions,
        stations,
    } = useMemo(() => prerenderLine(line, stationsByRoute, routesInfo), [
        line,
        stationsByRoute,
        routesInfo,
    ]);

    useLayoutEffect(() => {
        const { current: firstStation } = firstStationRef;
        if (firstStation) {
            const { x } = firstStation.getBoundingClientRect();
            setLineOffset(x);
        }
    }, []);

    const viewbox = renderViewboxForBounds(bounds, {
        paddingX: 100,
        paddingY: 5,
    });

    const renderLine = () => {
        return (
            <path d={pathDirective} stroke={colors.lines} fill="transparent" />
        );
    };

    const renderStations = () => {
        const { closestId } = Object.entries(stationPositions).reduce(
            ({ closestId, shortestDistance }, [nextId, nextPosition]) => {
                const { x, y } = nextPosition;
                const nextDistance = Math.sqrt(x ** 2 + y ** 2);
                if (nextDistance < shortestDistance) {
                    return {
                        closestId: nextId,
                        shortestDistance: nextDistance,
                    };
                }
                return { closestId, shortestDistance };
            },
            { closestId: null, shortestDistance: Infinity }
        );

        return Object.entries(stationPositions).map(([stationId, pos]) => {
            const maybeRefProps =
                stationId === closestId ? { ref: firstStationRef } : {};

            const labelPosition = getStationLabelPosition(stationId);

            const stationName =
                stations[stationId] &&
                abbreviateStationName(stations[stationId].name);

            const label = labelPosition && stationName && (
                <text
                    fontSize={4}
                    fill={colors.lines}
                    textAnchor={labelPosition === 'right' ? 'start' : 'end'}
                    x={labelPosition === 'right' ? 4 : -4}
                    y={1.5}
                >
                    {stationName}
                </text>
            );

            return (
                <g
                    key={stationId}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    {...maybeRefProps}
                >
                    <circle cx={0} cy={0} r={1} fill={colors.lines} />
                    {label}
                </g>
            );
        });
    };

    const renderTrains = () => {
        return getTrainRoutePairsForLine(
            trainsByRoute,
            routes
        ).map(({ train, route }) => (
            <Train
                key={train.label}
                train={train}
                route={route}
                colors={colors}
                labelTrain={shouldLabelTrain(train)}
            />
        ));
    };

    return (
        <div
            ref={setContainer}
            className={classNames('line-pane', line.name.toLowerCase())}
        >
            <PopoverContainerContext.Provider value={container}>
                <svg viewBox={viewbox} style={renderRelativeStyles(viewbox)}>
                    {renderLine()}
                    {renderStations()}
                    {renderTrains()}
                </svg>
            </PopoverContainerContext.Provider>
        </div>
    );
};

export default LinePane;
