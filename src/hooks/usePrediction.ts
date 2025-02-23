import { APP_DATA_BASE_PATH, TEN_SECONDS } from '../constants';
import { useQuery } from '@tanstack/react-query';

const getPrediction = (tripId: string | null, stopId: string) => {
    if (!tripId) {
        return Promise.resolve(null);
    }

    return fetch(`${APP_DATA_BASE_PATH}/predictions/${tripId}/${stopId}`).then((res) => {
        return res.json();
    });
};

export const usePrediction = (tripId: string | null, stopId: string) => {
    const { data: prediction } = useQuery({
        queryKey: ['getPrediction', tripId, stopId],
        queryFn: () => getPrediction(tripId, stopId),
        enabled: !!tripId,
        staleTime: TEN_SECONDS,
    });

    return prediction;
};
