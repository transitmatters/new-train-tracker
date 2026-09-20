import { render, screen } from '@testing-library/react';
import { renderTextTrainlabel, renderTrainLabel } from '../labels';
import { makeCarriage, makeRoute, makeStation, makeTrain } from '../testing/factories';
import { OccupancyStatus, Prediction } from '../types';

const stations = [
    makeStation({ id: 'place-pktrm', name: 'Park Street' }),
    makeStation({ id: 'place-hymnl', name: 'Hynes Convention Center' }),
];

const route = makeRoute({
    id: 'Green-B',
    stations,
    directionDestinations: ['Boston College', 'Government Center'],
});

describe('renderTextTrainlabel', () => {
    it('describes a stopped train for a screenreader', () => {
        const train = makeTrain({
            stationId: 'place-pktrm',
            currentStatus: 'STOPPED_AT',
            direction: 0,
            label: '3900',
        });

        expect(renderTextTrainlabel(train, route)).toBe(
            'Green-B train At Park Street bound for Boston College with lead car 3900'
        );
    });

    it.each([['IN_TRANSIT_TO'], ['INCOMING_AT']] as const)(
        'reads %s as "Near"',
        (currentStatus) => {
            const train = makeTrain({ stationId: 'place-pktrm', currentStatus });

            expect(renderTextTrainlabel(train, route)).toContain('train Near Park Street');
        }
    );

    it('uses the destination matching the train direction', () => {
        const train = makeTrain({ stationId: 'place-pktrm', direction: 1 });

        expect(renderTextTrainlabel(train, route)).toContain('bound for Government Center');
    });

    it('returns null when the train is not at a station on this route', () => {
        const train = makeTrain({ stationId: 'place-nowhere' });

        expect(renderTextTrainlabel(train, route)).toBeNull();
    });
});

describe('station name abbreviation', () => {
    it.each([
        ['Boston University East', 'BU East'],
        ['Hynes Convention Center', 'Hynes'],
        ['Government Center', "Gov't Center"],
        ['Northeastern University', 'Northeastern'],
        ['Museum of Fine Arts', 'MFA'],
        ['Massachusetts Avenue', 'Mass Ave'],
    ])('shortens %s to %s', (name, expected) => {
        const abbreviating = makeRoute({
            id: 'Green-B',
            stations: [makeStation({ id: 's', name })],
            directionDestinations: ['Boston College', 'Government Center'],
        });

        expect(renderTextTrainlabel(makeTrain({ stationId: 's' }), abbreviating)).toContain(
            `Near ${expected} bound`
        );
    });
});

describe('renderTrainLabel', () => {
    const renderLabel = (
        overrides: Parameters<typeof makeTrain>[0] = {},
        prediction: Prediction | null = null
    ) =>
        render(
            <>
                {renderTrainLabel(
                    makeTrain({ stationId: 'place-pktrm', ...overrides }),
                    prediction,
                    route,
                    '#fff'
                )}
            </>
        );

    it('converts speed from metres per second to mph', () => {
        renderLabel({ speed: 10 });

        expect(screen.getByText('Speed: 22.37 mph')).toBeInTheDocument();
    });

    it('omits speed entirely when it is unknown', () => {
        renderLabel({ speed: null });

        expect(screen.queryByText(/Speed:/)).not.toBeInTheDocument();
    });

    it('omits speed for a stationary train', () => {
        // Zero is falsy, so a stopped train shows no speed at all rather than
        // "Speed: 0 mph". Pinned deliberately -- it is arguably the wrong call.
        renderLabel({ speed: 0 });

        expect(screen.queryByText(/Speed:/)).not.toBeInTheDocument();
    });

    it('shows the build year when known and hides it otherwise', () => {
        const { unmount } = renderLabel({ yearBuilt: '2018-20' });
        expect(screen.getByText('Oldest car built in: 2018-20')).toBeInTheDocument();
        unmount();

        renderLabel({ yearBuilt: '' });
        expect(screen.queryByText(/Oldest car built in:/)).not.toBeInTheDocument();
    });

    it('shows a departure prediction only when one exists', () => {
        renderLabel({}, null);

        expect(screen.queryByText(/Next departure/)).not.toBeInTheDocument();
    });

    it('shows the lead car number', () => {
        renderLabel({ label: '3900' });

        expect(screen.getByText('#3900')).toBeInTheDocument();
    });

    it('omits the lead car badge when the train has no label', () => {
        const { container } = renderLabel({ label: '' });

        expect(container.querySelector('.lead-car')).toBeNull();
    });

    it('renders one block per carriage', () => {
        const { container } = renderLabel({
            carriages: [makeCarriage('3900'), makeCarriage('3901'), makeCarriage('3902')],
        });

        expect(container.querySelectorAll('.train-carriage')).toHaveLength(3);
        expect(container.querySelector('.train-carriage')).toHaveClass('first');
        expect(container.querySelectorAll('.train-carriage')[2]).toHaveClass('last');
    });

    it('hides occupancy entirely when no carriage reports it', () => {
        const { container } = renderLabel({
            carriages: [makeCarriage('3900'), makeCarriage('3901')],
        });

        expect(container.querySelector('.occupancy-status-container')).toBeNull();
        expect(container.querySelector('.occupancy-status-text')).toBeNull();
    });

    it('renders occupancy as sentence case when any carriage reports it', () => {
        renderLabel({
            carriages: [
                makeCarriage('3900', 'FEW_SEATS_AVAILABLE', 60),
                makeCarriage('3901', 'NO_DATA_AVAILABLE'),
            ],
        });

        expect(screen.getByText('Few seats available')).toBeInTheDocument();
        expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it.each<[OccupancyStatus, number]>([
        ['EMPTY', 1],
        ['MANY_SEATS_AVAILABLE', 1],
        ['FEW_SEATS_AVAILABLE', 2],
        ['STANDING_ROOM_ONLY', 3],
        ['CRUSHED_STANDING_ROOM_ONLY', 4],
        ['FULL', 4],
        ['NOT_ACCEPTING_PASSENGERS', 0],
    ])('draws %s with %i person icons', (status, expectedIcons) => {
        const { container } = renderLabel({
            carriages: [makeCarriage('3900', status)],
        });

        expect(container.querySelectorAll('.occupancy-status-icon')).toHaveLength(expectedIcons);
    });

    it.each<[OccupancyStatus, string]>([
        ['EMPTY', 'rgb(0, 129, 80)'],
        ['MANY_SEATS_AVAILABLE', 'rgb(0, 129, 80)'],
        ['FEW_SEATS_AVAILABLE', 'rgb(255, 199, 44)'],
        ['STANDING_ROOM_ONLY', 'rgb(253, 138, 3)'],
        ['CRUSHED_STANDING_ROOM_ONLY', 'rgb(250, 45, 39)'],
        ['FULL', 'rgb(250, 45, 39)'],
        ['NO_DATA_AVAILABLE', 'silver'],
        ['NOT_ACCEPTING_PASSENGERS', 'grey'],
    ])('colours a %s carriage %s', (status, expectedColor) => {
        const { container } = renderLabel({ carriages: [makeCarriage('3900', status)] });

        // Read the inline style rather than the computed one: jsdom leaves named
        // colours like "grey" out of getComputedStyle but keeps them on .style.
        const carriage = container.querySelector('.train-carriage') as HTMLElement;
        expect(carriage.style.backgroundColor).toBe(expectedColor);
    });
});
