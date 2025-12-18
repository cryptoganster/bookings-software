# Soluciones para TODOs en Tests

## TODO 1: Optimistic Locking en AppointmentWriteRepository

### Problema Identificado

El optimistic locking actual tiene un defecto fundamental:

```typescript
// En appointment-write.ts línea 38-45
const existing = await this.repository.findOne({ where: { id: appointmentId } });
const previousVersion = existing.version; // ❌ Re-lee desde BD!
```

**El problema:** El método `save()` re-lee la versión desde la BD justo antes del UPDATE. Esto significa que solo detecta conflictos en la ventana muy estrecha entre el `findOne()` y el `UPDATE`, NO desde el momento en que se cargó el aggregate.

**Escenario que NO detecta:**
1. Proceso A carga appointment (version 1)
2. Proceso B carga appointment (version 1)
3. Proceso A modifica y guarda (BD ahora version 2)
4. Proceso B modifica y llama save()
5. save() re-lee BD (ve version 2)
6. save() hace UPDATE SET version=3 WHERE version=2 ✅ **ÉXITO** (debería fallar!)

### Solución: Tracking de Versión Cargada

Necesitamos que el aggregate recuerde la versión que tenía cuando fue cargado, no solo la versión actual.

#### Paso 1: Modificar VersionedAggregateRoot

```typescript
// apps/backend/src/shared/kernel/versioned-aggregate-root.ts
import { AggregateRoot } from '@nestjs/cqrs';
import { AggregateVersion } from '@shared/vo/aggregate-version';

export abstract class VersionedAggregateRoot extends AggregateRoot {
  protected version: AggregateVersion;
  private loadedVersion: AggregateVersion; // ← NUEVO: versión cuando se cargó

  constructor() {
    super();
    this.version = new AggregateVersion(0);
    this.loadedVersion = new AggregateVersion(0); // ← NUEVO
    this.autoCommit = true;
  }

  getVersion(): AggregateVersion {
    return this.version;
  }

  /**
   * Retorna la versión que tenía el aggregate cuando fue cargado desde BD.
   * Esta es la versión que debe usarse en el WHERE del UPDATE para optimistic locking.
   */
  getLoadedVersion(): AggregateVersion {
    return this.loadedVersion;
  }

  protected incrementVersion(): void {
    this.version = this.version.increment();
  }

  /**
   * Reconstruye el aggregate con una versión específica (útil para hidratar desde BD)
   */
  protected setVersion(version: number): void {
    this.version = new AggregateVersion(version);
    this.loadedVersion = new AggregateVersion(version); // ← NUEVO: guardar versión cargada
  }
}
```

#### Paso 2: Modificar AppointmentWriteRepository

```typescript
// apps/backend/src/booking/infra/persistence/repositories/appointment-write.ts
async save(appointment: Appointment): Promise<void> {
  await this.uow.transaction(async () => {
    const model = AppointmentWriteMapper.toModel(appointment);
    const currentVersion = appointment.getVersion().getValue();
    const loadedVersion = appointment.getLoadedVersion().getValue(); // ← NUEVO: usar versión cargada
    const appointmentId = appointment.getId().getValue();

    // Verificar si el appointment ya existe
    const existing = await this.repository.findOne({
      where: { id: appointmentId },
    });

    if (!existing) {
      // Es un nuevo appointment, hacer INSERT
      await this.repository.insert({
        ...model,
        version: currentVersion,
        createdAt: new Date(),
        updatedAt: new Date(),
        cancelledAt: null,
      } as AppointmentModel);
    } else {
      // Es un appointment existente, hacer UPDATE con optimistic locking
      // CORRECCIÓN: Usar loadedVersion en el WHERE, no re-leer desde BD
      const result = await this.repository
        .createQueryBuilder()
        .update(AppointmentModel)
        .set({
          ...model,
          version: currentVersion, // Nueva versión (después de modificaciones)
          updatedAt: new Date(),
        })
        .where('id = :id', { id: appointmentId })
        .andWhere('version = :version', {
          version: loadedVersion, // ← CORRECCIÓN: usar versión cargada, no existing.version
        })
        .execute();

      // Si no se actualizó ninguna fila, significa que hubo concurrencia
      if (result.affected === 0) {
        throw new ConcurrencyException(
          `Appointment ${appointmentId} was modified by another transaction. ` +
          `Expected version ${loadedVersion}, but database has a different version.`,
        );
      }
    }
  });
}
```

