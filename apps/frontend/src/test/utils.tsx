/**
 * Test Utilities
 *
 * Common utilities and wrappers for testing
 */

import { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";
import { BrowserRouter } from "react-router-dom";

/**
 * Create a new QueryClient for each test
 * This ensures tests are isolated
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries in tests
        gcTime: Infinity, // Keep data in cache
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * All the providers wrapper
 */
interface AllProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

export function AllProviders({
  children,
  queryClient = createTestQueryClient(),
}: AllProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <Notifications />
        <ModalsProvider>
          <BrowserRouter>{children}</BrowserRouter>
        </ModalsProvider>
      </MantineProvider>
    </QueryClientProvider>
  );
}

/**
 * Custom render function that includes all providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { queryClient, ...renderOptions } = options || {};

  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders queryClient={queryClient}>{children}</AllProviders>
    ),
    ...renderOptions,
  });
}

// Re-export everything from React Testing Library
export * from "@testing-library/react";
export { renderWithProviders as render };
