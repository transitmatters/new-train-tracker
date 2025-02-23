import { useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import { renderTrainLabel } from '../labels';
import { usePrediction } from '../hooks/usePrediction';
import { Color, Route, Train } from '../types';

const popoverDistance = 15;

interface TrainPopoverProps {
    colors: Color;
    container: HTMLDivElement;
    fixedPositionStrategy?: string;
    isVisible: boolean;
    referenceRect: {
        width: number;
        height: number;
        top: number;
        left: number;
    };
    route: Route;
    train: Train;
}

export const TrainPopover: React.FunctionComponent<TrainPopoverProps> = (props) => {
    const { colors, container, fixedPositionStrategy, isVisible, referenceRect, route, train } =
        props;
    const { direction } = train;

    const containerWidth = container.getBoundingClientRect().width;
    const [positionStyle, setPositionStyle] = useState({});
    const [popoverElement, setPopoverElement] = useState<HTMLDivElement | null>(null);
    const [positionStrategy, setPositionStrategy] = useState('');

    const trainX = referenceRect.left + referenceRect.width / 2;
    const trainY = referenceRect.top + referenceRect.height / 2;

    let popoverWidth: number | null = null;
    let popoverHeight: number | null = null;

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

    const prediction = usePrediction(isVisible ? train.tripId : null, train.stationId);

    return createPortal(
        <div
            ref={setPopoverElement}
            className={classNames('train-popover', positionStrategy, isVisible && 'visible')}
            style={positionStyle}
            aria-hidden="true"
        >
            <div className="scale-container" style={{ border: `2px solid ${colors.train}` }}>
                <div className="train-details">
                    {renderTrainLabel(train, prediction, route, colors.train)}
                </div>
            </div>
        </div>,
        container
    );
};
