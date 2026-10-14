import { act, renderHook } from '@testing-library/react';
import { useDismissal } from '../useDismissal';

const KEY = 'test:dismissedAt';
const TTL = 1000 * 60 * 60;

describe('useDismissal', () => {
    beforeEach(() => {
        window.localStorage.clear();
        jest.restoreAllMocks();
    });

    test('is not dismissed by default', () => {
        const { result } = renderHook(() => useDismissal(KEY, TTL));
        expect(result.current[0]).toBe(false);
    });

    test('dismiss() hides and persists across remounts', () => {
        const { result, unmount } = renderHook(() => useDismissal(KEY, TTL));
        act(() => result.current[1]());
        expect(result.current[0]).toBe(true);
        unmount();

        const { result: remounted } = renderHook(() => useDismissal(KEY, TTL));
        expect(remounted.current[0]).toBe(true);
    });

    test('dismiss({ hide: false }) persists without hiding', () => {
        const { result, unmount } = renderHook(() => useDismissal(KEY, TTL));
        act(() => result.current[1]({ hide: false }));
        expect(result.current[0]).toBe(false);
        unmount();

        const { result: remounted } = renderHook(() => useDismissal(KEY, TTL));
        expect(remounted.current[0]).toBe(true);
    });

    test('shows again once the dismissal expires', () => {
        const now = Date.now();
        window.localStorage.setItem(KEY, String(now - TTL - 1));
        const { result } = renderHook(() => useDismissal(KEY, TTL));
        expect(result.current[0]).toBe(false);

        window.localStorage.setItem(KEY, String(now - TTL + 60_000));
        const { result: recent } = renderHook(() => useDismissal(KEY, TTL));
        expect(recent.current[0]).toBe(true);
    });

    test('ignores garbage stored values', () => {
        window.localStorage.setItem(KEY, 'not-a-number');
        const { result } = renderHook(() => useDismissal(KEY, TTL));
        expect(result.current[0]).toBe(false);
    });

    test('survives unavailable storage', () => {
        jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('blocked');
        });
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('blocked');
        });

        const { result } = renderHook(() => useDismissal(KEY, TTL));
        expect(result.current[0]).toBe(false);
        act(() => result.current[1]());
        expect(result.current[0]).toBe(true);
    });
});
