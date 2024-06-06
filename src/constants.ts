export const PRODUCTION = 'traintracker.transitmatters.org';
export const BETA = 'ntt-beta.labs.transitmatters.org';
export const LOCAL = 'localhost';
const FRONTEND_TO_BACKEND_MAP = {
    [PRODUCTION]: 'https://traintracker-api.labs.transitmatters.org',
    [BETA]: 'https://ntt-api-beta.labs.transitmatters.org',
    [LOCAL]: 'http://localhost:5000',
};

let domain = '';
if (typeof window !== 'undefined') {
    domain = window.location.hostname;
}
export const APP_DATA_BASE_PATH = FRONTEND_TO_BACKEND_MAP[domain] || '';
