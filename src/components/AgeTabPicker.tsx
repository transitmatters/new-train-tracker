import { useRef, useLayoutEffect } from 'react';
import { TabList, Tab, TabStateReturn } from 'reakit';

type TrainAge = { key: 'old_vehicles', label: 'Old' } | { key: 'new_vehicles', label: 'New'} | { key: 'vehicles', label: 'All'};

const trainTypes: TrainAge[] = [{ key: 'old_vehicles', label: 'Old'}, { key: 'new_vehicles', label: 'New'}, { key: 'vehicles', label: 'All'}];

interface AgeTabPickerProps {
    tabState: TabStateReturn;
}

export const AgeTabPicker: React.FC<AgeTabPickerProps> = ({ tabState }) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const selectedIndicatorRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const { current: wrapper } = wrapperRef;
        const { current: selectedIndicator } = selectedIndicatorRef;
        if (wrapper && selectedIndicator) {
            const selectedEl = wrapper.querySelector(`#${tabState.selectedId}`) as HTMLElement | null;
            if (selectedEl) {
                selectedIndicator.style.width = selectedEl.clientWidth + 'px';
                selectedIndicator.style.transform = `translateX(${selectedEl.offsetLeft}px)`;
                selectedIndicator.style.backgroundColor = selectedEl.getAttribute('data-color') as string;
            }
        }
    }, [tabState.selectedId]);

    return (
        <TabList {...tabState} className="tab-picker" aria-label="Select a line" ref={wrapperRef}>
            <div className="selected-indicator" ref={selectedIndicatorRef} />
            {trainTypes.map((trainType) => {
                return (
                    <Tab
                        {...tabState}
                        id={trainType.key}
                        className="tab"
                        key={trainType.key}
                        as="div"
                        data-color={'brown'}
                    >
                        <div
                            aria-label={trainType.label}
                            className="icon"
                            style={{ backgroundColor: 'grey' }}
                        >
                            {trainType.label}
                        </div>
                        <div className="label">
                            trains
                        </div>
                    </Tab>
                );
            })}
        </TabList>
    );
};
