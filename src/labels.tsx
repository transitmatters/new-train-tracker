import { ArrowUpIcon } from './components/icons/ArrowUpIcon';
import { PersonIcon } from './components/icons/PersonIcon';
import { Route, Train, Prediction, OccupancyStatus } from './types';
import { SVGProps } from 'react';

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

const renderDetailsLabel = (train: Train, prediction: Prediction | null) => {
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
const renderCarriageIcon = (status: OccupancyStatus, first: boolean, last: boolean) => {
    const statusToColor: Record<typeof status, string> = {
        EMPTY: '#008150',
        MANY_SEATS_AVAILABLE: '#008150',
        FEW_SEATS_AVAILABLE: '#FFC72C',
        STANDING_ROOM_ONLY: '#FD8A03',
        CRUSHED_STANDING_ROOM_ONLY: '#FA2D27',
        FULL: '#FA2D27',
        NO_DATA_AVAILABLE: 'silver',
        NOT_ACCEPTING_PASSENGERS: 'grey',
    };
    return (
        <div
            className={`train-carriage ${first ? 'first' : ''} ${last ? 'last' : ''}`}
            style={{
                backgroundColor: statusToColor[status],
            }}
        />
    );
};

const OccupancyStatusIcon = ({
    occupancyStatus,
    ...rest
}: { occupancyStatus: OccupancyStatus } & SVGProps<SVGSVGElement>) => {
    const occupancyStatusToIcons: Record<OccupancyStatus, number> = {
        EMPTY: 1,
        MANY_SEATS_AVAILABLE: 1,
        FEW_SEATS_AVAILABLE: 2,
        STANDING_ROOM_ONLY: 3,
        CRUSHED_STANDING_ROOM_ONLY: 4,
        NOT_ACCEPTING_PASSENGERS: 0,
        NO_DATA_AVAILABLE: 0,
        FULL: 4,
    };
    return (
        <div className="occupancy-status-container">
            {[...Array(occupancyStatusToIcons[occupancyStatus])].map((_item, i) => {
                const hex = (255 / 4) * i;
                const color = `rgba(${hex}, ${hex}, ${hex})`;
                return (
                    <PersonIcon
                        key={i}
                        className="occupancy-status-icon"
                        stroke="white"
                        strokeWidth="1px"
                        {...rest}
                        style={{
                            position: 'absolute',
                            marginLeft: i * 4,
                            color: color,
                            zIndex: 100 - i,
                        }}
                    />
                );
            })}
        </div>
    );
};

function convertAllCapsToSentenceCase(s: string): string {
    /**
     * Converts a string from ALL_CAPS_STRING to sentence case (All caps string).
     *
     * @param s - Input string in ALL_CAPS format with underscores.
     * @returns Converted string in sentence case.
     */
    s = s.toLowerCase().replace(/_/g, ' '); // Convert to lowercase and replace underscores with spaces
    return s.charAt(0).toUpperCase() + s.slice(1); // Capitalize the first letter
}

const renderCarriageDetails = (train: Train) => {
    const hasSomeLiveCarriageData = train.carriages.some(
        (carriage) => carriage.occupancy_status !== 'NO_DATA_AVAILABLE'
    );
    return (
        <div>
            {<ArrowUpIcon className="consist-front-icon" />}
            {train.carriages.map((carriage, index) => (
                <div key={carriage.label} className="occupancy-container">
                    {renderCarriageIcon(
                        carriage.occupancy_status,
                        index === 0,
                        index === train.carriages.length - 1
                    )}
                    <div>
                        <div className="occupancy-label-container">
                            {carriage.label}{' '}
                            <OccupancyStatusIcon occupancyStatus={carriage.occupancy_status} />
                        </div>
                        {hasSomeLiveCarriageData && (
                            <div className="occupancy-status-text">
                                {convertAllCapsToSentenceCase(carriage.occupancy_status)}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export const renderTrainLabel = (
    train: Train,
    prediction: Prediction | null,
    route: Route,
    accentColor
) => {
    return (
        <>
            {renderStationLabel(train, route)}
            {renderDestinationLabel(train, route)}
            {renderLeadCarLabel(train, accentColor)}
            {renderDetailsLabel(train, prediction)}
            {renderCarriageDetails(train)}
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
