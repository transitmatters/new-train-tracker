import { APP_DATA_BASE_PATH, TEN_SECONDS } from '../constants';
import { useQuery } from '@tanstack/react-query';

const getPrediction = (tripId: string, stopId: string) => {
    return fetch(`${APP_DATA_BASE_PATH}/predictions/${tripId}/${stopId}`).then((res) => {
        return res.json();
    });
};

export const usePrediction = (tripId: string, stopId: string) => {
    const { data: prediction } = useQuery({
        queryKey: ['getPrediction', tripId, stopId],
        queryFn: () => getPrediction(tripId, stopId),
        enabled: !!tripId,
        staleTime: TEN_SECONDS,
    });

    return prediction;
};
