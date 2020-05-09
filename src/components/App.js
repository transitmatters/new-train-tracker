import React, { useState, useEffect } from 'react';
import { useTabState, useTab } from 'reakit';

import { greenLine, orangeLine, redLine } from '../lines';
import { useMbtaApi } from '../useMbtaApi';

import LinePane from './LinePane';
import Header from './Header';
import LinePicker from './LinePicker';
import TabPicker from './TabPicker';

const lines = [greenLine, orangeLine, redLine];

const App = () => {
    const api = useMbtaApi(lines);
    const [header, setHeader] = useState(null);
    const [selectedLine, setSelectedLine] = useState(greenLine);
    const tabState = useTabState();

    useEffect(() => {
        document.documentElement.style.setProperty(
            '--line-color',
            selectedLine.colorBright
        );
        document.documentElement.style.setProperty(
            '--line-color-transparent',
            selectedLine.colorBright + '00'
        );
    }, [selectedLine]);

    const renderControls = () => {
        return (
            <TabPicker
                tabState={tabState}
                lines={lines}
                trainsByRoute={api.trainsByRoute}
            />
        );
    };

    if (api.isReady) {
        return (
            <>
                <LinePane
                    key={selectedLine.name}
                    line={selectedLine}
                    api={api}
                    headerElement={header}
                />
                <Header ref={setHeader} controls={renderControls()} />
            </>
        );
    }

    return null;
};

export default App;
