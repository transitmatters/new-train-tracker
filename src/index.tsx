import { datadogRum } from '@datadog/browser-rum';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { App } from './components/App';
import './main.css';

datadogRum.init({
    // @ts-expect-error Value will be undefined when running locally
    applicationId: process.env.REACT_APP_DATADOG_APP_ID,
    // @ts-expect-error Value will be undefined when running locally
    clientToken: process.env.REACT_APP_DATADOG_CLIENT_TOKEN,
    site: 'datadoghq.com',
    service: process.env.REACT_APP_NAME,
    version: process.env.REACT_APP_VERSION,
    sessionSampleRate: 100,
    sessionReplaySampleRate: 20,
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
});
datadogRum.startSessionReplayRecording();

const container = document.getElementById('root');
ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    container
);