#### Paso 3: Actualizar el Test

```typescript
// apps/backend/src/booking/infra/persistence/repositories/__tests__/appointment-write.repository.spec.ts
it('should throw ConcurrencyException when version is incorrect', async () => {
  // Arrange
  const appointment = Appointment.create(
    UUID.generate(),
    UUID.generate(),
    UUID.generate(),
    UUID.generate(),
    DateTime.fromDate(new Date(Date.now() + 86400000)),
  );

  // Save initial appointment (version will be 1)
  await repository.save(appointment);

  // Simular dos procesos concurrentes:
  // Proceso 1: Reload y modifica
  const process1Appointment = await factory.loadById(appointment.getId().getValue());
  expect(process1Appointment).toBeDefined();
  expect(process1Appointment!.getVersion().getValue()).toBe(1);
  expect(process1Appointment!.getLoadedVersion().getValue()).toBe(1); // ← NUEVO
  process1Appointment!.cancel(); // version 2, loadedVersion sigue siendo 1

  // Proceso 2: Reload y modifica
  const process2Appointment = await factory.loadById(appointment.getId().getValue());
  expect(process2Appointment).toBeDefined();
  expect(process2Appointment!.getVersion().getValue()).toBe(1);
  expect(process2Appointment!.getLoadedVersion().getValue()).toBe(1); // ← NUEVO
  process2Appointment!.cancel(); // version 2, loadedVersion sigue siendo 1

  // Proceso 1 guarda primero (éxito - BD pasa de version 1 a 2)
  await repository.save(process1Appointment!);

  // Proceso 2 intenta guardar (fallo - BD tiene version 2, pero proceso2 espera version 1)
  // El WHERE version = 1 fallará porque la BD tiene version 2
  await expect(repository.save(process2Appointment!)).rejects.toThrow(ConcurrencyException);
});
```

### Beneficios de esta Solución

1. ✅ **Optimistic Locking Correcto:** Detecta conflictos desde el momento de carga, no solo en el momento de save
2. ✅ **Sin Cambios en Aggregates:** Los aggregates existentes no necesitan cambios, solo heredan el nuevo comportamiento
3. ✅ **Backward Compatible:** Los aggregates que no usan optimistic locking siguen funcionando igual
4. ✅ **Testeable:** El test ahora valida el comportamiento correcto

---

## TODO 2: WebSocket Integration Tests - Flaky Tests

### Problemas Identificados

#### Problema 1: "should reject connection without businessId"
- **Error:** `done()` llamado múltiples veces
- **Causa:** El evento `disconnect` se dispara múltiples veces en Socket.IO

#### Problema 2: "should handle client reconnection"
- **Error:** `client1.connected` es `false` cuando debería ser `true`
- **Causa:** Timing issues - el cliente no se reconecta a tiempo antes del timeout

### Solución 1: Fix para "should reject connection without businessId"

```typescript
// apps/backend/src/shared/infra/websocket/__tests__/websocket.integration.spec.ts
it('should reject connection without businessId', (done) => {
  let disconnectCalled = false; // ← NUEVO: flag para evitar múltiples llamadas a done()
  
  client1 = io(`http://localhost:${PORT}/events`, {
    auth: {},
  });

  client1!.on('connect', () => {
    done(new Error('Should not connect without businessId'));
  });

  client1!.on('disconnect', () => {
    if (!disconnectCalled) { // ← NUEVO: solo llamar done() una vez
      disconnectCalled = true;
      expect(client1!.connected).toBe(false);
      done();
    }
  });
});
```

### Solución 2: Fix para "should handle client reconnection"

El problema es que Socket.IO no garantiza reconexión inmediata. Necesitamos:
1. Aumentar el timeout
2. Usar promesas en lugar de callbacks
3. Esperar activamente la reconexión

```typescript
// apps/backend/src/shared/infra/websocket/__tests__/websocket.integration.spec.ts
it('should handle client reconnection', async () => {
  client1 = io(`http://localhost:${PORT}/events`, {
    auth: { businessId: 'business-123' },
    reconnection: true, // ← NUEVO: asegurar que reconnection está habilitado
    reconnectionDelay: 100, // ← NUEVO: delay corto para tests
  });

  // Esperar conexión inicial
  await new Promise<void>((resolve) => {
    client1!.on('connect', () => resolve());
  });

  expect(client1!.connected).toBe(true);

  // Desconectar
  client1!.disconnect();
  expect(client1!.connected).toBe(false);

  // Reconectar y esperar
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Reconnection timeout'));
    }, 5000); // ← NUEVO: timeout de 5 segundos

    client1!.on('connect', () => {
      clearTimeout(timeout);
      resolve();
    });

    client1!.connect();
  });

  expect(client1!.connected).toBe(true);
}, 10000); // ← NUEVO: timeout de 10 segundos para el test completo
```

### Solución Alternativa: Usar `waitFor` Helper

Crear un helper para esperar condiciones:

```typescript
// apps/backend/src/shared/infra/websocket/__tests__/websocket.integration.spec.ts

