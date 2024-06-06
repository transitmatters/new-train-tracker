import { useRef, useLayoutEffect } from 'react';
import { TabList, Tab, TabProvider } from '@ariakit/react';
import { VehiclesAge } from '../types';
import { useAgeSearchParam } from '../hooks/searchParams';

type TrainAge = { key: VehiclesAge; label: string };

const trainTypes: TrainAge[] = [
    { key: 'old_vehicles', label: 'Old' },
    { key: 'new_vehicles', label: 'New' },
    { key: 'vehicles', label: 'All' },
];

interface AgeTabPickerProps {
    tabColor: string;
}

export const AgeTabPicker: React.FC<AgeTabPickerProps> = ({ tabColor }) => {
    // Get train age ID from serach params
    const [ageSearchParam, setAgeSearchParam] = useAgeSearchParam();

    const wrapperRef = useRef<HTMLDivElement>(null);
    const selectedIndicatorRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const { current: wrapper } = wrapperRef;
        const { current: selectedIndicator } = selectedIndicatorRef;
        if (wrapper && selectedIndicator) {
            const selectedEl = wrapper.querySelector(`#${ageSearchParam}`) as HTMLElement | null;
            if (selectedEl) {
                selectedIndicator.style.width = selectedEl.clientWidth + 'px';
                selectedIndicator.style.transform = `translateX(${selectedEl.offsetLeft}px)`;
                selectedIndicator.style.backgroundColor = tabColor;
            }
        }
    }, [tabColor, ageSearchParam]);

    return (
        <TabProvider>
            <TabList className="tab-picker" aria-label="Select train age" ref={wrapperRef}>
                <div className="selected-indicator" ref={selectedIndicatorRef} />

                {trainTypes.map((trainType) => {
                    return (
                        <Tab
                            id={trainType.key}
                            className="tab"
                            key={trainType.key}
                            data-color={tabColor}
                            onClick={() => {
                                setAgeSearchParam(trainType.key);
                            }}
                        >
                            <div
                                aria-label={trainType.key}
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
        </TabProvider>
    );
};
