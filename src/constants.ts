export const PRODUCTION = 'traintracker.transitmatters.org';
export const BETA = 'ntt-beta.labs.transitmatters.org';
export const LOCAL = 'localhost';

const FRONTEND_TO_BACKEND_MAP: { [key in string]: string } = {
    [PRODUCTION]: 'https://traintracker-api.labs.transitmatters.org',
    [BETA]: 'https://ntt-api-beta.labs.transitmatters.org',
    [LOCAL]: 'http://localhost:5555',
};

/*
Which backend a given frontend host talks to. Exported as a function because
jsdom will not let a test redefine window.location, and a typo in the map above
is otherwise invisible: every request would resolve against the page origin and
404 with no build or type error.
*/
export const resolveApiBasePath = (hostname: string) => FRONTEND_TO_BACKEND_MAP[hostname] || '';

let domain = '';
if (typeof window !== 'undefined') {
    domain = window.location.hostname;
}
export const APP_DATA_BASE_PATH = resolveApiBasePath(domain);

// Time in milliseconds
export const ONE_DAY = 24 * 60 * 60 * 1000;
export const ONE_HOUR = 60 * 60 * 1000;
export const FIVE_MINUTES = 5 * 60 * 1000;
export const TEN_SECONDS = 10 * 1000;
export const FIFTEEN_SECONDS = 15 * 1000;
