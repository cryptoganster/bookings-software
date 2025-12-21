# CI Failure Analysis - PR #81

## Fecha

2025-12-21

## PR Afectado

- **PR:** #81 - feat: implement Account BC with BusinessOwner aggregate and fix integration tests
- **Run ID:** 20415527356
- **Job ID:** 58658619017
- **Job Name:** Test Backend

## Estado del CI

- ✅ Setup & Install Dependencies: SUCCESS
- ✅ Scan for Secrets: SUCCESS
- ✅ Lint Code: SUCCESS
- ✅ Check Code Formatting: SUCCESS
- ✅ TypeScript Type Check: SUCCESS
- ✅ Security Audit Dependencies: SUCCESS
- ✅ Check Dependency Licenses: SUCCESS
- ❌ **Test Backend: FAILURE** ← PROBLEMA AQUÍ
- ✅ Test Frontend: SUCCESS
- ⏭️ Build Backend: SKIPPED (dependía de Test Backend)
- ⏭️ Check Test Coverage: SKIPPED (dependía de Test Backend)
- ✅ Build Frontend: SUCCESS
- ✅ Validate Monorepo Structure: SUCCESS
- ❌ CI Pipeline Status: FAILURE (por Test Backend)

## Error Encontrado

### Descripción

Los tests de integración de `AppointmentReadRepository` fallan con el error:

```
QueryFailedError: relation "offerings" does not exist
```

### Tests Afectados

1. `AppointmentReadRepository Integration Tests › findById › should return read model with denormalized data`
2. `AppointmentReadRepository Integration Tests › findByCustomerId › should return all appointments for customer`
3. `AppointmentReadRepository Integration Tests › findUpcoming › should return only future non-cancelled appointments`

### Ubicación del Error

- **Archivo:** `apps/backend/src/booking/infra/persistence/repositories/appointment-read.ts`
- **Líneas:** 17, 43, 130
- **Código problemático:**
  ```typescript
  .leftJoin('offerings', 'offering', 'offering.id = appointment.offeringId')
  ```

### Causa Raíz

El archivo `apps/backend/test/setup-db.ts` solo registra 2 entidades en el DataSource de pruebas:

```typescript
entities: [AppointmentModel, CapacityModel],  // ← PROBLEMA: Faltan entidades
```

**Entidades faltantes:**

- ❌ OfferingModel
- ❌ CustomerModel
- ❌ BusinessModel
- ❌ BusinessOwnerModel
- ❌ UserModel
- ❌ ConversationModel
- ❌ MessageModel
- ❌ Y cualquier otra entidad del sistema

## Impacto

### Tests Fallidos

- **Total:** 3 tests fallidos de 893
- **Suite:** 1 suite fallida de 113
- **Tiempo:** 141.659 segundos

### Cobertura

La cobertura de código no se pudo calcular porque los tests fallaron.

## Solución Propuesta

### Opción 1: Registrar todas las entidades manualmente (NO RECOMENDADO)

```typescript
import { AppointmentModel } from '@booking/infra/persistence/models/appointment';
import { CapacityModel } from '@availability/infra/persistence/models/capacity';
import { OfferingModel } from '@offering/infra/persistence/models/offering';
import { CustomerModel } from '@customer/infra/persistence/models/customer';
import { BusinessModel } from '@business/infra/persistence/models/business.model';
import { BusinessOwnerModel } from '@account/infra/persistence/models/business-owner.model';
// ... más imports

entities: [
  AppointmentModel,
  CapacityModel,
  OfferingModel,
  CustomerModel,
  BusinessModel,
  BusinessOwnerModel,
  // ... más entidades
],
```

**Problema:** Cada vez que se agregue una nueva entidad, hay que recordar actualizarla aquí.

### Opción 2: Usar glob pattern para auto-descubrir entidades (RECOMENDADO)

```typescript
entities: ['src/**/infra/persistence/models/*.ts'],
```

**Ventajas:**

- ✅ Auto-descubre todas las entidades
- ✅ No requiere mantenimiento manual
- ✅ Funciona con nuevas entidades automáticamente
- ✅ Patrón estándar de TypeORM

### Opción 3: Usar entidades compiladas en dist (ALTERNATIVA)

```typescript
entities: ['dist/**/infra/persistence/models/*.js'],
```

**Ventajas:**

- ✅ Usa archivos compilados (más rápido)
- ✅ Auto-descubre todas las entidades

**Desventajas:**

- ❌ Requiere compilar antes de tests
- ❌ Más complejo en desarrollo

## Recomendación

**Usar Opción 2** (glob pattern con archivos .ts):

```typescript
export function createTestDataSource(): DataSource {
  const isRunInBand = process.argv.includes("--runInBand");
  const workerId = process.env.JEST_WORKER_ID;
  const database = isRunInBand
    ? "bookings_test"
    : `bookings_test_${workerId || "1"}`;

  return new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database,
    entities: ["src/**/infra/persistence/models/*.ts"], // ← CAMBIO AQUÍ
    synchronize: true,
    logging: false,
  });
}
```

## Validación

Después de aplicar el fix, verificar:

1. ✅ Todos los tests de `AppointmentReadRepository` pasan
2. ✅ No hay errores de "relation does not exist"
3. ✅ Los joins con `offerings` y `customers` funcionan
4. ✅ La cobertura de código se calcula correctamente
5. ✅ El CI completo pasa (todos los jobs en verde)

## Archivos a Modificar

1. `apps/backend/test/setup-db.ts` - Actualizar array de `entities`
2. `.kiro/specs/fix-integration-tests/requirements.md` - Agregar Requirement 4 (ya hecho)
3. `.kiro/specs/fix-integration-tests/tasks.md` - Agregar tarea para fix

## Próximos Pasos

1. Actualizar `setup-db.ts` con el glob pattern
2. Ejecutar tests localmente para verificar
3. Hacer commit y push
4. Verificar que el CI pase
5. Mergear PR #81

## Notas Adicionales

- Este problema no se detectó en desarrollo local porque probablemente las migraciones se ejecutaron manualmente
- El CI usa una base de datos limpia, por lo que expone este tipo de problemas
- Es importante que el setup de tests refleje el estado real de la base de datos con todas las tablas

## Referencias

- **GitHub Actions Run:** https://github.com/cryptoganster/bookings-software/actions/runs/20415527356
- **Failed Job:** https://github.com/cryptoganster/bookings-software/actions/runs/20415527356/job/58658619017
- **PR:** https://github.com/cryptoganster/bookings-software/pull/81
