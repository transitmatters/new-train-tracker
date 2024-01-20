import { useRef, useLayoutEffect } from 'react';
import { TabList, Tab } from 'reakit';
import { Line, Train } from '../types';

import { getTrainRoutePairsForLine } from './util';
import { useLineSearchParam } from '../hooks/searchParams';

interface LineTabPickerProps {
    lines: Line[];
    trainsByRoute: { [key: string]: Train[] };
}

export const LineTabPicker: React.FC<LineTabPickerProps> = ({ lines, trainsByRoute }) => {
    const [lineSearchParam, setLineSearchParam] = useLineSearchParam();

    const wrapperRef = useRef<HTMLDivElement>(null);
    const selectedIndicatorRef = useRef<HTMLDivElement>(null);

    // Used to ensure the size of the selected indicator changes when trains appear.
    const totalTrainCount = Object.values(trainsByRoute).reduce((a, b) => a + b.length, 0);

    useLayoutEffect(() => {
        const { current: wrapper } = wrapperRef;
        const { current: selectedIndicator } = selectedIndicatorRef;
        if (wrapper && selectedIndicator) {
            const selectedEl = wrapper.querySelector(`#${lineSearchParam}`) as HTMLElement | null;
            if (selectedEl) {
                selectedIndicator.style.width = selectedEl.clientWidth + 'px';
                selectedIndicator.style.transform = `translateX(${selectedEl.offsetLeft}px)`;
                selectedIndicator.style.backgroundColor = selectedEl.getAttribute(
                    'data-color'
                ) as string;
            }
        }
    }, [lineSearchParam, totalTrainCount]);

    return (
        <TabList className="tab-picker" aria-label="Select a line" ref={wrapperRef}>
            <div className="selected-indicator" ref={selectedIndicatorRef} />
            {lines.map((line) => {
                const trains = getTrainRoutePairsForLine(trainsByRoute, line.routes);
                return (
                    <Tab
                        id={line.name}
                        className="tab"
                        key={line.name}
                        as="div"
                        data-color={line.color}
                        onClick={() => {
                            setLineSearchParam(line);
                        }}
                    >
                        <div
                            aria-label={line.name + ' line'}
                            className="icon"
                            style={{ backgroundColor: line.color }}
                        >
                            {line.abbreviation}
                        </div>
                        <div className="label">
                            {trains.length}{' '}
                            <span className="label-trains-text">
                                {' '}
                                {trains.length === 1 ? 'train' : 'trains'}{' '}
                            </span>
                        </div>
                    </Tab>
                );
            })}
        </TabList>
    );
};
