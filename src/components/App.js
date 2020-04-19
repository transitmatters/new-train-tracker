import React, { useState } from 'react';
import { greenLine, orangeLine, redLine } from '../lines';
import { useMbtaApi } from '../useMbtaApi';

import LinePane from './LinePane';
import Header from './Header';
import LinePicker from './LinePicker';

const lines = [greenLine, orangeLine, redLine];

const App = () => {
    const api = useMbtaApi(lines);
    const [header, setHeader] = useState(null);
    const [selectedLine, setSelectedLine] = useState(greenLine);

    const renderControls = () => {
        return (
            <>
                <LinePicker
                    selectedLine={selectedLine}
                    onSelectLine={setSelectedLine}
                    lines={lines}
                    trainsByRoute={api.trainsByRoute}
                />
            </>
        );
    };

    if (api.isReady) {
        return (
            <>
                <Header ref={setHeader} controls={renderControls()} />
                <LinePane
                    key={selectedLine.name}
                    line={selectedLine}
                    api={api}
                    headerElement={header}
                />
            </>
        );
    }

    return null;
};

export default App;
