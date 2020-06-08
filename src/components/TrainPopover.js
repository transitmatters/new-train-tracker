import React, { useState, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import { renderTrainLabel } from '../labels';

const popoverDistance = 15;

const TrainPopover = props => {
    const {
        colors,
        container,
        fixedPositionStrategy,
        isVisible,
        referenceRect,
        route,
        train,
    } = props;
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
            const leftPositionLeftExtent = trainX - popoverDistance - popoverWidth;
            const rightPositionRightExtent = trainX + popoverDistance + popoverWidth;

            const canPositionLeft = leftPositionLeftExtent > 0;
            const canPositionRight = rightPositionRightExtent < containerWidth;

            let nextPositionStrategy = fixedPositionStrategy;
            if (!nextPositionStrategy) {
                nextPositionStrategy =
                    direction === 1
                        ? canPositionLeft
                            ? 'left'
                            : 'right'
                        : canPositionRight
                        ? 'right'
                        : 'left';
            }

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
        fixedPositionStrategy,
        isVisible,
        popoverHeight,
        popoverWidth,
        trainX,
        trainY,
    ]);

    return ReactDOM.createPortal(
        <div
            ref={setPopoverElement}
            className={classNames('train-popover', positionStrategy, isVisible && 'visible')}
            style={positionStyle}
            aria-hidden="true"
        >
            <div
                className="scale-container"
                style={{
                    backgroundColor: colors.colorSecondary,
                    border: `2px solid ${colors.newTrains}`,
                }}
            >
                <div className="train-details">{renderTrainLabel(train, route)}</div>
            </div>
        </div>,
        container
    );
};

export default TrainPopover;
