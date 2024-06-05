import { useQuery } from '@tanstack/react-query';

const FIVE_MINUTES = 5 * 60 * 1000;

export const fetchLastSighting = (): Promise<{
    [line: string]: { car: string; time: string };
}> => {
    const url = new URL(`/last_seen.json`, window.location.origin);
    return fetch(url.toString()).then((resp) => resp.json());
};

export const useLastSightingByLine = (line: string) => {
    const { data: sightings } = useQuery({
        queryKey: ['lastSeen'],
        queryFn: fetchLastSighting,
        staleTime: FIVE_MINUTES,
    });
    if (sightings && sightings[line]) {
        return sightings[line];
    }
};
