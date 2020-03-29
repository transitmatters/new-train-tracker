import React, { useState } from 'react';
import { Spring } from 'react-spring/renderprops';

import { interpolateTrainOffset } from '../interpolation';

const Train = props => {
    const [randomNoise] = useState(Math.random() * 0.5);
    const { train, route, colors } = props;
    const { direction } = train;
    const { pathInterpolator, stations } = route;
    const offset = interpolateTrainOffset(train, stations);
    const delay = randomNoise + (direction === 1 ? 2 : 0);
    return (
        <Spring to={{ offset }}>
            {spring => {
                const { x, y, theta } = pathInterpolator(spring.offset);
                const correctedTheta = direction === 1 ? 180 + theta : theta;
                return (
                    <g
                        transform={`translate(${x}, ${y}) rotate(${correctedTheta})`}
                    >
                        <polygon
                            className="train"
                            style={{ animationDelay: `${delay}s` }}
                            points="0,-3 6,0 0,3"
                            fill={colors.trains}
                        />
                    </g>
                );
            }}
        </Spring>
    );
};

export default Train;
