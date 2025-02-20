import { Route, Train, Prediction } from './types';
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

const renderCarriageIcon = (
    status: Train['carriages'][number]['occupancy_status'],
    first: boolean,
    last: boolean
) => {
    const status_to_color: Record<typeof status, string> = {
        EMPTY: 'green',
        MANY_SEATS_AVAILABLE: 'green',
        FEW_SEATS_AVAILABLE: 'gold',
        STANDING_ROOM_ONLY: 'orange',
        CRUSHED_STANDING_ROOM_ONLY: 'red',
        FULL: 'maroon',
        NO_DATA_AVAILABLE: 'silver',
        NOT_ACCEPTING_PASSENGERS: 'grey',
    };
    return (
        <div
            style={{
                height: 30,
                width: 10,
                borderTopLeftRadius: first ? 3 : undefined,
                borderTopRightRadius: first ? 3 : undefined,
                borderBottomLeftRadius: last ? 3 : undefined,
                borderBottomRightRadius: last ? 3 : undefined,
                backgroundColor: status_to_color[status],
                zIndex: 100,
                marginBottom: 1,
            }}
        />
    );
};

const BaselineKeyboardDoubleArrowUp = (props: SVGProps<SVGSVGElement>) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="10px"
            height="10px"
            fill="grey"
            {...props}
        >
            <path fill="grey" d="M6 17.59L7.41 19L12 14.42L16.59 19L18 17.59l-6-6z"></path>
            <path fill="grey" d="m6 11l1.41 1.41L12 7.83l4.59 4.58L18 11l-6-6z"></path>
        </svg>
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
    return (
        <div>
            {<BaselineKeyboardDoubleArrowUp style={{ width: 20, height: 20, marginInline: -5 }} />}
            {train.carriages.map((carriage, index) => (
                <div key={carriage.label} style={{ display: 'flex', alignItems: 'center' }}>
                    {renderCarriageIcon(
                        carriage.occupancy_status,
                        index === 0,
                        index === train.carriages.length - 1
                    )}
                    <div style={{ paddingLeft: 6 }}>
                        <div style={{ fontSize: 12 }}>{carriage.label} </div>
                        <div style={{ fontSize: 8, paddingLeft: 1, color: '#404040' }}>
                            {convertAllCapsToSentenceCase(carriage.occupancy_status)}
                        </div>
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
