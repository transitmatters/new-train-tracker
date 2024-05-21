import { useEffect, useState } from 'react';
import { Vehicle } from '../types';

const getPrediction = (vehicleId: string) => {
    return fetch(`/vehicles/${vehicleId}/departure-predictions`).then((res) => res.json());
};

export const usePrediction = (vehicleId: string) => {
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    useEffect(() => {
        if (!vehicleId) {
            return;
        }
        getPrediction(vehicleId).then((pred) => setVehicle(pred.json()));
    }, [vehicleId]);

    return vehicle;
};
