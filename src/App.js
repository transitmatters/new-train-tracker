import React from 'react';
import './App.css';

import { greenB, greenC, greenD, greenE } from "./paths"

const renderLineAsSvg = (...lines) => {
    const pathDirective = lines.reduce((accPath, line) => {
        const start = line[0];
        if (start.type !== 'start') {
            throw new Error("Line must begin with a start() command");
        }
        const part = line.slice(1).reduce((acc, command) => {
            const { path, turtle } = acc;
            const next = command(turtle);
            return {
                path: `${path}${path.length ? " " : ""}${next.path}`,
                turtle: next.turtle,
            }
        }, start);
        return `${accPath}${accPath.length ? " " : ""}${part.path}`;
    }, "");
    console.log(pathDirective);
    return <path d={pathDirective} stroke="black" fill="transparent" />
}

function App() {
    return (
        <div className="app">
            <svg className="test" viewBox="-100 -100 200 200" xmlns="http://www.w3.org/2000/svg">
                {renderLineAsSvg(greenB, greenC, greenD, greenE)}
            </svg>
        </div>
    );
}

export default App;
