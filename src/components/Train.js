import React, { useState, useContext, useEffect, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import { Spring } from 'react-spring/renderprops';

import { interpolateTrainOffset } from '../interpolation';
import { PopoverContainerContext } from './util';

const getBoundingRectWithinParent = (element, parent) => {
    const elementRect = element.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();

    return {
        width: elementRect.width,
        height: elementRect.height,
        top: elementRect.top - parentRect.top,
        left: elementRect.left - parentRect.left,
    };
};

const getReadableStatusLabel = status => {
    if (status === 'INCOMING_AT' || status === 'IN_TRANSIT_TO') {
        return 'Near';
    }
    if (status === 'STOPPED_AT') {
        return 'At';
    }
    return '';
};

const popoverDistance = 15;

const TrainPopover = props => {
    const {
        colors,
        container,
        destinationName,
        direction,
        directionName,
        referenceRect,
        station,
    } = props;

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
            }}
        >
            <div className="train-details">
                <div className="station">{station}</div>
                <div className="destination">
                    {directionName}bound towards {destinationName}
                </div>
            </div>
        </div>,
        container
    );
};

const Train = props => {
    const [containerElement, setContainerElement] = useState(null);
    const { train, route, colors } = props;
    const { direction, isNewTrain } = train;
    const {
        pathInterpolator,
        stations,
        directionNames,
        directionDestinations,
    } = route;
    const offset = interpolateTrainOffset(train, stations);
    const popoverContainer = useContext(PopoverContainerContext);
    const destinationName = directionDestinations[train.direction];
    const directionName = directionNames[train.direction];
    const nearStation = stations.find(st => st.id === train.stationId);

    const stationString = nearStation && (
        <>
            {getReadableStatusLabel(train.currentStatus)}{' '}
            <b>{nearStation.name}</b>
        </>
    );

    const renderTrainMarker = () => {
        const color = isNewTrain ? colors.newTrains : colors.oldTrains;
        return (
            <polygon
                className={classNames(
                    'train',
                    isNewTrain ? 'new-train' : 'old-train'
                )}
                points="0,-2 4,0 0,2"
                fill={color}
                stroke={color}
            />
        );
    };

    return (
        <Spring to={{ offset }}>
            {spring => {
                const { x, y, theta } = pathInterpolator(spring.offset);
                const correctedTheta = direction === 1 ? 180 + theta : theta;
                return (
                    <>
                        <g
                            ref={setContainerElement}
                            transform={`translate(${x}, ${y}) rotate(${correctedTheta})`}
                        >
                            {renderTrainMarker()}
                        </g>
                        {popoverContainer && containerElement && isNewTrain && (
                            <TrainPopover
                                direction={direction}
                                directionName={directionName}
                                destinationName={destinationName}
                                station={stationString}
                                colors={colors}
                                container={popoverContainer}
                                referenceRect={getBoundingRectWithinParent(
                                    containerElement,
                                    popoverContainer
                                )}
                            />
                        )}
                    </>
                );
            }}
        </Spring>
    );
};

export default Train;
