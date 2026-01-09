---
inclusion: fileMatch
fileMatchPattern: "apps/frontend/**/*.{spec,test}.{ts,tsx}"
---

# Frontend Testing Conventions

**Testing strategies and conventions for frontend (React + Vite) code**

> **Cross-References:**
>
> - [40-backend-testing.md](./40-backend-testing.md) - Backend testing patterns
> - [21-clean-code-principles.md](./21-clean-code-principles.md) - Testing best practices
> - [51-frontend-architecture.md](./51-frontend-architecture.md) - Frontend architecture

---

# Frontend Testing Conventions

Este documento define las convenciones y estrategias de testing para el frontend (React + Vite).

## Testing Stack

- **Test Runner:** Vitest
- **Testing Library:** @testing-library/react
- **User Interactions:** @testing-library/user-event
- **Mocking:** vi (Vitest mocks)
- **Coverage:** Vitest coverage (c8)

## Testing Strategy

### Pirámide de Testing

```
        E2E Tests (10%)
       ↗            ↖
  Integration Tests (30%)
 ↗                      ↖
Unit Tests (60%)
```

### Tipos de Tests

1. **Unit Tests** - Components, hooks, utilities (aislados, rápidos)
2. **Integration Tests** - Feature slices completos con API mocks
3. **E2E Tests** - Flujos completos con Playwright (opcional)

## Unit Tests

### Components

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AppointmentCard } from './AppointmentCard';

