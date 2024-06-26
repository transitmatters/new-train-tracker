import logo from '../../public/images/logo.svg';

export const Header = (props) => {
    const { controls } = props;
    return (
        <div className="header">
            <a
                href="https://transitmatters.org"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TransitMatters"
            >
                <img src={logo} className="logo" alt="" />
            </a>
            <div className="title">New Train Tracker</div>
            <div className="subtitle">See where the MBTA's trains are right now</div>
            {controls}
        </div>
    );
};

Header.displayName = 'Header';
