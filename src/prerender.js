import { createInterpolatorForSegments } from './interpolation';

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

const getStationIdsWithinRange = (stationRange, stationIds) => {
    const { start, end, stations } = stationRange;
    if (stations) {
        return stations;
    }
    const startIndex = stationIds.indexOf(start);
    const endIndex = stationIds.indexOf(end);
    if (startIndex === -1 || endIndex === -1) {
        throw new Error(
            `Improper use of {start=${start}, end=${end}} properties for stationRange. ` +
                'These stations do not exist on retrieved GTFS route -- ' +
                'consider using stationRange.stations property instead.'
        );
    }
    return stationIds.slice(startIndex, endIndex + 1);
};

const getStationPositions = (stationOffsets, pathInterpolator) => {
    const positions = {};
    Object.entries(stationOffsets).forEach(([stationId, offset]) => {
        positions[stationId] = pathInterpolator(offset);
    });
    return positions;
};

const prerenderRoute = (shape, stationIds) => {
    const [start, ...entries] = shape;
    const pathBuilder = createPathBuilder();
    const segments = [];
    const stationOffsets = {};
    let totalLength = 0;

    if (start.type !== 'start') {
        throw new Error('Route must begin with a start() command');
    }
    let { turtle } = start;
    let bounds = captureTurtleInBounds(createBounds(), turtle);

    const consumeCommand = command => {
        const segment = command(turtle);
        const { path, length, turtle: nextTurtle } = segment;
        segments.push(segment);
        totalLength += length;
        turtle = nextTurtle;
        bounds = captureTurtleInBounds(bounds, turtle);
        pathBuilder.add(path);
        return segment;
    };

    entries.forEach(entry => {
        if (entry.type === 'stationRange') {
            const initialLength = totalLength;
            const segmentsInRange = [];
            const stationIdsWithinRange = getStationIdsWithinRange(
                entry,
                stationIds
            );

            entry.commands.forEach(command => {
                const segment = consumeCommand(command);
                segmentsInRange.push(segment);
            });

            const segmentsLength = totalLength - initialLength;

            stationIdsWithinRange.forEach((stationId, index) => {
                const fraction =
                    stationIdsWithinRange.length === 1
                        ? 0.5
                        : index / (stationIdsWithinRange.length - 1);
                stationOffsets[stationId] =
                    initialLength + fraction * segmentsLength;
            });
        } else {
            consumeCommand(entry);
        }
    });

    return {
        stationOffsets,
        bounds: bounds,
        pathDirective: pathBuilder.get(),
        pathInterpolator: createInterpolatorForSegments(segments),
    };
};

export const prerenderLine = (line, stationsByRoute, routesInfo) => {
    const pathBuilder = createPathBuilder();
    let bounds = createBounds();
    let routes = {};
    let stationPositions = {};
    Object.entries(line.routes).forEach(([routeId, { shape }]) => {
        const stations = stationsByRoute[routeId];
        const routeInfo = routesInfo[routeId];
        const stationIds = stations.map(s => s.id);
        const {
            pathInterpolator,
            stationOffsets,
            pathDirective,
            bounds: partialBounds,
        } = prerenderRoute(shape, stationIds);
        const route = {
            ...routeInfo,
            id: routeId,
            pathInterpolator: pathInterpolator,
            stations: stations.map(station => {
                return {
                    id: station.id,
                    name: station.name,
                    latitude: station.latitude,
                    longitude: station.longitude,
                    offset: stationOffsets[station.id],
                };
            }),
        };
        stationPositions = {
            ...stationPositions,
            ...getStationPositions(stationOffsets, pathInterpolator),
        };
        routes[routeId] = route;
        pathBuilder.add(pathDirective);
        bounds = getUnionForBounds(bounds, partialBounds);
    });
    return {
        bounds: bounds,
        routes: routes,
        pathDirective: pathBuilder.get(),
        stationPositions: stationPositions,
    };
};
