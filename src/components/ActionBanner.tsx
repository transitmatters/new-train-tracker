const EXPIRY_DATE = new Date('2026-05-01T00:00:00');

export const ActionBanner: React.FC = () => {
    if (new Date() >= EXPIRY_DATE) {
        return null;
    }

    return (
        <a
            className="action-banner"
            href="https://secure.everyaction.com/DKcTW8SPr06sCMwjIo44UA2"
            target="_blank"
            rel="noopener noreferrer"
        >
            Help Us Make This Year's CIP Better And Bolder!
        </a>
    );
};
