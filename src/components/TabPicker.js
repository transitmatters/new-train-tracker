import React, { useRef, useLayoutEffect } from 'react';
import { TabList, Tab } from 'reakit';

import { getTrainRoutePairsForLine } from './util';

const TabPicker = props => {
    const { lines, tabState, trainsByRoute } = props;
    const wrapperRef = useRef(null);
    const selectedIndicatorRef = useRef(null);

    useLayoutEffect(() => {
        const { current: wrapper } = wrapperRef;
        const { current: selectedIndicator } = selectedIndicatorRef;
        if (wrapper && selectedIndicator) {
            const selectedEl = wrapper.querySelector(`#${tabState.selectedId}`);
            if (selectedEl) {
                selectedIndicator.style.width = selectedEl.clientWidth + 'px';
                selectedIndicator.style.transform = `translateX(${selectedEl.offsetLeft}px)`;
                selectedIndicator.style.backgroundColor = selectedEl.getAttribute(
                    'data-color'
                );
            }
        }
    }, [tabState.selectedId]);

    return (
        <TabList {...tabState} className="tab-picker" ref={wrapperRef}>
            <div className="selected-indicator" ref={selectedIndicatorRef} />
            {lines.map(line => {
                const trains = getTrainRoutePairsForLine(
                    trainsByRoute,
                    line.routes
                );
                return (
                    <Tab
                        {...tabState}
                        className="tab"
                        key={line.name}
                        as="div"
                        data-color={line.color}
                    >
                        <div
                            className="icon"
                            style={{ backgroundColor: line.color }}
                        >
                            {line.abbreviation}
                        </div>
                        <div className="label">
                            {trains.length}{' '}
                            {trains.length === 1 ? 'train' : 'trains'}
                        </div>
                    </Tab>
                );
            })}
        </TabList>
    );
};

export default TabPicker;
