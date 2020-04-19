import React, { useState, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';

const popoverDistance = 15;

const abbreviateDestination = destination =>
    destination
        .replace('Government Center', "Gov't Center")
        .replace('Boston College', 'B.C.');

const abbreviateStationName = station =>
    station
        .replace('Boston University', 'BU')
        .replace('Hynes Convention Center', 'Hynes')
        .replace('Government Center', "Gov't Center")
        .replace('Northeastern University', 'Northeastern')
        .replace('Museum of Fine Arts', 'MFA');

const getReadableStatusLabel = status => {
    if (status === 'INCOMING_AT' || status === 'IN_TRANSIT_TO') {
        return 'Near';
    }
    if (status === 'STOPPED_AT') {
        return 'At';
    }
    return '';
};

const renderStationLabel = (train, route) => {
    const { stations } = route;
    const nearStation = stations.find(st => st.id === train.stationId);
    if (!nearStation) {
        return null;
    }
    const stationName = abbreviateStationName(nearStation.name);
    const isLongStationName = stationName.includes(' ');

    return (
        <div
            className={classNames('station', isLongStationName && 'long-name')}
        >
            {getReadableStatusLabel(train.currentStatus)}{' '}
            <b className={classNames(isLongStationName && 'long-station-name')}>
                {stationName}
            </b>
        </div>
    );
};

const renderDestinationLabel = (train, route) => {
    const { directionDestinations } = route;
    const destinationName = abbreviateDestination(
        directionDestinations[train.direction]
    );
    return <div className="destination">to&nbsp;{destinationName}</div>;
};

const TrainPopover = props => {
    const { colors, container, referenceRect, train, route } = props;
    const { direction } = train;

    const containerWidth = container.getBoundingClientRect().width;
    const [positionStyle, setPositionStyle] = useState({});
    const [popoverElement, setPopoverElement] = useState(null);
    const [positionStrategy, setPositionStrategy] = useState('');

    const trainX = referenceRect.left + referenceRect.width / 2;
    const trainY = referenceRect.top + referenceRect.height / 2;

    let popoverWidth = null;
    let popoverHeight = null;

    if (popoverElement) {
        const popoverBounds = popoverElement.getBoundingClientRect();
        popoverWidth = popoverBounds.width;
        popoverHeight = popoverBounds.height;
    }

    useLayoutEffect(() => {
        if (popoverWidth && popoverHeight) {
            const leftPositionLeftExtent =
                trainX - popoverDistance - popoverWidth;
            const rightPositionRightExtent =
                trainX + popoverDistance + popoverWidth;

            const canPositionLeft = leftPositionLeftExtent > 0;
            const canPositionRight = rightPositionRightExtent < containerWidth;

            const nextPositionStrategy =
                direction === 1
                    ? canPositionLeft
                        ? 'left'
                        : 'right'
                    : canPositionRight
                    ? 'right'
                    : 'left';

            const popoverX =
                trainX +
                (nextPositionStrategy === 'left'
                    ? -1 * (popoverWidth + popoverDistance)
                    : popoverDistance);

            const popoverY = trainY - popoverHeight / 2;

            setPositionStrategy(nextPositionStrategy);

            setPositionStyle({
                transform: `translate(${popoverX}px, ${popoverY}px)`,
            });
        }
    }, [
        containerWidth,
        direction,
        popoverWidth,
        popoverHeight,
        trainX,
        trainY,
    ]);

    return ReactDOM.createPortal(
        <div
            ref={setPopoverElement}
            className={classNames('train-popover', positionStrategy)}
            style={{
                ...positionStyle,
                backgroundColor: colors.colorBright,
                border: `2px solid ${colors.newTrains}`,
            }}
        >
            <div className="train-details">
                {renderStationLabel(train, route)}
            </div>
        </div>,
        container
    );
};

export default TrainPopover;
