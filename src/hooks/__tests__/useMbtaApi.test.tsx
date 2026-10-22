import { waitFor } from '@testing-library/react';
import { redLine } from '../../lines';
import { makeStation, makeTrain } from '../../testing/factories';
import { mockFetchJson, mockFetchStatus } from '../../testing/fetchMock';
import { renderHookWithProviders } from '../../testing/render';
import { useMbtaApi } from '../useMbtaApi';

const stations = [makeStation({ id: 'place-alfcl', name: 'Alewife' })];

const happyPath = (trains = [makeTrain({ vehicleId: 'a', route: 'Red-A', isNewTrain: true })]) => ({
    '/trains/Red-A,Red-B': trains,
    '/stops/Red-A': stations,
    '/stops/Red-B': stations,
    '/routes/Red-A,Red-B': [{ id: 'Red-A' }, { id: 'Red-B' }],
});

describe('useMbtaApi', () => {
    it('becomes ready once every endpoint has answered', async () => {
        mockFetchJson(happyPath());

        const { result } = renderHookWithProviders(() => useMbtaApi([redLine]));

        await waitFor(() => expect(result.current.isReady).toBe(true));
        expect(Object.keys(result.current.stationsByRoute!)).toEqual(['Red-A', 'Red-B']);
        expect(result.current.routesInfo!['Red-A']).toBeDefined();
    });

    it('buckets trains by route, including routes with none', async () => {
        mockFetchJson(
            happyPath([
                makeTrain({ vehicleId: 'a1', route: 'Red-A' }),
                makeTrain({ vehicleId: 'a2', route: 'Red-A' }),
            ])
        );

        const { result } = renderHookWithProviders(() => useMbtaApi([redLine]));

        await waitFor(() => expect(result.current.isReady).toBe(true));
        expect(result.current.trainsByRoute!['Red-A'].map((t) => t.vehicleId)).toEqual([
            'a1',
            'a2',
        ]);
        // Every requested route gets a key, so the tab pickers can show a count of 0.
        expect(result.current.trainsByRoute!['Red-B']).toEqual([]);
    });

    it('applies the selected vehicle category', async () => {
        mockFetchJson(
            happyPath([
                makeTrain({ vehicleId: 'new', route: 'Red-A', isNewTrain: true }),
                makeTrain({ vehicleId: 'old', route: 'Red-A', isNewTrain: false }),
            ])
        );

        const { result } = renderHookWithProviders(() => useMbtaApi([redLine], 'old_vehicles'));

        await waitFor(() => expect(result.current.isReady).toBe(true));
        expect(result.current.trainsByRoute!['Red-A'].map((t) => t.vehicleId)).toEqual(['old']);
    });

    it('ignores a train on a route this line does not own', async () => {
        // The backend derives Red-A/Red-B itself; an unexpected value must not
        // crash the render path.
        mockFetchJson(happyPath([makeTrain({ vehicleId: 'stray', route: 'Orange' })]));

        const { result } = renderHookWithProviders(() => useMbtaApi([redLine]));

        await waitFor(() => expect(result.current.isReady).toBe(true));
        expect(result.current.trainsByRoute!['Red-A']).toEqual([]);
    });

    it('stays un-ready without throwing when the API is failing', async () => {
        // The contract behind the rate-limiting hardening: an upstream 500 must
        // leave the app on its loading state, not blow up the tree.
        mockFetchStatus(500);

        const { result } = renderHookWithProviders(() => useMbtaApi([redLine]));

        await waitFor(() => expect(result.current.trainsByRoute).toBeNull());
        expect(result.current.isReady).toBe(false);
        expect(result.current.stationsByRoute).toBeNull();
    });
});