describe('AppointmentCard', () => {
  it('should render appointment details', () => {
    // Arrange
    const appointment = {
      id: '123',
      offeringName: 'Corte de Pelo',
      dateTime: new Date('2024-12-20T10:00:00Z'),
      status: 'CONFIRMED',
    };

    // Act
    render(<AppointmentCard appointment={appointment} />);

    // Assert
    expect(screen.getByText('Corte de Pelo')).toBeInTheDocument();
    expect(screen.getByText(/20 de Diciembre/i)).toBeInTheDocument();
    expect(screen.getByText(/10:00/i)).toBeInTheDocument();
  });

  it('should show cancel button for confirmed appointments', () => {
    const appointment = {
      id: '123',
      offeringName: 'Corte de Pelo',
      dateTime: new Date('2024-12-20T10:00:00Z'),
      status: 'CONFIRMED',
    };

    render(<AppointmentCard appointment={appointment} />);

    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

  it('should not show cancel button for cancelled appointments', () => {
    const appointment = {
      id: '123',
      offeringName: 'Corte de Pelo',
      dateTime: new Date('2024-12-20T10:00:00Z'),
      status: 'CANCELLED',
    };

    render(<AppointmentCard appointment={appointment} />);

    expect(screen.queryByRole('button', { name: /cancelar/i })).not.toBeInTheDocument();
  });
});
```

### User Interactions

```typescript
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { AppointmentForm } from './AppointmentForm';

describe('AppointmentForm', () => {
  it('should call onSubmit with form data', async () => {
    // Arrange
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<AppointmentForm onSubmit={onSubmit} />);

    // Act
    await user.selectOptions(
      screen.getByLabelText(/servicio/i),
      'offering-1'
    );
    await user.click(screen.getByLabelText(/20 de Diciembre/i));
    await user.click(screen.getByLabelText(/10:00/i));
    await user.click(screen.getByRole('button', { name: /confirmar/i }));

    // Assert
    expect(onSubmit).toHaveBeenCalledWith({
      offeringId: 'offering-1',
      date: '2024-12-20',
      time: '10:00',
    });
  });

  it('should show validation error for empty form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<AppointmentForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /confirmar/i }));

    expect(screen.getByText(/selecciona un servicio/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
```

### Custom Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useAppointments } from './useAppointments';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('useAppointments', () => {
  it('should fetch appointments', async () => {
    // Arrange
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    // Act
    const { result } = renderHook(() => useAppointments(), { wrapper });

    // Assert
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(2);
  });

  it('should handle error state', async () => {
    // Arrange
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    // Mock API error
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('API Error'));

    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    // Act
    const { result } = renderHook(() => useAppointments(), { wrapper });

    // Assert
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});
```

### Utilities

```typescript
import { describe, it, expect } from "vitest";
import { formatDate, formatTime } from "./date-utils";

describe("date-utils", () => {
  describe("formatDate", () => {
    it("should format date in Spanish", () => {
      const date = new Date("2024-12-20T10:00:00Z");
      expect(formatDate(date)).toBe("20 de Diciembre de 2024");
    });

    it("should handle invalid date", () => {
      expect(formatDate(null)).toBe("Fecha inválida");
    });
  });

  describe("formatTime", () => {
    it("should format time in 12-hour format", () => {
      const date = new Date("2024-12-20T10:00:00Z");
      expect(formatTime(date)).toBe("10:00 AM");
    });

    it("should format PM time correctly", () => {
      const date = new Date("2024-12-20T14:30:00Z");
      expect(formatTime(date)).toBe("2:30 PM");
    });
  });
});
```

## Integration Tests

### Feature Slices

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppointmentListPage } from './AppointmentListPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

// Setup MSW server
const server = setupServer(
  rest.get('/api/appointments', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          id: '1',
          offeringName: 'Corte de Pelo',
          dateTime: '2024-12-20T10:00:00Z',
          status: 'CONFIRMED',
        },
        {
          id: '2',
          offeringName: 'Lavado',
          dateTime: '2024-12-21T14:00:00Z',
          status: 'CONFIRMED',
        },
      ])
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('AppointmentListPage (Integration)', () => {
  it('should display list of appointments', async () => {
    // Arrange
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    // Act
    render(
      <QueryClientProvider client={queryClient}>
        <AppointmentListPage />
      </QueryClientProvider>
    );

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Corte de Pelo')).toBeInTheDocument();
      expect(screen.getByText('Lavado')).toBeInTheDocument();
    });
  });

  it('should cancel appointment when button clicked', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    // Mock cancel endpoint
    server.use(
      rest.delete('/api/appointments/:id', (req, res, ctx) => {
        return res(ctx.status(204));
      })
    );

    render(
      <QueryClientProvider client={queryClient}>
        <AppointmentListPage />
      </QueryClientProvider>
    );

    // Wait for appointments to load
    await waitFor(() => {
      expect(screen.getByText('Corte de Pelo')).toBeInTheDocument();
    });

    // Click cancel button
    const cancelButtons = screen.getAllByRole('button', { name: /cancelar/i });
    await user.click(cancelButtons[0]);

    // Confirm cancellation
    await user.click(screen.getByRole('button', { name: /confirmar/i }));

    // Verify appointment is removed
    await waitFor(() => {
      expect(screen.queryByText('Corte de Pelo')).not.toBeInTheDocument();
    });
  });

  it('should show error message when API fails', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    // Mock API error
    server.use(
      rest.get('/api/appointments', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }));
      })
    );

    render(
      <QueryClientProvider client={queryClient}>
        <AppointmentListPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/error al cargar citas/i)).toBeInTheDocument();
    });
  });
});
```

### API Client

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "./api-client";

describe("apiClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAppointments", () => {
    it("should fetch appointments", async () => {
      const mockFetch = vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: "1", offeringName: "Corte de Pelo" }],
      } as Response);

      const appointments = await apiClient.getAppointments();

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/appointments",
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      );
      expect(appointments).toHaveLength(1);
    });

    it("should include auth token in request", async () => {
      const mockFetch = vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      localStorage.setItem("token", "test-token");

      await apiClient.getAppointments();

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/appointments",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        }),
      );
    });

    it("should throw error on API failure", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Server error" }),
      } as Response);

      await expect(apiClient.getAppointments()).rejects.toThrow("Server error");
    });
  });
});
```

## Testing Best Practices

### Arrange-Act-Assert Pattern

