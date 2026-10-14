import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';

import { useDismissal } from '../hooks/useDismissal';
import { LineName } from '../types';
import { SplitFlapText } from './bits/SplitFlapText/SplitFlapText';
import { StarBorder } from './bits/StarBorder/StarBorder';

// MBTA line colours, brightened where needed to stay legible (>= 4.5:1) on the dark card.
const RED = '#F2463D';
const GREEN = '#16A05A';
const ORANGE = '#ED8B00';
const BLUE = '#7CA5E3';

// The card's text borrows a contrasting line's colour, so it never matches the page background
// (which is the selected line's colour).
const ACCENT_BY_LINE: Record<LineName, string> = {
    Green: RED,
    Red: GREEN,
    Mattapan: GREEN,
    Orange: BLUE,
    Blue: ORANGE,
};

const DONATE_URL = 'https://transitmatters.org/donate?utm_source=ntt&utm_medium=donate-card';
const DISMISSAL_KEY = 'ntt:donate-card:dismissedAt';
const DONATE_RESHOW_AFTER_MS = 180 * 24 * 60 * 60 * 1000;

// Leading spaces centre the shorter phrases on the 16-tile board.
const BOARD_PHRASES = ['KEEP NTT RUNNING', '  RIDER FUNDED', '  DONATE TODAY'];
const THANKS_PHRASES = ['  DONATE TODAY', '   THANK YOU!'];

const trackEvent = (path: string, title: string) => {
    window.goatcounter?.count?.({ path, title, event: true });
};

export const DonateCard: React.FC<{ line: LineName }> = ({ line }) => {
    const [dismissed, dismiss] = useDismissal(DISMISSAL_KEY, DONATE_RESHOW_AFTER_MS);
    const [thanked, setThanked] = useState(false);
    const accent = ACCENT_BY_LINE[line];

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
                <SplitFlapText
                    key={thanked ? 'thanks' : 'ask'}
                    aria-hidden="true"
                    className="donate-card-board"
                    words={thanked ? THANKS_PHRASES : BOARD_PHRASES}
                    loop={false}
                    padTo={16}
                    cycleDelay={thanked ? 400 : 2400}
                    charset="alpha"
                    tileColor="#1c1c1c"
                    textColor={accent}
                    fontSize="1rem"
                    gap="0.12rem"
                    tileRadius="0.18rem"
                />
            </h2>
            <p className="donate-card-body">
                New Train Tracker is free and built by volunteers at TransitMatters, a nonprofit.
                Your donation keeps it online.
            </p>
            <StarBorder
                as="a"
                className="donate-card-button"
                href={DONATE_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDonateClick}
                color={accent}
                backgroundColor="#1c1c1c"
                textColor={accent}
                borderColor={`color-mix(in srgb, ${accent} 40%, transparent)`}
                radius={100}
                duration={5}
            >
                Donate <FontAwesomeIcon icon={faHeart} />
            </StarBorder>
        </aside>
    );
};
DonateCard.displayName = 'DonateCard';