// Helper function al inicio del archivo
async function waitFor(
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

// Usar en el test
it('should handle client reconnection', async () => {
  client1 = io(`http://localhost:${PORT}/events`, {
    auth: { businessId: 'business-123' },
    reconnection: true,
    reconnectionDelay: 100,
  });

  // Esperar conexión inicial
  await waitFor(() => client1!.connected);
  expect(client1!.connected).toBe(true);

  // Desconectar
  client1!.disconnect();
  await waitFor(() => !client1!.connected);
  expect(client1!.connected).toBe(false);

  // Reconectar
  client1!.connect();
  await waitFor(() => client1!.connected);
  expect(client1!.connected).toBe(true);
}, 10000);
```

### Solución 3: Configuración de Socket.IO para Tests

Agregar configuración específica para tests en el gateway:

```typescript
// apps/backend/src/shared/infra/websocket/events.gateway.ts
@WebSocketGateway({
  namespace: 'events',
  cors: {
    origin: '*',
  },
  // ← NUEVO: Configuración para tests
  pingTimeout: process.env.NODE_ENV === 'test' ? 1000 : 60000,
  pingInterval: process.env.NODE_ENV === 'test' ? 500 : 25000,
})
export class EventsGateway {
  // ... resto del código
}
```

### Recomendación Final

Para tests de integración de WebSocket, considerar:

1. **Usar async/await en lugar de callbacks con done()**
2. **Implementar helpers de espera (`waitFor`)**
3. **Aumentar timeouts para tests de reconexión**
4. **Usar flags para evitar múltiples llamadas a done()**
5. **Configurar Socket.IO específicamente para tests**

O alternativamente:

6. **Mover estos tests a E2E** donde los timeouts largos son más aceptables
7. **Usar mocks** en lugar de servidor real para tests unitarios

---

## Resumen de Cambios Necesarios

### Para Optimistic Locking:
1. ✅ Modificar `VersionedAggregateRoot` para trackear `loadedVersion`
2. ✅ Modificar `AppointmentWriteRepository.save()` para usar `loadedVersion`
3. ✅ Actualizar test para verificar el comportamiento correcto
4. ✅ Aplicar el mismo patrón a otros aggregates versionados (Capacity, Conversation)

### Para WebSocket Tests:
1. ✅ Convertir tests de callbacks a async/await
2. ✅ Implementar helper `waitFor` para esperar condiciones
3. ✅ Usar flags para evitar múltiples llamadas a done()
4. ✅ Aumentar timeouts para tests de reconexión
5. ✅ Configurar Socket.IO específicamente para tests

---

## Prioridad de Implementación

### Alta Prioridad (Crítico):
- **Optimistic Locking:** Este es un bug de seguridad de datos que puede causar lost updates en producción

### Media Prioridad (Importante):
- **WebSocket Tests:** Tests flaky reducen confianza en CI/CD, pero no afectan funcionalidad en producción

### Orden Recomendado:
1. Implementar fix de Optimistic Locking
2. Aplicar a todos los aggregates versionados
3. Verificar con tests de concurrencia
4. Fix WebSocket tests
5. Commit y documentar cambios
