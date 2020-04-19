import React from 'react';
import classNames from 'classnames';

import { getTrainRoutePairsForLine } from './util';

const LinePicker = props => {
    const { selectedLine, onSelectLine, lines, trainsByRoute } = props;

    return (
        <div className="line-picker">
            {lines.map(line => {
                const trains = getTrainRoutePairsForLine(
                    trainsByRoute,
                    line.routes
                );
                return (
                    <div
                        key={line.name}
                        role="button"
                        aria-label={`Show the ${line.name} line`}
                        onClick={() => onSelectLine(line)}
                        style={{
                            background: line.colorBright,
                            borderColor: line.color,
                        }}
                        className={classNames(
                            'line',
                            selectedLine === line && 'selected'
                        )}
                    >
                        {trains.length}
                    </div>
                );
            })}
        </div>
    );
};

export default LinePicker;
