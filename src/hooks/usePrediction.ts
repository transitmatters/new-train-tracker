import { useEffect, useState } from 'react';
import { Prediction } from '../types';
import { APP_DATA_BASE_PATH } from '../constants';

const getPrediction = (tripId: string, stopId: string) => {
    return fetch(`${APP_DATA_BASE_PATH}/predictions/${tripId}/${stopId}`).then((res) => {
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
