import { useState } from 'react';

import { useDismissal } from '../hooks/useDismissal';
import { FlapBoard } from './FlapBoard/FlapBoard';

const DONATE_URL = 'https://transitmatters.org/donate?utm_source=ntt&utm_medium=donate-card';
const DISMISSAL_KEY = 'ntt:donate-card:dismissedAt';
const DONATE_RESHOW_AFTER_MS = 180 * 24 * 60 * 60 * 1000;

// Leading spaces centre the shorter phrases on the 16-tile board.
const BOARD_PHRASES = ['KEEP NTT RUNNING', '  RIDER FUNDED', '  DONATE TODAY'];
const THANKS_PHRASES = ['  DONATE TODAY', '   THANK YOU!'];

const trackEvent = (path: string, title: string) => {
    window.goatcounter?.count?.({ path, title, event: true });
};

export const DonateCard: React.FC = () => {
    const [dismissed, dismiss] = useDismissal(DISMISSAL_KEY, DONATE_RESHOW_AFTER_MS);
    const [thanked, setThanked] = useState(false);

    if (dismissed) {
        return null;
    }

    const handleDonateClick = () => {
        trackEvent('donate-card-click', 'Donate card: donate');
        // Don't hide the card under the click (the link still needs to open); just stop asking
        // on future visits and say thanks.
        dismiss({ hide: false });
        setThanked(true);
    };

    const handleClose = () => {
        trackEvent('donate-card-dismiss', 'Donate card: dismiss');
        dismiss();
    };

    return (
        <aside className="donate-card" aria-label="Support TransitMatters">
            <button
                type="button"
                className="donate-card-close"
                aria-label="Dismiss donation request"
                onClick={handleClose}
            >
                ×
            </button>
            <h2 className="donate-card-heading">
                <span className="screenreader-only">
                    {thanked ? 'Thank you!' : 'Keep NTT running. Donate today.'}
                </span>
                <FlapBoard
                    key={thanked ? 'thanks' : 'ask'}
                    phrases={thanked ? THANKS_PHRASES : BOARD_PHRASES}
                    width={16}
                    holdMs={thanked ? 400 : 2400}
                />
            </h2>
            <p className="donate-card-body">
                New Train Tracker is free and built by volunteers at TransitMatters, a nonprofit.
                Your donation keeps it online.
            </p>
            <a
                className="donate-card-button"
                href={DONATE_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDonateClick}
            >
                Donate
            </a>
        </aside>
    );
};
DonateCard.displayName = 'DonateCard';