```typescript
it('should render appointment', () => {
  // Arrange - Setup test data
  const appointment = { id: '1', offeringName: 'Corte de Pelo' };

  // Act - Render component
  render(<AppointmentCard appointment={appointment} />);

  // Assert - Verify output
  expect(screen.getByText('Corte de Pelo')).toBeInTheDocument();
});
```

### Query Priority

```typescript
// ✅ Good - Use accessible queries
screen.getByRole("button", { name: /cancelar/i });
screen.getByLabelText(/servicio/i);
screen.getByText(/corte de pelo/i);

// ❌ Bad - Avoid implementation details
screen.getByTestId("cancel-button");
screen.getByClassName("appointment-card");
```

### User-Centric Tests

```typescript
// ✅ Good - Test user behavior
it('should allow user to cancel appointment', async () => {
  const user = userEvent.setup();
  render(<AppointmentCard appointment={appointment} />);

  await user.click(screen.getByRole('button', { name: /cancelar/i }));
  await user.click(screen.getByRole('button', { name: /confirmar/i }));

  expect(screen.getByText(/cita cancelada/i)).toBeInTheDocument();
});

// ❌ Bad - Test implementation
it('should call handleCancel', () => {
  const handleCancel = vi.fn();
  render(<AppointmentCard onCancel={handleCancel} />);

  fireEvent.click(screen.getByTestId('cancel-button'));

  expect(handleCancel).toHaveBeenCalled();
});
```

### Async Testing

```typescript
// ✅ Good - Use waitFor for async operations
it('should load appointments', async () => {
  render(<AppointmentList />);

  await waitFor(() => {
    expect(screen.getByText('Corte de Pelo')).toBeInTheDocument();
  });
});

// ❌ Bad - Don't use arbitrary timeouts
it('should load appointments', async () => {
  render(<AppointmentList />);

  await new Promise(resolve => setTimeout(resolve, 1000));

  expect(screen.getByText('Corte de Pelo')).toBeInTheDocument();
});
```

### Mocking

```typescript
// ✅ Good - Mock external dependencies
vi.mock("./api-client", () => ({
  apiClient: {
    getAppointments: vi.fn().mockResolvedValue([]),
  },
}));

// ✅ Good - Use MSW for API mocking
const server = setupServer(
  rest.get("/api/appointments", (req, res, ctx) => {
    return res(ctx.json([]));
  }),
);

// ❌ Bad - Don't mock React hooks
vi.mock("react", () => ({
  useState: vi.fn(),
}));
```

## Test Coverage

### Coverage Goals

- **Unit Tests:** 80%+ coverage
- **Integration Tests:** Critical user flows covered
- **E2E Tests:** Main user journeys covered

### Running Coverage

```bash
# Frontend tests with coverage
pnpm --filter frontend test:coverage

# View coverage report
open apps/frontend/coverage/index.html
```

### Coverage Reports

```bash
# Generate coverage report
pnpm --filter frontend test:coverage

# Expected output:
# Statements   : 82% ( 456/556 )
# Branches     : 78% ( 123/158 )
# Functions    : 85% ( 89/105 )
# Lines        : 82% ( 445/543 )
```

## Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test-utils/setup.ts"],
    coverage: {
      provider: "c8",
      reporter: ["text", "html", "lcov"],
      exclude: [
        "node_modules/",
        "src/test-utils/",
        "**/*.spec.ts",
        "**/*.spec.tsx",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

## Test Setup

```typescript
// src/test-utils/setup.ts
import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;
```

## Test Utilities

```typescript
// src/test-utils/test-utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

## Troubleshooting

### Tests Failing in CI but Passing Locally

**Causa:** Timing issues, environment differences

**Solución:**

- Use `waitFor` for async operations
- Increase timeout for slow operations
- Check environment variables

### Cannot Find Module Errors

**Causa:** Path aliases not configured in Vitest

**Solución:**

```typescript
// vitest.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

### Tests Running Slowly

**Causa:** Too many integration tests, real API calls

**Solución:**

- Increase unit test ratio
- Use MSW for API mocking
- Run tests in parallel

---

**Last Updated:** January 9, 2026  
**Status:** Active
