import { useState, useContext, useEffect } from 'react';
import classNames from 'classnames';
import { Spring } from 'react-spring/renderprops';
import { elementScrollIntoView } from 'seamless-scroll-polyfill';

import { interpolateTrainOffset } from '../interpolation';
import { PopoverContainerContext, prefersReducedMotion } from './util';
import { TrainPopover } from './TrainPopover';
import { Color, Route, Train } from '../types';

const getSpringConfig = () => {
    if (prefersReducedMotion()) {
        return { duration: 0 };
    }
    return undefined;
};

const getBoundingRectWithinParent = (element: SVGGElement, parent: HTMLDivElement) => {
    const elementRect = element.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();

    return {
        width: elementRect.width,
        height: elementRect.height,
        top: elementRect.top - parentRect.top,
        left: elementRect.left - parentRect.left,
    };
};

const drawEquilateralTriangle = (radius: number) =>
    [0, 1, 2]
        .map((idx) => {
            const theta = idx * (2 / 3) * Math.PI;
            const x = radius * Math.cos(theta);
            const y = radius * Math.sin(theta);
            return `${x}, ${y}`;
        })
        .reduce((a, b) => `${a} ${b}`)
        .trim();

export const TrainDisplay = ({
    train,
    route,
    colors,
    focusOnMount,
    labelPosition,
    onFocus,
    onBlur,
}: {
    train: Train;
    route: Route;
    colors: Color;
    focusOnMount: boolean;
    labelPosition: string | undefined;
    onFocus: () => void;
    onBlur: () => void;
}) => {
    const { direction, label } = train;

    const carIds = label.split('-');
    const isPrideCar = carIds.includes('3706');

    const { pathInterpolator, stations } = route;

    const [element, setElement] = useState<SVGGElement | null>(null);
    const [isTracked, setIsTracked] = useState<boolean>(false);
    const [shouldAutoFocus, setShouldAutoFocus] = useState<boolean>(focusOnMount);

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
            });
        }
    }, [element, isTracked]);

    useEffect(() => {
        if (element && shouldAutoFocus) {
            setShouldAutoFocus(false);
            element.focus();
        }
    }, [element, shouldAutoFocus]);

    const renderTrainMarker = (isFourCar: boolean, correctedTheta: number) => {
        const prideColors = ['#e40303', '#ff8c00', '#ffed00', '#008018', '#0066ff', '#732982'];
        const circumference = 2 * Math.PI * 3.326;
        const segmentLength = circumference / 6;

        return (
            <g>
                <circle
                    cx={0}
                    cy={0}
                    r={3.326}
                    fill={colors.train}
                    stroke={!isPrideCar && isTracked ? 'white' : 'none'}
                    textAnchor="middle"
                />
                {isPrideCar && (
                    <g>
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            values="0 0 0;360 0 0"
                            dur="3s"
                            repeatCount="indefinite"
                        />
                        {prideColors.map((color, index) => (
                            <circle
                                key={index}
                                cx={0}
                                cy={0}
                                r={3.326}
                                fill="none"
                                stroke={color}
                                strokeWidth={0.8}
                                strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                                strokeDashoffset={-index * segmentLength}
                                transform={`rotate(-90)`}
                            />
                        ))}
                    </g>
                )}
                <polygon points={drawEquilateralTriangle(2)} fill={'white'} />
                {isFourCar ? (
                    <g transform={`rotate(${90 - correctedTheta})`}>
                        <circle
                            cx={-2}
                            cy={-3}
                            r={2}
                            fill={'#ffffff'}
                            stroke={isTracked ? 'white' : undefined}
                            textAnchor="middle"
                            style={{ filter: 'drop-shadow( 0px 0px 1px rgba(0, 0, 0, .3))' }}
                        />
                        <text fontWeight={700} fontSize={3} x={2} y={-1} transform="rotate(-90)">
                            4
                        </text>
                    </g>
                ) : (
                    <></>
                )}
            </g>
        );
    };

    return (
        <Spring to={{ offset }} config={getSpringConfig()}>
            {(spring) => {
                const { x, y, theta } = pathInterpolator!(spring.offset ?? 0);
                const correctedTheta = direction === 1 ? 180 + theta : theta;
                return (
                    <>
                        <g
                            className={classNames('train', isTracked && 'tracked')}
                            tabIndex={0}
                            role="listitem"
                            ref={setElement}
                            transform={`translate(${x}, ${y}) rotate(${correctedTheta})`}
                            onFocus={handleFocus}
                            onClick={() => element?.focus()}
                            onBlur={handleBlur}
                        >
                            {renderTrainMarker(train.isFourCar, correctedTheta)}
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
