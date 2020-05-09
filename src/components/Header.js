import React from 'react';

// <div className="title">
//     <div>MBTA</div>
//     <div>New</div>
//     <div>Train</div>
//     <div>Tracker</div>
// </div>
// <div className="subtitle">
//     Brought to&nbsp;you&nbsp;by{' '}
//     <a href="http://transitmatters.org/" target="_blank">
//         TransitMatters
//     </a>
// </div>
// <div className="controls">{controls}</div>

const Header = React.forwardRef((props, ref) => {
    const { controls } = props;
    return (
        <div className="header" ref={ref}>
            <div className="title">New Train Tracker</div>
            {controls}
        </div>
    );
});

Header.displayName = 'Header';
export default Header;
