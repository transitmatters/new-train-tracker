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
    const totalLength = segments.reduce(
        (sum, segment) => sum + segment.length,
        0
    );
    return fraction => {
        const partialLength = fraction * totalLength;
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
        console.log('SEGMENT', segment);
        return segment.get(1 - overshootWithinSegment / segment.length);
    };
};

export const createRouteInterpolator = () => {
    const regions = [];

    const addStationRange = (
        stationRange,
        stationIds,
        stationFractions,
        positionMapper
    ) => {
        regions.push({
            type: 'stationRange',
            stationRange,
            stationIds,
            stationFractions,
            positionMapper,
        });
    };

    const addSegment = segment => {
        regions.push({
            type: 'segment',
            segment: segment,
        });
    };

    const findStationRangeForStationId = stationId => {
        return regions.find(
            region =>
                region.type === 'stationRange' &&
                region.stationIds.includes(stationId)
        );
    };

    const getSliceBetweenStationRanges = (fromRange, toRange) => {
        const indexOfFrom = regions.indexOf(fromRange);
        const indexOfTo = regions.indexOf(toRange);
        const isReversed = indexOfFrom > indexOfTo;
        const slice = regions.slice(
            Math.min(indexOfFrom, indexOfTo) + 1,
            Math.max(indexOfFrom, indexOfTo)
        );
        if (slice.some(region => region.type === 'stationRange')) {
            throw new Error(
                'sliceBetweenStationRanges cannot accept station ranges that are separated by ' +
                    'one or more station range. This means the fromStation and toStation ' +
                    'arguments of getInterpolatorForTrain are likely not adjacent.'
            );
        }
        return { slice, isReversed };
    };

    const getInterpolatorBetweenStations = (fromStation, toStation) => {
        console.log('GIBS', fromStation, toStation);
        const fromRange = findStationRangeForStationId(fromStation.id);
        const toRange = findStationRangeForStationId(toStation.id);
        if (!fromRange || !toRange) {
            console.log('FR', fromRange, 'TR', toRange);
            return null;
        }
        if (fromRange === toRange) {
            const { stationFractions, positionMapper } = fromRange;
            const fromFraction = stationFractions[fromStation.id];
            const toFraction = stationFractions[toStation.id];
            const fractionRange = toFraction - fromFraction;
            return train => {
                const trainDistanceFraction = getTrainDistanceFraction(
                    fromStation,
                    toStation,
                    train
                );
                if (fractionRange > 0) {
                    const finalFraction =
                        fromFraction + trainDistanceFraction * fractionRange;
                    console.log(finalFraction);
                    return positionMapper(finalFraction);
                } else {
                    const finalFraction =
                        toFraction - trainDistanceFraction * fractionRange;
                    return positionMapper(finalFraction);
                }
            };
        } else {
            const { slice, isReversed } = getSliceBetweenStationRanges(
                fromRange,
                toRange
            );
            return train => {
                const interpolator = createInterpolatorForSegments(
                    slice.map(region => region.segment)
                );
                const trainDistanceFraction = getTrainDistanceFraction(
                    fromStation,
                    toStation,
                    train
                );
                if (isReversed) {
                    return interpolator(1 - trainDistanceFraction);
                }
                return interpolator(trainDistanceFraction);
            };
        }
    };

    return { addStationRange, addSegment, getInterpolatorBetweenStations };
};
