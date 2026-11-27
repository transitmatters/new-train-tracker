import { useSearchParams } from 'react-router-dom';
import { Line, LineName, VehicleCategory } from '../types';
import { isCategoryInSeason } from '../seasons';

const DEFAULT_CATEGORY: VehicleCategory = 'new_vehicles';

// Read and update line ID search parameters
export const useLineSearchParam = (): [LineName, (newLine: Line) => void] => {
    const [searchParams, setSearchParams] = useSearchParams();

    const line = searchParams.get('line') || 'Green';

    const setLine = (newLine: Line) => {
        searchParams.set('line', newLine.name);
        setSearchParams(searchParams);
    };

    return [line as LineName, setLine];
};

// Read and update train age search parameters
export const useCategorySearchParam = (): [VehicleCategory, (newAge: VehicleCategory) => void] => {
    const [searchParams, setSearchParams] = useSearchParams();

    const requested = (searchParams.get('category') || DEFAULT_CATEGORY) as VehicleCategory;
    // Without this, a bookmarked ?category=holiday in June shows an empty map with no tab selected
    const age = isCategoryInSeason(requested) ? requested : DEFAULT_CATEGORY;

    const setAge = (newAge: VehicleCategory) => {
        searchParams.set('category', newAge);
        setSearchParams(searchParams);
    };

    return [age, setAge];
};
