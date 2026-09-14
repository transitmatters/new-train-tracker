import {
    BETA,
    FIFTEEN_SECONDS,
    FIVE_MINUTES,
    LOCAL,
    ONE_DAY,
    ONE_HOUR,
    PRODUCTION,
    TEN_SECONDS,
    resolveApiBasePath,
} from '../constants';

describe('resolveApiBasePath', () => {
    it('points production at the production API', () => {
        expect(resolveApiBasePath(PRODUCTION)).toBe(
            'https://traintracker-api.labs.transitmatters.org'
        );
    });

    it('points beta at the beta API', () => {
        expect(resolveApiBasePath(BETA)).toBe('https://ntt-api-beta.labs.transitmatters.org');
    });

    it('points local development at the local chalice port', () => {
        // Must match the port in the start-python npm script.
        expect(resolveApiBasePath(LOCAL)).toBe('http://localhost:5555');
    });

    it('falls back to a relative path on an unrecognised host', () => {
        expect(resolveApiBasePath('some-preview-deploy.example.com')).toBe('');
    });

    it('names the hosts the deployment actually uses', () => {
        // These strings are duplicated in deploy.sh and .chalice/config.json.
        expect(PRODUCTION).toBe('traintracker.transitmatters.org');
        expect(BETA).toBe('ntt-beta.labs.transitmatters.org');
    });
});

describe('time constants', () => {
    it('expresses each interval in milliseconds', () => {
        expect(ONE_DAY).toBe(86_400_000);
        expect(ONE_HOUR).toBe(3_600_000);
        expect(FIVE_MINUTES).toBe(300_000);
        expect(TEN_SECONDS).toBe(10_000);
        expect(FIFTEEN_SECONDS).toBe(15_000);
    });
});
