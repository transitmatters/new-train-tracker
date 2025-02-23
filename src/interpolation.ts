import { Segment, Station, Train } from './types';

const geoDistance = (from: Station | Train, to: Station | Train) => {
    return Math.sqrt((from.latitude - to.latitude) ** 2 + (from.longitude - to.longitude) ** 2);
};

const getTrainDistanceFraction = (fromStation: Station, toStation: Station, train: Train) => {
    const trainDistance = geoDistance(fromStation, train);
    const totalDistance = geoDistance(fromStation, toStation);
    return Math.min(1, trainDistance / totalDistance);
};

export const interpolateTrainOffset = (train: Train, stations: Station[] | undefined) => {
    const { stationId, direction, currentStatus } = train;
    const toStation = stations?.find((station) => station.id === stationId);
    if (!toStation) {
        // The train is leaving its specified route; this can happen e.g. when a Green-B train
        // turns around at Park but is perceived to be moving toward Government Center.
        const closestStation = stations?.reduce(
            (best, next) => {
                const distance = geoDistance(train, next);
                if (distance < best.distance) {
                    return {
                        station: next,
                        distance,
                    };
                }
                return best;
            },
            { distance: Infinity, station: undefined as Station | undefined }
        ).station;

        return closestStation?.offset;
    }
    // If we get here, stations exists. We either have a valid stationId or we've already exited
    if (currentStatus !== 'STOPPED_AT' && stations) {
        const indexOfStation = stations.indexOf(toStation);
        const fromStation =
            direction === 0 ? stations[indexOfStation - 1] : stations[indexOfStation + 1];

        if (fromStation) {
            const fromOffset = fromStation.offset;
            const toOffset = toStation.offset;
            const offsetDistance = toOffset - fromOffset;

            const trainDistanceFraction = getTrainDistanceFraction(fromStation, toStation, train);

            return offsetDistance > 0
                ? fromOffset + trainDistanceFraction * offsetDistance
                : toOffset - trainDistanceFraction * offsetDistance;
        }
    }
    return toStation.offset;
};

export const createInterpolatorForSegments = (segments: Segment[]) => {
    return (partialLength: number) => {
        let accumulatedLength = 0;
        let ptr = 0;
        while (accumulatedLength <= partialLength) {
            accumulatedLength += segments[ptr].length;
            if (accumulatedLength < partialLength) {
                if (ptr < segments.length) {
                    ++ptr;
                } else {
                    throw new Error('Ran out of track while mapping position to segment!');
                }
            } else {
                break;
            }
        }
        const segment = segments[ptr];
        const overshootWithinSegment = accumulatedLength - partialLength;
        return segment.get(1 - overshootWithinSegment / segment.length);
    };
};
