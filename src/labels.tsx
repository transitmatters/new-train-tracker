import { Route, Train, Vehicle } from './types';

const abbreviateStationName = (station: string) =>
    station
        .replace('Boston University', 'BU')
        .replace('Hynes Convention Center', 'Hynes')
        .replace('Government Center', "Gov't Center")
        .replace('Northeastern University', 'Northeastern')
        .replace('Museum of Fine Arts', 'MFA')
        .replace('Massachusetts Avenue', 'Mass Ave');

const getReadableStatusLabel = (status) => {
    if (status === 'INCOMING_AT' || status === 'IN_TRANSIT_TO') {
        return 'Near';
    }
    if (status === 'STOPPED_AT') {
        return 'At';
    }
    return '';
};

const getDepartureTimePrediction = (prediction: Date | null) => {
    if (prediction) {
        return `Next departure ${prediction.toLocaleTimeString()}`;
    }

    return '';
};

const getLastUpdatedAt = (updatedAt: Date) => {
    if (updatedAt) {
        return `Position updated ${updatedAt.toLocaleTimeString()}`;
    }
    return '';
};

const getStationNameAndStatusForTrain = (train: Train, route: Route) => {
    const { stations } = route;
    const nearStation = stations?.find((st) => st.id === train.stationId);
    if (!nearStation) {
        return { stationName: null, status: null };
    }
    const stationName = abbreviateStationName(nearStation.name);
    const statusLabel = getReadableStatusLabel(train.currentStatus);
    return { stationName, statusLabel };
};

const renderStationLabel = (train: Train, route: Route) => {
    const { stationName, statusLabel } = getStationNameAndStatusForTrain(train, route);
    if (!stationName) {
        return null;
    }

    return (
        <div className="station">
            {statusLabel}&nbsp;
            <b>{stationName}</b>
        </div>
    );
};

const renderDestinationLabel = (train: Train, route: Route) => {
    const { directionDestinations } = route;
    const destinationName = directionDestinations?.[train.direction];
    return <div className="destination">to&nbsp;{destinationName}</div>;
};

const renderLeadCarLabel = (train: Train, backgroundColor) => {
    const { label } = train;
    if (!label) {
        return null;
    }
    return (
        <div className="lead-car" style={{ background: backgroundColor }}>
            #{label}
        </div>
    );
};

const renderDetailsLabel = (train: Train, prediction: Vehicle | null) => {
    const departurePrediction = getDepartureTimePrediction(
        prediction ? new Date(prediction.departure_time) : null
    );
    const lastUpdated = getLastUpdatedAt(new Date(train.updatedAt));

    return (
        <div className="details">
            <p>{departurePrediction}</p>
            <p>{lastUpdated}</p>
        </div>
    );
};

export const renderTrainLabel = (
    train: Train,
    prediction: Vehicle | null,
    route: Route,
    accentColor
) => {
    return (
        <>
            {renderStationLabel(train, route)}
            {renderDestinationLabel(train, route)}
            {renderLeadCarLabel(train, accentColor)}
            {renderDetailsLabel(train, prediction)}
        </>
    );
};

export const renderTextTrainlabel = (train: Train, route: Route) => {
    const { directionDestinations } = route;
    const { stationName, statusLabel } = getStationNameAndStatusForTrain(train, route);
    if (!stationName) {
        return null;
    }
    const destinationName = directionDestinations?.[train.direction];
    return `${route.id} train ${statusLabel} ${stationName} bound for ${destinationName} with lead car ${train.label}`;
};
