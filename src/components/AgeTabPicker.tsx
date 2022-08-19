import { useRef, useLayoutEffect } from 'react';
import { TabList, Tab, TabStateReturn } from 'reakit';
import { VehiclesAge } from '../types';

type TrainAge = { key: VehiclesAge; label: string };

const trainTypes: TrainAge[] = [
    { key: 'old_vehicles', label: 'Old' },
    { key: 'new_vehicles', label: 'New' },
    { key: 'vehicles', label: 'All' },
];

interface AgeTabPickerProps {
    tabState: TabStateReturn;
    tabColor: string;
}

export const AgeTabPicker: React.FC<AgeTabPickerProps> = ({ tabState, tabColor }) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const selectedIndicatorRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const { current: wrapper } = wrapperRef;
        const { current: selectedIndicator } = selectedIndicatorRef;
        if (wrapper && selectedIndicator) {
            const selectedEl = wrapper.querySelector(
                `#${tabState.selectedId}`
            ) as HTMLElement | null;
            if (selectedEl) {
                selectedIndicator.style.width = selectedEl.clientWidth + 'px';
                selectedIndicator.style.transform = `translateX(${selectedEl.offsetLeft}px)`;
                selectedIndicator.style.transition = '500ms all cubic-bezier(0.86, 0, 0.07, 1)';
            }
        }
    }, [tabState.selectedId]);

    // Handle color change immediate transition
    useLayoutEffect(() => {
        const { current: wrapper } = wrapperRef;
        const { current: selectedIndicator } = selectedIndicatorRef;
        if (wrapper && selectedIndicator) {
            const selectedEl = wrapper.querySelector(
                `#${tabState.selectedId}`
            ) as HTMLElement | null;
            if (selectedEl) {
                selectedIndicator.style.backgroundColor = tabColor;
                selectedIndicator.style.transition = '0ms background-color';
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tabColor]);

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
                        data-color={tabColor}
                    >
                        <div
                            aria-label={trainType.label}
                            className="icon age"
                            style={{ backgroundColor: tabColor }}
                        >
                            {trainType.label.toUpperCase()}
                        </div>
                        <div className="label">trains</div>
                    </Tab>
                );
            })}
        </TabList>
    );
};
