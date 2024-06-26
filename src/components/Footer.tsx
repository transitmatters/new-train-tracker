export const Footer: React.FC<{ version?: string }> = ({ version }) => {
    return (
        <div className="footer">
            <p>
                <a href="https://transitmatters.org/transitmatters-labs">TransitMatters Labs</a> |{' '}
                <a href="https://github.com/transitmatters/new-train-tracker">Source code</a> |{' '}
                <a href="mailto:labs@transitmatters.org?subject=[Train%20Tracker%20Feedback]%20-%20">
                    Send feedback
                </a>{' '}
                | {version ? `v${version}` : 'dev'}
            </p>
        </div>
    );
};

Footer.displayName = 'Footer';
