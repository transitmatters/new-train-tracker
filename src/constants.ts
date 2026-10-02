export const PRODUCTION = 'traintracker.transitmatters.org';
export const BETA = 'ntt-beta.labs.transitmatters.org';
export const LOCAL = 'localhost';
const BETA_API = 'https://ntt-api-beta.labs.transitmatters.org';

const FRONTEND_TO_BACKEND_MAP: { [key in string]: string } = {
    [PRODUCTION]: 'https://traintracker-api.labs.transitmatters.org',
    [BETA]: BETA_API,
    [LOCAL]: 'http://localhost:5555',
};

let domain = '';
if (typeof window !== 'undefined') {
    domain = window.location.hostname;
}
export const APP_DATA_BASE_PATH = FRONTEND_TO_BACKEND_MAP[domain] || '';

export const isBetaHost = () => domain === BETA;

// Datadog RUM runs on beta only. Prod uses GoatCounter so it needs no cookie notice.
// deploy.sh sets these for beta builds.
export const DD_RUM = {
    applicationId: process.env.DD_RUM_APPLICATION_ID,
    clientToken: process.env.DD_RUM_CLIENT_TOKEN,
    tracedApi: BETA_API,
};

// Time in milliseconds
export const ONE_DAY = 24 * 60 * 60 * 1000;
export const ONE_HOUR = 60 * 60 * 1000;
export const FIVE_MINUTES = 5 * 60 * 1000;
export const TEN_SECONDS = 10 * 1000;
export const FIFTEEN_SECONDS = 15 * 1000;
