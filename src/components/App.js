import React from 'react';

import { greenLine } from '../lines';
import { useMbtaApi } from '../useMbtaApi';

import LinePane from './LinePane';

const App = () => {
    const api = useMbtaApi([greenLine]);

    const renderMain = () => {
        if (api.isReady) {
            return <LinePane active={true} line={greenLine} api={api} />;
        }
    };

    return (
        <div className="app">
            <div className="header">
                <h1>MBTA New Train Tracker</h1>
                <div className="subtitle">something something TransitMatters</div>
            </div>
            {renderMain()}
        </div>
    );
};

export default App;
