import { useSearchParams } from 'react-router-dom';
import { Line, VehiclesAge } from '../types';

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
export const useAgeSearchParam = (): [VehiclesAge, (newAge: VehiclesAge) => void] => {
    const [searchParams, setSearchParams] = useSearchParams();

    const age = searchParams.get('age') || 'vehicles';

    const setAge = (newAge: VehiclesAge) => {
        searchParams.set('age', newAge);
        setSearchParams(searchParams);
    };

    return [age as VehiclesAge, setAge];
};
