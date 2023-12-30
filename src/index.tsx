import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { App } from './components/App';
import './main.css';

const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
    },
]);

const container = document.getElementById('root');
ReactDOM.render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>,
    container
);
