import { createInterpolatorForSegments } from './interpolation';
import { Line, LineShape, Route, Segment, Shape, Station, StationPositions, Turtle } from './types';

const createPathBuilder = () => {
    let path = '';
    return {
        add: (nextPath: string) => {
            if (path.length === 0) {
                path = nextPath;
            }
            path = path + ' ' + nextPath;
        },
        get: () => path,
    };
};

const getStationIdsWithinRange = (stationRange: Shape, stationIds: string[] | undefined) => {
    const { start, end, stations } = stationRange;
    if (stations) {
        return stations;
    }
    if (!start || !end) {
        return [];
    }

    // If stationIds is empty or undefined, return empty array gracefully
    if (!stationIds || stationIds.length === 0) {
        return [];
    }

    const startIndex = stationIds.indexOf(start);
    const endIndex = stationIds.indexOf(end);
    if (startIndex === -1 || endIndex === -1) {
        return [];
    }

    return stationIds.slice(startIndex, endIndex + 1);
};

const getStationPositions = (
    stationOffsets: {
        [x: string]: number;
    },
    pathInterpolator: (partialLength: number) => Turtle
): StationPositions => {
    const positions: StationPositions = {};
    Object.entries(stationOffsets).forEach(([stationId, offset]) => {
        positions[stationId] = pathInterpolator(offset);
    });
    return positions;
};

const prerenderRoute = (shape: LineShape[], stationIds: string[] | undefined) => {
    const [start, ...entries] = shape;
    const pathBuilder = createPathBuilder();
    const segments: Segment[] = [];
    const stationOffsets: { [key in string]: number } = {};
    let totalLength = 0;

    if (typeof start !== 'function' && start.type !== 'start') {
        throw new Error('Route must begin with a start() command');
    }
    let { turtle } = start as Shape;

    const consumeCommand = (command: ((command: Turtle) => Segment) | any) => {
        const segment: Segment = command(turtle);
        const { path, length, turtle: nextTurtle } = segment;
        segments.push(segment);
        totalLength += length;
        turtle = nextTurtle;
        pathBuilder.add(path);
        return segment;
    };

    entries.forEach((entry) => {
        if (typeof entry !== 'function' && entry.type === 'stationRange') {
            const initialLength = totalLength;
            const segmentsInRange: Segment[] = [];
            const stationIdsWithinRange = getStationIdsWithinRange(entry, stationIds);

            entry.commands?.forEach((command) => {
                const segment = consumeCommand(command);
                segmentsInRange.push(segment);
            });

            const segmentsLength = totalLength - initialLength;

            stationIdsWithinRange?.forEach((stationId, index) => {
                const fraction =
                    stationIdsWithinRange.length === 1
                        ? 0.5
                        : index / (stationIdsWithinRange.length - 1);
                stationOffsets[stationId] = initialLength + fraction * segmentsLength;
            });
        } else {
            consumeCommand(entry);
        }
    });

    return {
        stationOffsets,
        pathDirective: pathBuilder.get(),
        pathInterpolator: createInterpolatorForSegments(segments),
    };
};

export const prerenderLine = (
    line: Line,
    stationsByRoute: Record<string, Station[]>,
    routesInfo: Record<string, Route>
): {
    routes: Record<string, Route>;
    stations: Record<string, Station>;
    pathDirective: string;
    stationPositions: StationPositions;
} => {
    const pathBuilder = createPathBuilder();
    const routes: Record<string, Route> = {};
    let stationPositions: StationPositions = {};
    Object.entries(line.routes).forEach(([routeId, { shape }]) => {
        const stations = stationsByRoute[routeId];
        const routeInfo = routesInfo[routeId];
        // Safely get station IDs, handling missing/invalid data
        const stationIds = Array.isArray(stations) ? stations.map((s) => s.id) : [];
        const { pathInterpolator, stationOffsets, pathDirective } = prerenderRoute(
            shape,
            stationIds
        );
        const routeStationPositions = getStationPositions(stationOffsets, pathInterpolator);
        const route: Route = {
            ...routeInfo,
            id: routeId,
            pathInterpolator: pathInterpolator,
            stations: Array.isArray(stations)
                ? stations.map((station) => {
                      return {
                          id: station.id,
                          name: station.name,
                          latitude: station.latitude,
                          longitude: station.longitude,
                          offset: stationOffsets[station.id],
                      };
                  })
                : [],
            stationPositions: routeStationPositions,
            pathDirective,
        };
        stationPositions = {
            ...stationPositions,
            ...routeStationPositions,
        };
        routes[routeId] = route;
        pathBuilder.add(pathDirective);
    });
    return {
        routes: routes,
        stations: Object.values(routes).reduce((partial, route) => {
            return {
                ...partial,
                ...route.stations?.reduce((routePartial, station) => {
                    return {
                        ...routePartial,
                        [station.id]: station,
                    };
                }, {}),
            };
        }, {}),
        pathDirective: pathBuilder.get(),
        stationPositions: stationPositions,
    };
};
