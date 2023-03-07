import { useEffect, useLayoutEffect } from 'react';
import Favicon from 'react-favicon';
import { useTabState } from 'reakit';

import { greenLine, orangeLine, redLine, blueLine } from '../lines';
import { useMbtaApi } from '../useMbtaApi';
import { getInitialDataByKey } from '../initialData';

import { Line } from './Line';
import { Header } from './Header';
import { Footer } from './Footer';
import { LineTabPicker, getTabIdForLine } from './LineTabPicker';
import { setCssVariable } from './util';

// @ts-expect-error Favicon png seems to throw typescript error
import favicon from '../../static/images/favicon.png';
import { AgeTabPicker } from './AgeTabPicker';
import { Line as TLine, VehiclesAge } from '../types';

const lineByTabId: Record<string, TLine> = {
    'tab-Green': greenLine,
    'tab-Orange': orangeLine,
    'tab-Red': redLine,
    'tab-Blue': blueLine,
};

export const App: React.FC = () => {
    const tabState = useTabState({ loop: false });
    const ageTabState = useTabState({ currentId: 'new_vehicles', loop: false });

    const api = useMbtaApi(Object.values(lineByTabId), ageTabState.currentId as VehiclesAge);
    const selectedLine = tabState.currentId
        ? lineByTabId[tabState.currentId]
        : lineByTabId['tab-Green'];

    useLayoutEffect(() => {
        const backgroundColor = selectedLine.colorSecondary;
        setCssVariable('--line-color', backgroundColor);
        setCssVariable('--line-color-transparent', backgroundColor + '00');
    }, [selectedLine]);

    useEffect(() => {
        if (api.isReady) {
            const lineWithTrains = Object.values(lineByTabId).find((line) => {
                const routeIds = Object.keys(line.routes);
                if (api.trainsByRoute !== null) {
                    // @ts-expect-error Despite the above check, Typescript fails to understand that trainsByRoute won't be null
                    return routeIds.some((routeId) => api.trainsByRoute[routeId].length > 0);
                }
            });
            if (lineWithTrains) {
                tabState.setCurrentId(getTabIdForLine(lineWithTrains));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [api.isReady]);

    useEffect(() => {
        const listener = (evt) => {
            if (evt.key === 'Tab') {
                setCssVariable('--focus-outline-style', '0px 0px 0px 2px white');
            }
        };
        document.addEventListener('keydown', listener);
        return () => document.removeEventListener('keydown', listener);
    }, []);

    const selectedLineColor: string = tabState.currentId
        ? lineByTabId[tabState.currentId]?.color
        : greenLine.color;

    const renderControls = () => {
        return (
            <div className={'selectors'}>
                <AgeTabPicker tabState={ageTabState} tabColor={selectedLineColor} />
                {api.trainsByRoute && (
                    <LineTabPicker
                        tabState={tabState}
                        lines={Object.values(lineByTabId)}
                        trainsByRoute={api.trainsByRoute}
                    />
                )}
            </div>
        );
    };

    if (api.isReady) {
        return (
            <>
                <Favicon url={favicon} />
                <Header controls={renderControls()} />
                <Line key={selectedLine?.name} line={selectedLine} api={api} />
                <Footer version={getInitialDataByKey('version')} />
            </>
        );
    }

    return null;
};
