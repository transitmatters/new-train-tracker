import React from 'react';
import { interpolateTrainOffset } from '../interpolation';

const Train = props => {
    const { train, route, styleProps } = props;
    const { pathInterpolator, stations } = route;
    const offset = interpolateTrainOffset(train, stations);
    const { x, y } = pathInterpolator(offset);

    

    return (
        <circle
            cx={x}
            cy={y}
            r={3}
            stroke={styleProps.base}
            fill="transparent"
        />
    );
};

export default Train;
