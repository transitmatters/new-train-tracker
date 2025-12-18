import { APP_DATA_BASE_PATH, FIFTEEN_SECONDS } from '../constants';
import { Prediction } from '../types';
import { useQuery } from '@tanstack/react-query';

const isValidPrediction = (data: unknown): data is Prediction => {
    return (
        data !== null &&
        typeof data === 'object' &&
        'departure_time' in data &&
        data.departure_time !== 'null'
    );
};

const getPrediction = async (tripId: string | null, stopId: string): Promise<Prediction | null> => {
    if (!tripId) {
        return null;
    }

    const res = await fetch(`${APP_DATA_BASE_PATH}/predictions/${tripId}/${stopId}`);
    if (!res.ok) {
        return null;
    }
    const data = await res.json();
    if (!isValidPrediction(data)) {
        // Prediction may legitimately not exist, so just return null without error
        return null;
    }
    return data;
};

export const usePrediction = (tripId: string | null, stopId: string): Prediction | null => {
    const { data: prediction } = useQuery({
        queryKey: ['getPrediction', tripId, stopId],
        queryFn: () => getPrediction(tripId, stopId),
        enabled: !!tripId,
        staleTime: FIFTEEN_SECONDS,
    });

    return prediction ?? null;
};
