export const Footer: React.FC<{ version?: string }> = ({ version }) => {
    return (
        <div className="footer">
            <p>
                <a href="https://transitmatters.org/transitmatters-labs">About</a> |{' '}
                <a href="https://github.com/transitmatters/new-train-tracker">Source Code</a> |{' '}
                <a href="https://transitmatters.org/donate">Donate</a> |{' '}
                <a href="mailto:labs@transitmatters.org?subject=[Train%20Tracker%20Feedback]%20-%20">
                    Feedback
                </a>{' '}
                | {version ? `v${version}` : 'dev'}
            </p>
        </div>
    );
};

Footer.displayName = 'Footer';
