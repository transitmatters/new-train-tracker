import React from 'react';

const Footer = React.forwardRef((props, ref) => {
    const { version } = props;
    return (
        <div className="footer" ref={ref}>
            <p>
                <a href="https://transitmatters.org/transitmatters-labs">TransitMatters Labs</a> |{' '}
                <a href="https://github.com/transitmatters/new-train-tracker">Source code</a> |{' '}
                <a href="mailto:labs@transitmatters.org?subject=[Train%20Tracker%20Feedback]%20-%20">
                    Send feedback
                </a>{' '}
                | v{version}
            </p>
        </div>
    );
});

Footer.displayName = 'Footer';
export default Footer;
