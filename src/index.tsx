import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { App } from './components/App';
import './main.css';

const container = document.getElementById('root');
ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    container
);
