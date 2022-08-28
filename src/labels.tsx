import { Route, Train } from './types';

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

export const renderTrainLabel = (train: Train, route: Route, accentColor) => {
    return (
        <>
            {renderStationLabel(train, route)}
            {renderDestinationLabel(train, route)}
            {renderLeadCarLabel(train, accentColor)}
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
