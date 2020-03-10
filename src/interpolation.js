const geoDistance = (from, to) => {
    return Math.sqrt(
        (from.latitude - to.latitude) ** 2 +
            (from.longitude - to.longitude) ** 2
    );
};

const getTrainDistanceFraction = (fromStation, toStation, train) => {
    const trainDistance = geoDistance(fromStation, train);
    const totalDistance = geoDistance(fromStation, toStation);
    return Math.min(1, trainDistance / totalDistance);
};

export const createInterpolatorForSegments = segments => {
    return partialLength => {
        let accumulatedLength = 0;
        let ptr = 0;
        while (accumulatedLength <= partialLength) {
            accumulatedLength += segments[ptr].length;
            if (accumulatedLength < partialLength) {
                if (ptr < segments.length) {
                    ++ptr;
                } else {
                    throw new Error(
                        'Ran out of track while mapping position to segment!'
                    );
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

export const createInterStationInterpolator = (
    pathInterpolator,
    stationOffsets
) => {
    return (fromStation, toStation, train) => {
        const fromOffset = stationOffsets[fromStation.id];
        const toOffset = stationOffsets[toStation.id];
        const offsetDistance = toOffset - fromOffset;
        const trainDistanceFraction = getTrainDistanceFraction(
            fromStation,
            toStation,
            train
        );
        if (offsetDistance > 0) {
            const finalOffset =
                fromOffset + trainDistanceFraction * offsetDistance;
            return pathInterpolator(finalOffset);
        } else {
            const finalFraction =
                toOffset - trainDistanceFraction * offsetDistance;
            return pathInterpolator(finalFraction);
        }
    };
};
