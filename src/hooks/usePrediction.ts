import { useEffect, useState } from 'react';
import { Prediction } from '../types';

const getPrediction = (tripId: string, stopId: string) => {
    return fetch(`/predictions/${tripId}/${stopId}`).then((res) => {
        return res.json();
    });
};

export const usePrediction = (tripId: string, stopId: string) => {
    const [pred, setPrediction] = useState<Prediction | null>(null);
    useEffect(() => {
        if (!tripId) {
            return;
        }
        getPrediction(tripId, stopId).then((pred) => setPrediction(pred));
    }, [tripId, stopId]);

    return pred;
};
