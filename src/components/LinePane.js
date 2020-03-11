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

    const styleProps = {
        accent: line.color,
        base: 'white',
    };

    const { pathDirective, bounds, routes, stationPositions } = useMemo(
        () => prerenderLine(line, stationsByRoute),
        [line, stationsByRoute]
    );

    const viewbox = renderViewboxForBounds(bounds);

    const renderLine = () => {
        return (
            <path
                d={pathDirective}
                stroke={styleProps.base}
                fill="transparent"
            />
        );
    };

    const renderStations = () => {
        return Object.entries(stationPositions).map(([stationId, pos]) => (
            <circle
                key={stationId}
                cx={pos.x}
                cy={pos.y}
                r={1}
                fill={styleProps.base}
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
                        styleProps={styleProps}
                    />
                ));
            })
            .reduce((a, b) => [...a, ...b], []);
    };

    return (
        <div className="line-pane" style={{ background: styleProps.accent }}>
            <svg viewBox={viewbox} style={renderRelativeStyles(viewbox)}>
                {renderLine()}
                {renderStations()}
                {renderTrains()}
            </svg>
        </div>
    );
};

export default LinePane;
