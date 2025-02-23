export const PRODUCTION = 'traintracker.transitmatters.org';
export const BETA = 'ntt-beta.labs.transitmatters.org';
export const LOCAL = 'localhost';

const FRONTEND_TO_BACKEND_MAP: { [key in string]: string } = {
    [PRODUCTION]: 'https://traintracker-api.labs.transitmatters.org',
    [BETA]: 'https://ntt-api-beta.labs.transitmatters.org',
    [LOCAL]: 'http://localhost:5555',
};

let domain = '';
if (typeof window !== 'undefined') {
    domain = window.location.hostname;
}
export const APP_DATA_BASE_PATH = FRONTEND_TO_BACKEND_MAP[domain] || '';

// Time in milliseconds
export const ONE_HOUR = 60 * 60 * 1000;
export const FIVE_MINUTES = 5 * 60 * 1000;
export const TEN_SECONDS = 10 * 1000;
