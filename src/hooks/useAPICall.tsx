// Custom hook to make API calls.
import { useState, useCallback, useEffect } from 'react';

export const useAPICall = (url: string, method: string, body: any) => {
    const [data, setData] = useState<any>();
    const [error, setError] = useState<any>();
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(url, {
                method,
                body: JSON.stringify(body),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const json = await response.json();
            setData(json);
            setLoading(false);
        } catch (error) {
            setError(error);
            setLoading(false);
        }
    }, [url, method, body]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, error, loading };
};
