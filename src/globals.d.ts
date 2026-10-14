declare module '*.css';

// GoatCounter analytics, loaded by the script tag in index.html (absent if blocked).
interface Window {
    goatcounter?: {
        count?: (vars: { path: string; title?: string; event?: boolean }) => void;
    };
}
