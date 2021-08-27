import React, { useEffect, useLayoutEffect } from 'react';
import Favicon from 'react-favicon';
import { useTabState } from 'reakit';

import { greenLine, orangeLine, redLine } from '../lines';
import { useMbtaApi } from '../useMbtaApi';
import { getInitialDataByKey } from '../initialData';

import Line from './Line';
import Header from './Header';
import Footer from './Footer';
import TabPicker, { getTabIdForLine } from './TabPicker';
import { setCssVariable } from './util';

import favicon from '../../static/images/favicon.png';

const lines = [greenLine, orangeLine, redLine];

const App = () => {
    const api = useMbtaApi(lines);
    const tabState = useTabState({ loop: false });
    const tabIndex = tabState.currentId
        ? tabState.items.findIndex(i => i.id === tabState.currentId)
        : 0;
    const selectedLine = lines[tabIndex];

    useLayoutEffect(() => {
        const backgroundColor = selectedLine.colorSecondary;
        setCssVariable('--line-color', backgroundColor);
        setCssVariable('--line-color-transparent', backgroundColor + '00');
    }, [selectedLine]);

    useEffect(() => {
        if (api.isReady) {
            const lineWithTrains = lines.find(line => {
                const routeIds = Object.keys(line.routes);
                return routeIds.some(routeId => api.trainsByRoute[routeId].length > 0);
            });
            if (lineWithTrains) {
                tabState.setCurrentId(getTabIdForLine(lineWithTrains));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [api.isReady]);

    useEffect(() => {
        const listener = evt => {
            if (evt.key === 'Tab') {
                setCssVariable('--focus-outline-style', '0px 0px 0px 2px white');
            }
        };
        document.addEventListener('keydown', listener);
        return () => document.removeEventListener('keydown', listener);
    }, []);

    const renderControls = () => {
        return <TabPicker tabState={tabState} lines={lines} trainsByRoute={api.trainsByRoute} />;
    };

    if (api.isReady) {
        return (
            <>
                <Favicon url={favicon} />
                <Header controls={renderControls()} />
                <Line key={selectedLine.name} line={selectedLine} api={api} />
                <Footer version={getInitialDataByKey('version')} />
            </>
        );
    }

    return null;
};

export default App;
