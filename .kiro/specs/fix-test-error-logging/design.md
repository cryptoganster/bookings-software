# Design Document - Fix Test Error Logging

## Overview

Silenciar los logs del Logger de NestJS durante los tests de event handlers para evitar ruido en la salida de tests, mientras se mantiene la capacidad de verificar que el logging funciona correctamente.

## Problem Statement

Los tests de event handlers están generando logs de ERROR en la consola:

```
[Nest] 2658  - 12/21/2025, 9:21:43 PM   ERROR [OnCustomerLinkedToUserHandler] Error adding CUSTOMER role to user user-id: Database connection failed
```

Estos logs son **esperados** porque los tests están verificando el manejo de errores, pero aparecen en la salida de tests y pueden confundir.

## Solution

Usar **spies de Jest** para interceptar las llamadas al logger sin que produzcan output.

### Approach 1: Mock del Logger (❌ No Recomendado)

```typescript
beforeEach(() => {
  jest.spyOn(Logger.prototype, "log").mockImplementation();
  jest.spyOn(Logger.prototype, "error").mockImplementation();
});
```

**Problema:** Afecta todos los loggers globalmente, puede ocultar errores reales.

### Approach 2: Spy en la Instancia del Handler (✅ Recomendado)

```typescript
beforeEach(() => {
  // Spy on the handler's logger instance
  jest.spyOn(handler["logger"], "log").mockImplementation();
  jest.spyOn(handler["logger"], "error").mockImplementation();
});
```

**Ventajas:**

- Solo afecta el logger del handler bajo test
- Permite verificar llamadas con `expect(spy).toHaveBeenCalled()`
- No oculta errores de otros componentes
- Fácil de mantener

## Implementation Details

### Pattern para Tests de Event Handlers

```typescript
describe("OnCustomerLinkedToUserHandler", () => {
  let handler: OnCustomerLinkedToUserHandler;
  let commandBus: CommandBus;
  let loggerLogSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnCustomerLinkedToUserHandler,
        {
          provide: CommandBus,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<OnCustomerLinkedToUserHandler>(
      OnCustomerLinkedToUserHandler,
    );
    commandBus = module.get<CommandBus>(CommandBus);

    // Silence logger to avoid noise in test output
    loggerLogSpy = jest.spyOn(handler["logger"], "log").mockImplementation();
    loggerErrorSpy = jest
      .spyOn(handler["logger"], "error")
      .mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should log error for unexpected exceptions", async () => {
    // Arrange
    const event = new CustomerLinkedToUser(
      "customer-id",
      "user-id",
      "business-id",
    );
    const genericError = new Error("Unexpected error");
    (commandBus.execute as jest.Mock).mockRejectedValueOnce(genericError);

    // Act
    await handler.handle(event);

    // Assert - verify logger was called without seeing output
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error adding CUSTOMER role"),
      expect.any(String),
    );
  });
});
```

## Files to Modify

1. `apps/backend/src/auth/app/event-handlers/__tests__/on-customer-linked-to-user.spec.ts`
   - Add logger spies in `beforeEach`
   - Remove individual spies from each test
   - Keep assertions on spies

2. `apps/backend/src/account/app/event-handlers/__tests__/on-user-registered.handler.integration.spec.ts`
   - Add logger spies if needed
   - Silence any error logs during error handling tests

## Testing Strategy

### Before Fix

```bash
$ pnpm test on-customer-linked-to-user.spec.ts

[Nest] ERROR [OnCustomerLinkedToUserHandler] Error adding CUSTOMER role...
[Nest] ERROR [OnCustomerLinkedToUserHandler] Error adding CUSTOMER role...
PASS src/auth/app/event-handlers/__tests__/on-customer-linked-to-user.spec.ts
```

### After Fix

```bash
$ pnpm test on-customer-linked-to-user.spec.ts

PASS src/auth/app/event-handlers/__tests__/on-customer-linked-to-user.spec.ts
  ✓ should execute AddUserRoleCommand with CUSTOMER role
  ✓ should be idempotent - not fail if user already has CUSTOMER role
  ✓ should not propagate other errors
  ✓ should handle non-Error exceptions gracefully
  ✓ should log success when role is added successfully
  ✓ should log when user already has role (idempotent)
  ✓ should log error for unexpected exceptions
```

## Benefits

1. ✅ **Clean Test Output:** No más logs de ERROR esperados en la salida
2. ✅ **Mantiene Verificación:** Los tests siguen verificando que el logging funciona
3. ✅ **No Afecta Producción:** Solo afecta tests, no el código de producción
4. ✅ **Fácil de Mantener:** Pattern simple y consistente
5. ✅ **Errores Reales Visibles:** Errores no esperados siguen siendo visibles

## Alternative Considered: Custom Test Logger

Podríamos crear un `SilentLogger` para tests:

```typescript
class SilentLogger extends Logger {
  log() {}
  error() {}
  warn() {}
  debug() {}
}
```

**Rechazado porque:**

- Más código para mantener
- Requiere inyectar logger en el handler
- Los spies son más simples y directos

## Conclusion

Usar spies de Jest en el logger del handler es la solución más simple y efectiva para silenciar logs esperados en tests sin perder la capacidad de verificar el comportamiento del logging.
