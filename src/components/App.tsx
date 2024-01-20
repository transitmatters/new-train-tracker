import { useEffect, useLayoutEffect } from 'react';
import Favicon from 'react-favicon';

import { greenLine, orangeLine, redLine, blueLine } from '../lines';
import { useMbtaApi } from '../hooks/useMbtaApi';
import { getInitialDataByKey } from '../initialData';

import { Line } from './Line';
import { Header } from './Header';
import { Footer } from './Footer';
import { LineTabPicker } from './LineTabPicker';
import { LineStats } from './LineStats/LineStats';
import { setCssVariable } from './util';

// @ts-expect-error Favicon png seems to throw typescript error
import favicon from '../../static/images/favicon.png';
import { AgeTabPicker } from './AgeTabPicker';
import { Line as TLine } from '../types';

import { useSearchParams } from 'react-router-dom';
import { useLineSearchParam, useAgeSearchParam } from '../hooks/searchParams';

const lineByTabId: Record<string, TLine> = {
    Green: greenLine,
    Orange: orangeLine,
    Red: redLine,
    Blue: blueLine,
};

export const App: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [lineSearchParam, setLineSearchParam] = useLineSearchParam();
    const [ageSearchParam] = useAgeSearchParam();

    const api = useMbtaApi(Object.values(lineByTabId), ageSearchParam);
    const selectedLine = lineByTabId[lineSearchParam];

    useLayoutEffect(() => {
        const backgroundColor = selectedLine.colorSecondary;
        setCssVariable('--line-color', backgroundColor);
        setCssVariable('--line-color-transparent', backgroundColor + '00');
    }, [selectedLine]);

    useEffect(() => {
        // Do not override the line if a query string param exists
        if (searchParams.get('line') !== null) {
            return;
        }

        // Do not run until api is ready
        if (!api.isReady) {
            return;
        }

        const lineWithTrains = Object.values(lineByTabId).find((line) => {
            const routeIds = Object.keys(line.routes);
            if (api.trainsByRoute) {
                return routeIds.some((routeId) => api.trainsByRoute![routeId].length > 0);
            }
        });

        if (lineWithTrains) {
            setLineSearchParam(lineWithTrains);
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

    const renderControls = () => {
        return (
            <div className={'selectors'}>
                <AgeTabPicker tabColor={selectedLine.color} />
                {api.trainsByRoute && (
                    <LineTabPicker
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
                <Line key={selectedLine?.name} line={selectedLine} api={api} age={ageSearchParam} />
                <LineStats line={selectedLine?.name} />
                <Footer version={getInitialDataByKey('version')} />
            </>
        );
    }

    return null;
};
