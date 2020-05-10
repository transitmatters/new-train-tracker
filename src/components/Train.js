import React, { useState, useContext } from 'react';
import { Spring } from 'react-spring/renderprops';

import { interpolateTrainOffset } from '../interpolation';
import { PopoverContainerContext } from './util';
import TrainPopover from './TrainPopover';

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

const drawEquilateralTriangle = radius =>
    [0, 1, 2]
        .map(idx => {
            const theta = idx * (2 / 3) * Math.PI;
            const x = radius * Math.cos(theta);
            const y = radius * Math.sin(theta);
            return `${x}, ${y}`;
        })
        .reduce((a, b) => `${a} ${b}`)
        .trim();

const Train = props => {
    const { train, route, colors, alwaysLabelTrain } = props;
    const { direction, isNewTrain } = train;
    const { pathInterpolator, stations } = route;

    const [containerElement, setContainerElement] = useState(null);
    const [showLabelViaInteraction, setShowLabelViaInteraction] = useState(false);

    const offset = interpolateTrainOffset(train, stations);
    const popoverContainer = useContext(PopoverContainerContext);
    const isLabelShown = alwaysLabelTrain || showLabelViaInteraction;

    const showLabel = () => {
        setShowLabelViaInteraction(true);
    };

    const hideLabel = () => {
        setShowLabelViaInteraction(false);
    };

    const renderTrainMarker = () => {
        const color = isNewTrain ? colors.newTrains : colors.oldTrains;
        return (
            <>
                <circle cx={0} cy={0} r={3.326} fill={color} />
                <polygon points={drawEquilateralTriangle(2)} fill={'white'} />
            </>
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
                            aria-labelledby={`train-popover-${train.label}`}
                            className="train"
                            tabIndex="0"
                            role="listitem"
                            ref={setContainerElement}
                            transform={`translate(${x}, ${y}) rotate(${correctedTheta})`}
                            onFocus={showLabel}
                            onBlur={hideLabel}
                        >
                            {renderTrainMarker()}
                        </g>
                        {popoverContainer && containerElement && (
                            <TrainPopover
                                train={train}
                                route={route}
                                colors={colors}
                                container={popoverContainer}
                                isVisible={isLabelShown}
                                isActive={showLabelViaInteraction}
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
