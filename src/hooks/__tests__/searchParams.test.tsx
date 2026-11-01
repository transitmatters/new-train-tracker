import { act } from '@testing-library/react';
import { greenLine, redLine } from '../../lines';
import { renderHookWithProviders } from '../../testing/render';
import { useCategorySearchParam, useLineSearchParam } from '../searchParams';

describe('useLineSearchParam', () => {
    it('defaults to the Green line', () => {
        const { result } = renderHookWithProviders(() => useLineSearchParam());

        expect(result.current[0]).toBe('Green');
    });

    it('reads the line out of the query string', () => {
        const { result } = renderHookWithProviders(() => useLineSearchParam(), {
            route: '/?line=Red',
        });

        expect(result.current[0]).toBe('Red');
    });

    it('writes the selected line back to the query string', () => {
        const { result } = renderHookWithProviders(() => useLineSearchParam());

        act(() => result.current[1](redLine));

        expect(result.current[0]).toBe('Red');
    });

    it('preserves the category when changing line', () => {
        // setSearchParams is handed the same mutated object, so it is easy to
        // regress this into clobbering every other param.
        const { result } = renderHookWithProviders(
            () => ({ line: useLineSearchParam(), category: useCategorySearchParam() }),
            { route: '/?line=Green&category=old_vehicles' }
        );

        act(() => result.current.line[1](redLine));

        expect(result.current.line[0]).toBe('Red');
        expect(result.current.category[0]).toBe('old_vehicles');
    });
});

describe('useCategorySearchParam', () => {
    it('defaults to new vehicles', () => {
        const { result } = renderHookWithProviders(() => useCategorySearchParam());

        expect(result.current[0]).toBe('new_vehicles');
    });

    it('reads the category out of the query string', () => {
        const { result } = renderHookWithProviders(() => useCategorySearchParam(), {
            route: '/?category=pride',
        });

        expect(result.current[0]).toBe('pride');
    });

    it('writes the selected category back to the query string', () => {
        const { result } = renderHookWithProviders(() => useCategorySearchParam());

        act(() => result.current[1]('holiday'));

        expect(result.current[0]).toBe('holiday');
    });

    it('preserves the line when changing category', () => {
        const { result } = renderHookWithProviders(
            () => ({ line: useLineSearchParam(), category: useCategorySearchParam() }),
            { route: '/?line=Blue&category=new_vehicles' }
        );

        act(() => result.current.category[1]('vehicles'));

        expect(result.current.category[0]).toBe('vehicles');
        expect(result.current.line[0]).toBe('Blue');
    });

    it('round-trips a line object through the setter', () => {
        const { result } = renderHookWithProviders(() => useLineSearchParam(), {
            route: '/?line=Red',
        });

        act(() => result.current[1](greenLine));

        expect(result.current[0]).toBe('Green');
    });
});
