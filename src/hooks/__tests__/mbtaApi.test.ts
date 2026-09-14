import { filterTrains, getRoutesInfo, getStationsForRoute, getTrainPositions } from '../mbtaApi';
import { makeTrain } from '../../testing/factories';
import { mockFetchJson, mockFetchPayload, mockFetchStatus } from '../../testing/fetchMock';

const trains = [
    makeTrain({ vehicleId: 'new', isNewTrain: true }),
    makeTrain({ vehicleId: 'old', isNewTrain: false }),
    makeTrain({ vehicleId: 'pride', isNewTrain: false, isPrideCar: true }),
    makeTrain({ vehicleId: 'holiday', isNewTrain: false, isHolidayCar: true }),
    makeTrain({ vehicleId: 'newPride', isNewTrain: true, isPrideCar: true }),
];

const idsFor = (category: Parameters<typeof filterTrains>[1]) =>
    filterTrains(trains, category).map((train) => train.vehicleId);

describe('filterTrains', () => {
    it('keeps only new trains', () => {
        expect(idsFor('new_vehicles')).toEqual(['new', 'newPride']);
    });

    it('keeps only old trains', () => {
        expect(idsFor('old_vehicles')).toEqual(['old', 'pride', 'holiday']);
    });

    it('keeps pride cars regardless of age', () => {
        expect(idsFor('pride')).toEqual(['pride', 'newPride']);
    });

    it('keeps holiday cars', () => {
        expect(idsFor('holiday')).toEqual(['holiday']);
    });

    it('passes everything through for the "all" category', () => {
        expect(idsFor('vehicles')).toHaveLength(trains.length);
    });

    it('does not mutate its input', () => {
        filterTrains(trains, 'new_vehicles');
        expect(trains).toHaveLength(5);
    });
});

/*
The error paths below are the entire substance of the "harden frontend against
API errors and rate limiting" work; nothing guarded them before.
*/
describe('getTrainPositions', () => {
    it('requests every route in one comma-separated call', async () => {
        const fetchMock = mockFetchJson({ '/trains/Red-A,Red-B': [] });

        await getTrainPositions(['Red-A', 'Red-B']);

        const requested = new URL(fetchMock.mock.calls[0][0] as string);
        expect(requested.pathname).toBe('/trains/Red-A,Red-B');
    });

    it('resolves to the train array', async () => {
        mockFetchJson({ '/trains/Red-A': [makeTrain({ vehicleId: 'v9' })] });

        await expect(getTrainPositions(['Red-A'])).resolves.toMatchObject([{ vehicleId: 'v9' }]);
    });

    it('rejects on an HTTP error so react-query can retry', async () => {
        mockFetchStatus(503);

        await expect(getTrainPositions(['Red-A'])).rejects.toThrow(/Failed to fetch trains: 503/);
    });

    it('rejects when the API returns an object instead of an array', async () => {
        // Observed under rate limiting: a JSON:API error document, not a list.
        mockFetchPayload({ errors: [{ status: '429' }] });

        await expect(getTrainPositions(['Red-A'])).rejects.toThrow(/Invalid train data/);
    });
});

describe('getStationsForRoute', () => {
    it('resolves to the station array', async () => {
        mockFetchJson({ '/stops/Red-A': [{ id: 'place-alfcl' }] });

        await expect(getStationsForRoute('Red-A')).resolves.toMatchObject([{ id: 'place-alfcl' }]);
    });

    it('rejects on an HTTP error, naming the route', async () => {
        mockFetchStatus(500);

        await expect(getStationsForRoute('Red-A')).rejects.toThrow(
            /Failed to fetch stations for Red-A: 500/
        );
    });

    it('rejects on a non-array payload', async () => {
        mockFetchPayload({ errors: [] });

        await expect(getStationsForRoute('Red-A')).rejects.toThrow(
            /Invalid station data for Red-A/
        );
    });
});

describe('getRoutesInfo', () => {
    it('resolves to the routes array', async () => {
        mockFetchJson({ '/routes/Red-A,Red-B': [{ id: 'Red-A' }, { id: 'Red-B' }] });

        await expect(getRoutesInfo(['Red-A', 'Red-B'])).resolves.toHaveLength(2);
    });

    it('rejects on an HTTP error', async () => {
        mockFetchStatus(429);

        await expect(getRoutesInfo(['Red-A'])).rejects.toThrow(/Failed to fetch routes info: 429/);
    });

    it('rejects on a non-array payload', async () => {
        mockFetchPayload({ errors: [] });

        await expect(getRoutesInfo(['Red-A'])).rejects.toThrow(/Invalid routes info received/);
    });
});
