import React, { useEffect, useState, useLayoutEffect } from 'react';
import { useTabState } from 'reakit';

import { greenLine, orangeLine, redLine } from '../lines';
import { useMbtaApi } from '../useMbtaApi';

import Line from './Line';
import Header from './Header';
import TabPicker from './TabPicker';

const lines = [greenLine, orangeLine, redLine];

const App = () => {
    const api = useMbtaApi(lines);
    const [headerHeight, setHeaderHeight] = useState(null);
    const tabState = useTabState({ loop: false });
    const tabIndex = tabState.currentId
        ? tabState.items.findIndex(i => i.id === tabState.currentId)
        : 0;
    const selectedLine = lines[tabIndex];

    useLayoutEffect(() => {
        const backgroundColor = selectedLine.colorSecondary;
        const { documentElement } = document;
        documentElement.style.setProperty('--line-color', backgroundColor);
        documentElement.style.setProperty('--line-color-transparent', backgroundColor + '00');
    }, [selectedLine]);

    useEffect(() => {
        document.getElementById('root').scrollTo({ top: 0, behavior: 'smooth' });
    }, [selectedLine]);

    useEffect(() => {
        const listener = evt => {
            if (evt.key === 'Tab') {
                console.log('heyooo');
                document.documentElement.style.setProperty(
                    '--focus-outline-style',
                    '0px 0px 0px 2px white'
                );
            }
        };
        document.addEventListener('keydown', listener);
        return () => document.removeEventListener('keydown', listener);
    }, []);

    const setHeaderHeightFromElement = el => {
        if (el) {
            setHeaderHeight(el.getBoundingClientRect().height);
        }
    };

    const renderControls = () => {
        return <TabPicker tabState={tabState} lines={lines} trainsByRoute={api.trainsByRoute} />;
    };

    if (api.isReady) {
        return (
            <>
                <Header ref={setHeaderHeightFromElement} controls={renderControls()} />
                <Line
                    key={selectedLine.name}
                    line={selectedLine}
                    api={api}
                    style={{ marginTop: headerHeight }}
                />
            </>
        );
    }

    return null;
};

export default App;
