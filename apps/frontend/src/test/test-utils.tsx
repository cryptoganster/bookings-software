import type { ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import {
  createTheme,
  MantineProvider,
  Modal,
  Drawer,
  Popover,
  Menu,
} from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create test theme with disabled transitions
// This prevents setTimeout issues in tests
const testTheme = createTheme({
  components: {
    Modal: Modal.extend({
      defaultProps: {
        transitionProps: { duration: 0 },
      },
    }),
    Drawer: Drawer.extend({
      defaultProps: {
        transitionProps: { duration: 0 },
      },
    }),
    Popover: Popover.extend({
      defaultProps: {
        transitionProps: { duration: 0 },
      },
    }),
    Menu: Menu.extend({
      defaultProps: {
        transitionProps: { duration: 0 },
      },
    }),
  },
});

/**
 * Custom render function that wraps components with necessary providers
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  function AllTheProviders({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MantineProvider theme={testTheme}>{children}</MantineProvider>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: AllTheProviders, ...options });
}

// Export custom render as named export
export { customRender as render };

// Re-export specific testing utilities (not using export *)
export {
  screen,
  waitFor,
  within,
  fireEvent,
  cleanup,
  renderHook,
  act,
} from "@testing-library/react";
