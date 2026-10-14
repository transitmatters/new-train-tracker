import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DonateCard } from '../DonateCard';

describe('DonateCard', () => {
    beforeEach(() => {
        window.localStorage.clear();
        // jsdom has no canvas; StarBorder bails out when getContext returns null.
        jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        delete window.goatcounter;
    });

    test('links to the donate page in a new tab', () => {
        render(<DonateCard line="Green" />);
        const link = screen.getByRole('link', { name: /donate/i });
        expect(link).toHaveAttribute(
            'href',
            'https://transitmatters.org/donate?utm_source=ntt&utm_medium=donate-card'
        );
        expect(link).toHaveAttribute('target', '_blank');
        expect(screen.getByRole('heading')).toHaveTextContent('Keep NTT running. Donate today.');
    });

    test('closing hides the card and keeps it hidden on the next visit', async () => {
        const count = jest.fn();
        window.goatcounter = { count };
        const { unmount } = render(<DonateCard line="Green" />);

        await userEvent.click(screen.getByRole('button', { name: 'Dismiss donation request' }));
        expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
        expect(count).toHaveBeenCalledWith(
            expect.objectContaining({ path: 'donate-card-dismiss', event: true })
        );

        unmount();
        render(<DonateCard line="Green" />);
        expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    });

    test('donating keeps the card for now, thanks the user, and stops future asks', async () => {
        const { unmount } = render(<DonateCard line="Green" />);

        await userEvent.click(screen.getByRole('link', { name: /donate/i }));
        expect(screen.getByRole('heading')).toHaveTextContent('Thank you!');

        unmount();
        render(<DonateCard line="Green" />);
        expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    });
});
