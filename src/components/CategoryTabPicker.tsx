import { useRef, useLayoutEffect } from 'react';
import { TabList, Tab, TabProvider } from '@ariakit/react';
import { VehicleCategory } from '../types';
import { useCategorySearchParam } from '../hooks/searchParams';

type TrainCategory = { key: VehicleCategory; label: string };

const trainTypes: TrainCategory[] = [
    { key: 'old_vehicles', label: 'Old' },
    { key: 'new_vehicles', label: 'New' },
    { key: 'vehicles', label: 'All' },
    { key: 'pride', label: 'Pride' },
    { key: 'holiday', label: 'Holiday' },
];

interface CategoryTabPickerProps {
    tabColor: string;
}

export const CategoryTabPicker: React.FC<CategoryTabPickerProps> = ({ tabColor }) => {
    // Get train age ID from serach params
    const [categorySearchParam, setCategorySearchParam] = useCategorySearchParam();

    const wrapperRef = useRef<HTMLDivElement>(null);
    const selectedIndicatorRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const { current: wrapper } = wrapperRef;
        const { current: selectedIndicator } = selectedIndicatorRef;
        if (wrapper && selectedIndicator) {
            const selectedEl = wrapper.querySelector(
                `#${categorySearchParam}`
            ) as HTMLElement | null;
            if (selectedEl) {
                selectedIndicator.style.width = selectedEl.clientWidth + 'px';
                selectedIndicator.style.transform = `translateX(${selectedEl.offsetLeft}px)`;
                selectedIndicator.style.backgroundColor = tabColor;
            }
        }
    }, [tabColor, categorySearchParam]);

    return (
        <TabProvider>
            <TabList className="tab-picker" aria-label="Select train age" ref={wrapperRef}>
                <div className="selected-indicator" ref={selectedIndicatorRef} />

                {trainTypes.map((trainType) => {
                    const isHoliday = trainType.key === 'holiday';
                    return (
                        <Tab
                            id={trainType.key}
                            className="tab"
                            key={trainType.key}
                            data-color={tabColor}
                            onClick={() => {
                                setCategorySearchParam(trainType.key);
                            }}
                        >
                            <div
                                aria-label={trainType.key}
                                className="icon age"
                                style={{ backgroundColor: isHoliday ? 'transparent' : tabColor }}
                            >
                                {isHoliday ? '❄️' : trainType.label.toUpperCase()}
                            </div>
                            <div className="label">trains</div>
                        </Tab>
                    );
                })}
            </TabList>
        </TabProvider>
    );
};
