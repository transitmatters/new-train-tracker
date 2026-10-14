import { useCallback, useState } from 'react';

const readDismissedAt = (key: string): number | null => {
    try {
        const value = window.localStorage.getItem(key);
        const timestamp = value === null ? NaN : Number(value);
        return Number.isFinite(timestamp) ? timestamp : null;
    } catch {
        return null;
    }
};

const writeDismissedAt = (key: string, timestamp: number) => {
    try {
        window.localStorage.setItem(key, String(timestamp));
    } catch {
        // Storage can be unavailable (private mode, blocked site data); dismissal then only
        // lasts for the current page view.
    }
};

/**
 * Tracks whether something has been dismissed in this browser, persisted in localStorage.
 * A dismissal expires after `ttlMs`, at which point the item is shown again.
 *
 * `dismiss()` hides the item immediately; `dismiss({ hide: false })` only records the dismissal,
 * leaving it visible until the next page load.
 */
export const useDismissal = (
    key: string,
    ttlMs: number
): [boolean, (options?: { hide?: boolean }) => void] => {
    const [dismissed, setDismissed] = useState(() => {
        const dismissedAt = readDismissedAt(key);
        return dismissedAt !== null && Date.now() - dismissedAt < ttlMs;
    });

    const dismiss = useCallback(
        ({ hide = true }: { hide?: boolean } = {}) => {
            writeDismissedAt(key, Date.now());
            if (hide) {
                setDismissed(true);
            }
        },
        [key]
    );

    return [dismissed, dismiss];
};
