import React from 'react';

import { greenLine } from '../lines';
import { useMbtaApi } from '../useMbtaApi';

import LinePane from './LinePane';

const App = () => {
    const api = useMbtaApi([greenLine]);

    const renderInner = () => {
        if (api.isReady) {
            return <LinePane active={true} line={greenLine} api={api} />;
        }
    };

    return <div className="app">{renderInner()}</div>;
};

export default App;
