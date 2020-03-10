import {
    createRouteInterpolator,
    createInterpolatorForSegments,
} from './interpolation';

const createBounds = () => {
    return { top: 0, bottom: 0, left: 0, right: 0 };
};

const captureTurtleInBounds = (bounds, turtle) => {
    const { top, bottom, left, right } = bounds;
    const { x, y } = turtle;
    return {
        top: Math.min(y, top),
        bottom: Math.max(y, bottom),
        left: Math.min(x, left),
        right: Math.max(x, right),
    };
};

const getUnionForBounds = (a, b) => {
    return {
        top: Math.min(a.top, b.top),
        bottom: Math.max(a.bottom, b.bottom),
        left: Math.min(a.left, b.left),
        right: Math.max(a.right, b.right),
    };
};

const createPathBuilder = () => {
    let path = '';
    return {
        add: nextPath => {
            if (path.length === 0) {
                path = nextPath;
            }
            path = path + ' ' + nextPath;
        },
        get: () => path,
    };
};

const prerenderRoute = (shape, stationIds) => {
    const [start, ...entries] = shape;
    const pathBuilder = createPathBuilder();
    const stationPositions = {};
    const routeInterpolator = createRouteInterpolator();

    if (start.type !== 'start') {
        throw new Error('Route must begin with a start() command');
    }
    let { turtle } = start;
    let bounds = captureTurtleInBounds(createBounds(), turtle);

    const consumeCommand = command => {
        const segment = command(turtle);
        const { path, turtle: nextTurtle } = segment;
        turtle = nextTurtle;
        bounds = captureTurtleInBounds(bounds, turtle);
        pathBuilder.add(path);
        return segment;
    };

    entries.forEach(entry => {
        if (entry.type === 'stationRange') {
            const { start, end, commands } = entry;
            const segmentsInRange = [];
            const stationIdsWithinRange = stationIds.slice(
                stationIds.indexOf(start),
                stationIds.indexOf(end) + 1
            );

            commands.forEach(command => {
                const segment = consumeCommand(command);
                segmentsInRange.push(segment);
            });

            const stationFractions = {};
            const positionMapper = createInterpolatorForSegments(
                segmentsInRange
            );

            stationIdsWithinRange.forEach((stationId, index) => {
                const fraction =
                    stationIdsWithinRange.length === 1
                        ? 0.5
                        : index / (stationIdsWithinRange.length - 1);
                stationFractions[stationId] = fraction;
                stationPositions[stationId] = positionMapper(fraction);
            });

            routeInterpolator.addStationRange(
                entry,
                stationIdsWithinRange,
                stationFractions,
                positionMapper
            );
        } else {
            const segment = consumeCommand(entry);
            routeInterpolator.addSegment(segment);
        }
    });
    return {
        bounds: bounds,
        pathDirective: pathBuilder.get(),
        stationPositions,
        routeInterpolator,
    };
};

export const prerenderLine = (line, stationsByRoute) => {
    const routeInterpolators = [];
    const totalPathBuilder = createPathBuilder();
    let totalBounds = createBounds();
    let totalStationPositions = {};
    Object.entries(line.routes).forEach(([routeName, { shape }]) => {
        const stationIds = stationsByRoute[routeName].map(s => s.id);
        const {
            bounds,
            pathDirective,
            stationPositions,
            routeInterpolator,
        } = prerenderRoute(shape, stationIds);
        routeInterpolators.push(routeInterpolator);
        totalStationPositions = {
            ...totalStationPositions,
            ...stationPositions,
        };
        totalPathBuilder.add(pathDirective);
        totalBounds = getUnionForBounds(totalBounds, bounds);
    });
    return {
        routeInterpolators,
        bounds: totalBounds,
        pathDirective: totalPathBuilder.get(),
        stationPositions: totalStationPositions,
    };
};
