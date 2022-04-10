import { useRef, useLayoutEffect } from 'react';
import { TabList, Tab } from 'reakit';

import { getTrainRoutePairsForLine } from './util';

export const getTabIdForLine = (line) => `tab-${line.name}`;

const TabPicker = (props) => {
    const { lines, tabState, trainsByRoute } = props;
    const wrapperRef = useRef(null);
    const selectedIndicatorRef = useRef(null);

    // Used to ensure the size of the selected indicator changes when trains appear.
    const totalTrainCount = Object.values(trainsByRoute).reduce((a, b) => a + b.length, 0);

    useLayoutEffect(() => {
        const { current: wrapper } = wrapperRef;
        const { current: selectedIndicator } = selectedIndicatorRef;
        if (wrapper && selectedIndicator) {
            const selectedEl = wrapper.querySelector(`#${tabState.selectedId}`);
            if (selectedEl) {
                selectedIndicator.style.width = selectedEl.clientWidth + 'px';
                selectedIndicator.style.transform = `translateX(${selectedEl.offsetLeft}px)`;
                selectedIndicator.style.backgroundColor = selectedEl.getAttribute('data-color');
            }
        }
    }, [tabState.selectedId, totalTrainCount]);

    return (
        <TabList {...tabState} className="tab-picker" aria-label="Select a line" ref={wrapperRef}>
            <div className="selected-indicator" ref={selectedIndicatorRef} />
            {lines.map((line) => {
                const trains = getTrainRoutePairsForLine(trainsByRoute, line.routes);
                return (
                    <Tab
                        {...tabState}
                        id={getTabIdForLine(line)}
                        className="tab"
                        key={line.name}
                        as="div"
                        data-color={line.color}
                    >
                        <div
                            aria-label={line.name + ' line'}
                            className="icon"
                            style={{ backgroundColor: line.color }}
                        >
                            {line.abbreviation}
                        </div>
                        <div className="label">
                            {trains.length} {trains.length === 1 ? 'train' : 'trains'}
                        </div>
                    </Tab>
                );
            })}
        </TabList>
    );
};

export default TabPicker;
