import { isCategoryInSeason, isHolidaySeason, isPrideSeason } from '../seasons';

// Month is 0-indexed, as with the Date constructor.
const inMonth = (month: number) => new Date(2026, month, 15);

describe('isHolidaySeason', () => {
    it.each([10, 11, 0])('is in season for month %i', (month) => {
        expect(isHolidaySeason(inMonth(month))).toBe(true);
    });

    it.each([1, 4, 9])('is out of season for month %i', (month) => {
        expect(isHolidaySeason(inMonth(month))).toBe(false);
    });

    it('starts on November 1 and ends after January 31', () => {
        expect(isHolidaySeason(new Date(2026, 9, 31, 23, 59))).toBe(false);
        expect(isHolidaySeason(new Date(2026, 10, 1, 0, 0))).toBe(true);
        expect(isHolidaySeason(new Date(2027, 0, 31, 23, 59))).toBe(true);
        expect(isHolidaySeason(new Date(2027, 1, 1, 0, 0))).toBe(false);
    });
});

describe('isPrideSeason', () => {
    it.each([4, 5, 6])('is in season for month %i', (month) => {
        expect(isPrideSeason(inMonth(month))).toBe(true);
    });

    it.each([3, 7, 11])('is out of season for month %i', (month) => {
        expect(isPrideSeason(inMonth(month))).toBe(false);
    });
});

describe('isCategoryInSeason', () => {
    it('always allows the non-seasonal categories', () => {
        for (const month of [0, 3, 6, 9]) {
            expect(isCategoryInSeason('new_vehicles', inMonth(month))).toBe(true);
            expect(isCategoryInSeason('old_vehicles', inMonth(month))).toBe(true);
            expect(isCategoryInSeason('vehicles', inMonth(month))).toBe(true);
        }
    });

    it('gates the seasonal categories by month', () => {
        expect(isCategoryInSeason('holiday', inMonth(11))).toBe(true);
        expect(isCategoryInSeason('holiday', inMonth(5))).toBe(false);
        expect(isCategoryInSeason('pride', inMonth(5))).toBe(true);
        expect(isCategoryInSeason('pride', inMonth(11))).toBe(false);
    });
});
