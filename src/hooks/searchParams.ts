import { useSearchParams } from 'react-router-dom';
import { Line, VehicleCategory } from '../types';

// Read and update line ID search parameters
export const useLineSearchParam = (): [string, (newLine: Line) => void] => {
    const [searchParams, setSearchParams] = useSearchParams();

    const line = searchParams.get('line') || 'Green';

    const setLine = (newLine: Line) => {
        searchParams.set('line', newLine.name);
        setSearchParams(searchParams);
    };

    return [line, setLine];
};

// Read and update train age search parameters
export const useCategorySearchParam = (): [VehicleCategory, (newAge: VehicleCategory) => void] => {
    const [searchParams, setSearchParams] = useSearchParams();

    const age = searchParams.get('category') || 'new_vehicles';

    const setAge = (newAge: VehicleCategory) => {
        searchParams.set('category', newAge);
        setSearchParams(searchParams);
    };

    return [age as VehicleCategory, setAge];
};
