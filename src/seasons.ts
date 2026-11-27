import { VehicleCategory } from './types';

// Months are 0-indexed, matching Date#getMonth.
// Holiday wraps run November through January.
const HOLIDAY_MONTHS = [10, 11, 0];
// Pride wraps run May through July, around Pride month.
const PRIDE_MONTHS = [4, 5, 6];

export const isHolidaySeason = (date: Date = new Date()) =>
    HOLIDAY_MONTHS.includes(date.getMonth());

export const isPrideSeason = (date: Date = new Date()) => PRIDE_MONTHS.includes(date.getMonth());

// Seasonal categories are hidden out of season; every other category is always available.
export const isCategoryInSeason = (category: VehicleCategory, date: Date = new Date()) => {
    if (category === 'holiday') {
        return isHolidaySeason(date);
    }
    if (category === 'pride') {
        return isPrideSeason(date);
    }
    return true;
};
