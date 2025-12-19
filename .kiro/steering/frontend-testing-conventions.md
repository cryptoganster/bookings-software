---
inclusion: always
---

# Frontend Testing Conventions

Este documento define las convenciones de testing para el frontend React + Vite + TypeScript.

## Estructura de Carpetas

### Convención: `__tests__` folders

Seguimos la misma convención que el backend: los tests se colocan en carpetas `__tests__` dentro del módulo que están probando.

```
src/
├── shared/
│   ├── api/
│   │   ├── __tests__/
│   │   │   └── client.test.ts
│   │   └── client.ts
│   ├── hooks/
│   │   ├── __tests__/
│   │   │   └── useDebounce.test.ts
│   │   └── useDebounce.ts
│   └── lib/
│       ├── date/
│       │   ├── __tests__/
│       │   │   └── formatters.test.ts
│       │   └── formatters.ts
├── features/
│   └── auth/
│       └── login/
│           ├── __tests__/
│           │   ├── LoginForm.test.tsx
│           │   └── useLogin.test.ts
│           ├── ui/
│           │   └── LoginForm.tsx
│           └── model/
│               └── useLogin.ts
```

### Beneficios

✅ **Consistencia:** Misma convención que el backend  
✅ **Colocation:** Tests cerca del código que prueban  
✅ **Organización:** Fácil encontrar tests relacionados  
✅ **Imports:** Imports relativos simples (`../component`)

## Naming Conventions

### Archivos de Test

- **Componentes React:** `ComponentName.test.tsx`
- **Hooks:** `useHookName.test.ts`
- **Utilities:** `utilityName.test.ts`
- **Property-Based Tests:** `component.pbt.test.ts` o `utility.pbt.test.ts`

### Ejemplos

```
LoginForm.test.tsx          # Test de componente
useLogin.test.ts            # Test de hook
formatters.test.ts          # Test de utilidades
useCancelAppointment.pbt.test.ts  # Property-based test
```

## Testing Stack

### Core

- **Test Runner:** Vitest
- **Testing Library:** React Testing Library
- **Mocking:** MSW (Mock Service Worker) para APIs
- **Environment:** jsdom (para DOM APIs como localStorage)

### Configuración en vite.config.ts

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
  },
});
```

## Tipos de Tests

### 1. Unit Tests

**Qué testear:**

- Componentes individuales
- Hooks personalizados
- Funciones de utilidad
- Lógica de negocio

**Ejemplo:**

```typescript
// shared/api/__tests__/client.test.ts
import { describe, it, expect } from "vitest";
import { apiClient } from "../client";

describe("API Client", () => {
  it("should be configured with correct baseURL", () => {
    expect(apiClient.defaults.baseURL).toBe("http://localhost:3000/api");
  });
});
```

### 2. Component Tests

**Qué testear:**

- Renderizado correcto
- Interacciones de usuario
- Estados del componente
- Props y callbacks

**Ejemplo:**

```typescript
// features/auth/login/__tests__/LoginForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginForm } from '../ui/LoginForm';

