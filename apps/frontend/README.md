# Frontend - Sistema de Reservas Multi-Tenant

**Stack:** React 18 + Vite 5 + TypeScript 5 + Mantine 7 + TanStack Query 5  
**Architecture:** Feature-Sliced Design (FSD)  
**Status:** Production Ready

---

## Overview

Panel de administración web para dueños de negocios que gestionan reservaciones vía WhatsApp. Permite administrar servicios, horarios, citas y consultas de clientes en tiempo real.

---

## Features

### ✅ Implemented

- **Dashboard:** Métricas en tiempo real (citas hoy, esta semana, consultas pendientes)
- **Appointments:** Lista, filtros, detalles, cancelación
- **Customers:** Lista, búsqueda, detalles, análisis
- **Offerings:** CRUD completo de servicios
- **Schedules:** Gestión de horarios por día de semana
- **Blockouts:** Bloqueos de fechas (vacaciones, festivos)
- **Conversations:** Responder consultas de clientes
- **Authentication:** Login/logout con JWT
- **Real-time Updates:** TanStack Query con auto-refetch

### 🚧 Planned

- **Analytics:** Reportes avanzados
- **Settings:** Configuración de negocio
- **Notifications:** Sistema de notificaciones
- **Multi-language:** Soporte i18n

---

## Tech Stack

### Core

- **React 18** - UI library
- **Vite 5** - Build tool & dev server
- **TypeScript 5** - Type safety
- **TanStack Query 5** - Server state management
- **Zustand 4** - Client state management
- **React Router 6** - Routing

### UI & Forms

- **Mantine 7** - Component library (120+ components)
- **React Hook Form 7** - Form management
- **Zod 3** - Schema validation
- **Tabler Icons** - Icon library
- **date-fns** - Date manipulation

### Testing

- **Vitest** - Test runner
- **Testing Library** - Component testing
- **MSW** - API mocking

---

## Project Structure

```
src/
├── app/                    # Application initialization
│   ├── layouts/           # Layout components
│   ├── providers/         # Context providers
│   ├── router/            # Route configuration
│   └── store/             # Global state (Zustand)
├── pages/                 # Page components
│   ├── DashboardPage/
│   ├── AppointmentsPage/
│   ├── CustomersPage/
│   ├── OfferingsPage/
│   ├── SchedulesPage/
│   ├── BlockoutsPage/
│   └── ConversationsPage/
├── widgets/               # Complex UI compositions
│   ├── StatsCards/
│   └── UpcomingAppointments/
├── features/              # Interactive use cases
│   ├── auth/
│   ├── appointment/
│   └── customer/
├── entities/              # Domain models
│   ├── appointment/
│   ├── customer/
│   ├── offering/
│   ├── schedule/
│   ├── blockout/
│   ├── conversation/
│   └── account/
└── shared/                # Reusable code
    ├── api/               # API client & services
    ├── config/            # Configuration
    ├── hooks/             # Custom hooks
    ├── lib/               # Utilities
    └── ui/                # UI components
```

**Architecture:** Feature-Sliced Design (FSD) - Layers from bottom to top: shared → entities → features → widgets → pages → app

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Backend running on http://localhost:3000

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open browser
http://localhost:5173
```

### Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:3000/api
```

---

## Available Scripts

```bash
# Development
pnpm dev              # Start dev server with HMR
pnpm build            # Build for production
pnpm preview          # Preview production build

# Testing
pnpm test             # Run tests once
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with coverage
pnpm test:ui          # Open Vitest UI

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint errors
pnpm format           # Format with Prettier
pnpm typecheck        # Check TypeScript types
```

---

## API Integration

### Services

All API calls are centralized in services:

```typescript
// src/shared/api/services/offerings.service.ts
export const offeringsApi = {
  getAll: () => apiClient.get<OfferingDto[]>(ENDPOINTS.OFFERINGS.LIST),
  create: (data: CreateOfferingRequestDto) =>
    apiClient.post<CreateOfferingResponseDto>(ENDPOINTS.OFFERINGS.CREATE, data),
  // ...
};
```

### TanStack Query Hooks

Each entity has dedicated hooks:

```typescript
// src/entities/offering/model/useOfferings.ts
export function useOfferings() {
  return useQuery({
    queryKey: offeringKeys.all,
    queryFn: () => offeringsApi.getAll(),
  });
}

export function useCreateOffering() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOfferingRequestDto) => offeringsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offeringKeys.all });
    },
  });
}
```

### Usage in Components

```typescript
import { useOfferings, useCreateOffering } from '@entities/offering';

function OfferingsPage() {
  const { data: offerings, isLoading, error } = useOfferings();
  const createMutation = useCreateOffering();

  const handleCreate = (data: CreateOfferingRequestDto) => {
    createMutation.mutate(data);
  };

  if (isLoading) return <Loader />;
  if (error) return <Alert color="red">{error.message}</Alert>;

  return <OfferingsList offerings={offerings} onCreate={handleCreate} />;
}
```

---

## State Management

### Server State (TanStack Query)

Used for all API data:

- Automatic caching
- Automatic refetching
- Optimistic updates
- Loading & error states

```typescript
const { data, isLoading, error } = useAppointments();
```

### Client State (Zustand)

Used for UI state:

- Authentication
- Filters
- Modals
- Sidebar state

```typescript
const { user, login, logout } = useAuthStore();
```

---

## Testing

### Unit Tests

```typescript
// src/entities/appointment/lib/__tests__/formatAppointment.test.ts
describe("formatAppointment", () => {
  it("should format date correctly", () => {
    const result = formatAppointmentDate(new Date("2024-12-24"));
    expect(result).toContain("24");
  });
});
```

### Component Tests

```typescript
// src/features/auth/login/__tests__/LoginForm.test.tsx
describe('LoginForm', () => {
  it('should submit form with valid credentials', async () => {
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(loginApi.login).toHaveBeenCalled();
  });
});
```

### Run Tests

```bash
pnpm test              # Run all tests
pnpm test:coverage     # With coverage report
pnpm test:ui           # Interactive UI
```

---

## Code Quality

### ESLint

```bash
pnpm lint              # Check for errors
pnpm lint:fix          # Auto-fix errors
```

### Prettier

```bash
pnpm format            # Format all files
```

### TypeScript

```bash
pnpm typecheck         # Check types
```

---

## Deployment

### Build

```bash
pnpm build
```

Output: `dist/` directory

### Preview

```bash
pnpm preview
```

### Environment Variables

Production `.env`:

```env
VITE_API_URL=https://api.yourdomain.com/api
```

---

## Documentation

- [API Documentation](../../.kiro/specs/frontend-enhancements/API_DOCUMENTATION.md)
- [Migration Guide](../../.kiro/specs/frontend-enhancements/MIGRATION_GUIDE.md)
- [Task Completion](../../.kiro/specs/frontend-enhancements/tasks.md)

---

## Contributing

1. Create feature branch: `git checkout -b feat/my-feature`
2. Make changes
3. Run tests: `pnpm test`
4. Run linter: `pnpm lint`
5. Commit: `git commit -m "feat: add my feature"`
6. Push: `git push origin feat/my-feature`
7. Create Pull Request

---

## License

MIT

---

## Support

For questions or issues, contact the development team.

---

**Last Updated:** December 24, 2024  
**Version:** 1.0.0  
**Status:** Production Ready
