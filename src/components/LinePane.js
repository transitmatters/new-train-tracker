import React, { useMemo, useState, useEffect } from 'react';
import classNames from 'classnames';

import { prerenderLine } from '../prerender';
import Train from './Train';
import { PopoverContainerContext } from './util';

const renderViewboxForBounds = (bounds, padding = 5) => {
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
        api: { stationsByRoute, trainsByRoute, routesInfo },
        line,
        active,
    } = props;

    const colors = {
        lines: 'white',
        trains: 'white',
        background: line.colorBright,
    };

    const [container, setContainer] = useState(null);

    const { pathDirective, bounds, routes, stationPositions } = useMemo(
        () => prerenderLine(line, stationsByRoute, routesInfo),
        [line, stationsByRoute, routesInfo]
    );

    useEffect(() => {
        if (active) {
            document.body.style.backgroundColor = colors.background;
        }
    }, [active, colors.background]);

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
        <div
            ref={setContainer}
            className={classNames('line-pane', line.name.toLowerCase())}
            style={{ background: colors.background }}
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
