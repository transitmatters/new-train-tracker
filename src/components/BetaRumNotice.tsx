import { useState } from 'react';
import { isBetaHost } from '../constants';

const DISMISSED_KEY = 'tm-beta-rum-notice-dismissed';

const BETA_RUM_TEXT =
    'This is our internal beta. It collects extra usage and performance data with Datadog to help us find bugs. The public Train Tracker doesn’t.';

const readDismissed = () => {
    try {
        return localStorage.getItem(DISMISSED_KEY) === 'true';
    } catch {
        return false;
    }
};

export const BetaRumNotice: React.FC = () => {
    const [dismissed, setDismissed] = useState(readDismissed);

    if (!isBetaHost() || dismissed) return null;

    const dismiss = () => {
        setDismissed(true);
        try {
            localStorage.setItem(DISMISSED_KEY, 'true');
        } catch {
            // Storage blocked; the notice just comes back next visit.
        }
    };

    return (
        <div className="beta-rum-notice" role="status">
            <p>{BETA_RUM_TEXT}</p>
            <button type="button" onClick={dismiss} aria-label="Dismiss">
                ×
            </button>
        </div>
    );
};