describe('LoginForm', () => {
  it('should render email and password fields', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
});
```

### 3. Hook Tests

**Qué testear:**

- Estado inicial
- Actualizaciones de estado
- Side effects
- Valores de retorno

**Ejemplo:**

```typescript
// features/auth/login/__tests__/useLogin.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { useLogin } from "../model/useLogin";

describe("useLogin", () => {
  it("should update auth store on successful login", async () => {
    const { result } = renderHook(() => useLogin());

    result.current.mutate({ email: "test@test.com", password: "pass" });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
```

### 4. Integration Tests

**Qué testear:**

- Flujos completos de usuario
- Integración entre componentes
- Llamadas a API (mockeadas con MSW)

**Ejemplo:**

```typescript
// features/appointment/cancel/__tests__/CancelAppointment.integration.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { server } from '@/mocks/server';
import { rest } from 'msw';

describe('Cancel Appointment Flow', () => {
  it('should cancel appointment and show success message', async () => {
    server.use(
      rest.put('/api/appointments/:id/cancel', (req, res, ctx) => {
        return res(ctx.status(200));
      })
    );

    render(<AppointmentCard appointmentId="123" />);

    fireEvent.click(screen.getByText(/cancel/i));
    fireEvent.click(screen.getByText(/confirm/i));

    await waitFor(() => {
      expect(screen.getByText(/cancelled successfully/i)).toBeInTheDocument();
    });
  });
});
```

### 5. Property-Based Tests (PBT)

**Cuándo usar:**

- Propiedades universales que deben cumplirse
- Validación con múltiples inputs aleatorios
- Casos edge que son difíciles de pensar manualmente

**Ejemplo:**

```typescript
// shared/lib/date/__tests__/formatters.pbt.test.ts
import { fc, test } from "@fast-check/vitest";
import { formatDate } from "../formatters";

describe("formatDate PBT", () => {
  test.prop([fc.date()])("should always return a string", (date) => {
    const result = formatDate(date);
    expect(typeof result).toBe("string");
  });

  test.prop([fc.date()])("should be idempotent", (date) => {
    const result1 = formatDate(date);
    const result2 = formatDate(date);
    expect(result1).toBe(result2);
  });
});
```

## Best Practices

### ✅ Hacer

1. **Colocar tests en `__tests__` folders**
2. **Usar imports relativos:** `import { Component } from '../Component'`
3. **Testear comportamiento, no implementación**
4. **Usar React Testing Library queries semánticas:** `getByRole`, `getByLabelText`
5. **Mockear APIs con MSW, no axios directamente**
6. **Limpiar después de cada test:** `beforeEach(() => localStorage.clear())`
7. **Usar `waitFor` para operaciones asíncronas**
8. **Nombres descriptivos:** `it('should show error when email is invalid')`

### ❌ Evitar

1. ~~Colocar tests al lado del archivo~~ → Usar `__tests__/`
2. ~~Testear detalles de implementación~~ → Testear comportamiento
3. ~~Usar `getByTestId` por defecto~~ → Usar queries semánticas
4. ~~Mockear todo~~ → Solo mockear dependencias externas
5. ~~Tests que dependen de otros~~ → Tests independientes
6. ~~Snapshots para todo~~ → Solo cuando tiene sentido

## Scripts de Testing

```json
{
  "scripts": {
    "test": "vitest --run",
    "test:watch": "vitest",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui"
  }
}
```

## Cobertura de Tests

### Objetivos

- **Mínimo:** 70% de cobertura general
- **Crítico:** 90%+ en lógica de negocio (hooks, utilities)
- **UI:** 60%+ en componentes (enfocarse en interacciones)

### Generar Reporte

```bash
pnpm test:coverage
```

## MSW Setup

### Estructura de Mocks

```
src/
└── mocks/
    ├── handlers.ts      # Handlers de API
    ├── server.ts        # Setup de MSW
    └── data/
        ├── appointments.ts
        └── users.ts
```

### Ejemplo de Handler

```typescript
// mocks/handlers.ts
import { rest } from "msw";

export const handlers = [
  rest.post("/api/auth/login", (req, res, ctx) => {
    return res(
      ctx.json({
        user: { id: "1", email: "test@test.com" },
        token: "mock-token",
      }),
    );
  }),

  rest.get("/api/appointments", (req, res, ctx) => {
    return res(ctx.json(mockAppointments));
  }),
];
```

## Debugging Tests

### Vitest UI

```bash
pnpm test:ui
```

Abre interfaz web para debugging interactivo.

### Debug en VSCode

Agregar a `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest Tests",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["test:watch"],
  "console": "integratedTerminal"
}
```

## Ejemplos Completos

Ver los siguientes archivos como referencia:

- `apps/frontend/src/shared/api/__tests__/client.test.ts` - Test de configuración
- (Próximamente) `apps/frontend/src/features/auth/login/__tests__/LoginForm.test.tsx` - Test de componente
- (Próximamente) `apps/frontend/src/features/auth/login/__tests__/useLogin.test.ts` - Test de hook

## Recursos

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [MSW Documentation](https://mswjs.io/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
