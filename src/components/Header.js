import React from 'react';

import logo from '../../static/images/logo.svg';

const Header = React.forwardRef((props, ref) => {
    const { controls } = props;
    return (
        <div className="header" ref={ref}>
            <a
                href="https://transitmatters.org"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TransitMatters"
            >
                <img src={logo} className="logo" alt="" />
            </a>
            <div className="title">New Train Tracker</div>
            <div className="subtitle">See where the MBTA's new trains are right now</div>
            {controls}
        </div>
    );
});

Header.displayName = 'Header';
export default Header;
