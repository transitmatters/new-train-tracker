import { useState, useEffect } from 'react';

export const useFontsLoaded = () => {
    const [fontsLoaded, setFontsLoaded] = useState(false);

    useEffect(() => {
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => setFontsLoaded(true));
        }
    });

    return fontsLoaded;
};
