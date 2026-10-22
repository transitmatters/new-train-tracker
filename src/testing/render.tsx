/*
Render helpers for components and hooks that need react-router and react-query.
*/
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RenderHookOptions, render, renderHook } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

/*
A fresh client per test, with retries off.

retry:false matters: useMbtaApi sets retry:3 with exponential backoff, so a
single error-path test would otherwise sit for ~7 seconds.
*/
export const makeTestQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                gcTime: 0,
                staleTime: 0,
                refetchInterval: false,
                refetchOnWindowFocus: false,
            },
        },
    });

interface WrapperOptions {
    route?: string;
    queryClient?: QueryClient;
}

const makeWrapper = ({ route = '/', queryClient }: WrapperOptions = {}) => {
    const client = queryClient ?? makeTestQueryClient();
    const Wrapper = ({ children }: { children: ReactNode }) => (
        <MemoryRouter initialEntries={[route]}>
            <QueryClientProvider client={client}>{children}</QueryClientProvider>
        </MemoryRouter>
    );
    Wrapper.displayName = 'TestProviders';
    return Wrapper;
};

export const renderWithProviders = (ui: ReactElement, options: WrapperOptions = {}) =>
    render(ui, { wrapper: makeWrapper(options) });

export const renderHookWithProviders = <TProps, TResult>(
    hook: (props: TProps) => TResult,
    options: WrapperOptions & Omit<RenderHookOptions<TProps>, 'wrapper'> = {}
) => {
    const { route, queryClient, ...rest } = options;
    return renderHook(hook, { wrapper: makeWrapper({ route, queryClient }), ...rest });
};

export * from '@testing-library/react';
