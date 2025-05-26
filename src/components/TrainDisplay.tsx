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
        return (
            <g>
                <circle
                    cx={0}
                    cy={0}
                    r={3.326}
                    fill={colors.train}
                    stroke={isTracked ? 'white' : undefined}
                    textAnchor="middle"
                />
                <polygon points={drawEquilateralTriangle(2)} fill={'white'} />
                {isFourCar ? (
                    <g transform={`rotate(${90 - correctedTheta})`}>
                        <defs>
                            <clipPath id="prideFlag">
                                <circle cx={-2} cy={-3} r={2} />
                            </clipPath>
                        </defs>
                        <g clipPath="url(#prideFlag)">
                            {/* Pride flag stripes */}
                            <rect x={-4} y={-5} width={4} height={0.67} fill="#e40303" />
                            <rect x={-4} y={-4.33} width={4} height={0.67} fill="#ff8c00" />
                            <rect x={-4} y={-3.66} width={4} height={0.67} fill="#ffed00" />
                            <rect x={-4} y={-2.99} width={4} height={0.67} fill="#008018" />
                            <rect x={-4} y={-2.32} width={4} height={0.67} fill="#0066ff" />
                            <rect x={-4} y={-1.65} width={4} height={0.67} fill="#732982" />
                        </g>
                        <circle
                            cx={-2}
                            cy={-3}
                            r={2}
                            fill="none"
                            stroke={isTracked ? 'white' : '#333'}
                            strokeWidth={0.2}
                            style={{ filter: 'drop-shadow( 0px 0px 1px rgba(0, 0, 0, .3))' }}
                        />
                    </g>
                ) : (
                    <></>
                )}
                {isPrideCar ? (
                    <g transform={`rotate(${90 - correctedTheta})`}>
                        <defs>
                            <clipPath id="prideFlag">
                                <circle cx={-2} cy={-3} r={2} />
                            </clipPath>
                        </defs>
                        <g clipPath="url(#prideFlag)">
                            <rect x={-4} y={-5} width={4} height={0.67} fill="#e40303" />
                            <rect x={-4} y={-4.33} width={4} height={0.67} fill="#ff8c00" />
                            <rect x={-4} y={-3.66} width={4} height={0.67} fill="#ffed00" />
                            <rect x={-4} y={-2.99} width={4} height={0.67} fill="#008018" />
                            <rect x={-4} y={-2.32} width={4} height={0.67} fill="#0066ff" />
                            <rect x={-4} y={-1.65} width={4} height={0.67} fill="#732982" />
                        </g>
                        <circle
                            cx={-2}
                            cy={-3}
                            r={2}
                            fill="none"
                            stroke={isTracked ? 'white' : '#333'}
                            strokeWidth={0.2}
                            style={{ filter: 'drop-shadow( 0px 0px 1px rgba(0, 0, 0, .3))' }}
                        />
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
