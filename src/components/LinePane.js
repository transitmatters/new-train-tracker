import React, { useMemo } from 'react';

import { prerenderLine } from '../prerender';
import Train from './Train';

const renderViewboxForBounds = (bounds, padding = 20) => {
    const { top, bottom, left, right } = bounds;
    const width = right - left + padding * 2;
    const height = bottom - top + padding * 2;
    const minX = left - padding;
    const minY = top - padding;
    return `${minX} ${minY} ${width} ${height}`;
};

const renderRelativeStyles = ({ width, height }) => {
    if (width > height) {
        return { width: '100%' };
    }
    return { height: '100%' };
};

const LinePane = props => {
    const {
        api: { stationsByRoute, trainsByRoute },
        line,
    } = props;

    const colors = {
        lines: 'white',
        trains: 'white',
        background: line.colorBright,
    };

    const { pathDirective, bounds, routes, stationPositions } = useMemo(
        () => prerenderLine(line, stationsByRoute),
        [line, stationsByRoute]
    );

    const viewbox = renderViewboxForBounds(bounds);

    const renderLine = () => {
        return (
            <path d={pathDirective} stroke={colors.lines} fill="transparent" />
        );
    };

    const renderStations = () => {
        return Object.entries(stationPositions).map(([stationId, pos]) => (
            <circle
                key={stationId}
                cx={pos.x}
                cy={pos.y}
                r={1}
                fill={colors.lines}
            />
        ));
    };

    const renderTrains = () => {
        return Object.entries(trainsByRoute)
            .map(([routeId, trains]) => {
                const route = routes[routeId];
                return trains.map(train => (
                    <Train
                        key={train.label}
                        train={train}
                        route={route}
                        colors={colors}
                    />
                ));
            })
            .reduce((a, b) => [...a, ...b], []);
    };

    return (
        <div className="line-pane" style={{ background: colors.background }}>
            <svg viewBox={viewbox} style={renderRelativeStyles(viewbox)}>
                {renderLine()}
                {renderStations()}
                {renderTrains()}
            </svg>
        </div>
    );
};

export default LinePane;
