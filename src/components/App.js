import React, { useEffect } from 'react';
import { useTabState } from 'reakit';

import { greenLine, orangeLine, redLine } from '../lines';
import { useMbtaApi } from '../useMbtaApi';

import LinePane from './LinePane';
import Header from './Header';
import TabPicker from './TabPicker';

const lines = [greenLine, orangeLine, redLine];

const App = () => {
    const api = useMbtaApi(lines);
    const tabState = useTabState({ loop: false });
    const tabIndex = tabState.currentId
        ? tabState.items.findIndex(i => i.id === tabState.currentId)
        : 0;
    const selectedLine = lines[tabIndex];

    useEffect(() => {
        document.documentElement.style.setProperty(
            '--line-color',
            selectedLine.colorSecondary
        );
        document.documentElement.style.setProperty(
            '--line-color-transparent',
            selectedLine.colorSecondary + '00'
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
                <Header controls={renderControls()} />
                <LinePane
                    key={selectedLine.name}
                    line={selectedLine}
                    api={api}
                />
            </>
        );
    }

    return null;
};

export default App;
