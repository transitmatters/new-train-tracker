import React, { useState, useContext, useEffect } from 'react';
import classNames from 'classnames';
import { Spring } from 'react-spring/renderprops';
import { elementScrollIntoView } from 'seamless-scroll-polyfill';

import { interpolateTrainOffset } from '../interpolation';
import { PopoverContainerContext, prefersReducedMotion } from './util';
import TrainPopover from './TrainPopover';

const getSpringConfig = () => {
    if (prefersReducedMotion()) {
        return { duration: 0 };
    }
    return undefined;
};

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

const drawEquilateralTriangle = (radius) =>
    [0, 1, 2]
        .map((idx) => {
            const theta = idx * (2 / 3) * Math.PI;
            const x = radius * Math.cos(theta);
            const y = radius * Math.sin(theta);
            return `${x}, ${y}`;
        })
        .reduce((a, b) => `${a} ${b}`)
        .trim();

const Train = (props) => {
    const { train, route, colors, focusOnMount, labelPosition, onFocus, onBlur } = props;
    const { direction } = train;
    const { pathInterpolator, stations } = route;

    const [element, setElement] = useState(null);
    const [isTracked, setIsTracked] = useState(false);
    const [shouldAutoFocus, setShouldAutoFocus] = useState(focusOnMount);

    const offset = interpolateTrainOffset(train, stations);
    const popoverContainer = useContext(PopoverContainerContext);

    const handleFocus = () => {
        setIsTracked(true);
        if (onFocus) {
            onFocus();
        }
    };

    const handleBlur = () => {
        setIsTracked(false);
        if (onBlur) {
            onBlur();
        }
    };

    useEffect(() => {
        if (element && isTracked) {
            elementScrollIntoView(element, {
                behavior: prefersReducedMotion() ? 'auto' : 'smooth',
                block: 'center',
                duration: 250,
            });
        }
    }, [element, isTracked]);

    useEffect(() => {
        if (element && shouldAutoFocus) {
            setShouldAutoFocus(false);
            element.focus();
        }
    }, [element, shouldAutoFocus]);

    const renderTrainMarker = () => {
        return (
            <g>
                <circle
                    cx={0}
                    cy={0}
                    r={3.326}
                    fill={colors.train}
                    stroke={isTracked ? 'white' : undefined}
                />
                <polygon points={drawEquilateralTriangle(2)} fill={'white'} />
            </g>
        );
    };

    return (
        <Spring to={{ offset }} config={getSpringConfig()}>
            {(spring) => {
                const { x, y, theta } = pathInterpolator(spring.offset);
                const correctedTheta = direction === 1 ? 180 + theta : theta;
                return (
                    <>
                        <g
                            className={classNames('train', isTracked && 'tracked')}
                            tabIndex="0"
                            role="listitem"
                            ref={setElement}
                            transform={`translate(${x}, ${y}) rotate(${correctedTheta})`}
                            onFocus={handleFocus}
                            onClick={() => element.focus()}
                            onBlur={handleBlur}
                        >
                            {renderTrainMarker()}
                        </g>
                        {popoverContainer && element && (
                            <TrainPopover
                                train={train}
                                route={route}
                                colors={colors}
                                container={popoverContainer}
                                isVisible={isTracked}
                                fixedPositionStrategy={labelPosition}
                                referenceRect={getBoundingRectWithinParent(
                                    element,
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
