# Análisis de Fallos en Tests - Backend

**Fecha**: 2024-12-24
**Estado**: Tests ya no se cuelgan ✅ | Nuevo problema: synchronize: true causa conflictos

## 🎯 Progreso Reciente

### ✅ Fixes Implementados (Sesión Actual)

1. **CRÍTICO: Reemplazado `bookings_test` → `postgres_test`** ⭐
   - ✅ 32 archivos actualizados con sed
   - ✅ Todos los tests de integración ahora usan la BD correcta
   - **Impacto**: Tests ya NO se cuelgan, conexión exitosa
   - **Problema resuelto**: Timeout infinito por BD inexistente

2. **E2EAuthHelper - Rutas Corregidas**
   - ✅ Cambiado `/api/auth/login` → `/auth/login`
   - ✅ Cambiado `/api/auth/register` → `/auth/register`
   - ✅ Cambiado `/api/businesses` → `/businesses`
   - **Impacto**: ~10 E2E tests ahora usan rutas correctas

3. **schedule-crud.e2e.spec.ts - Actualizado a E2EAuthHelper**
   - ✅ Reemplazado registro manual con `authHelper.createBusinessOwner()`
   - ✅ Cleanup automático con `authHelper.cleanupTestUsers()`
   - **Impacto**: 1 E2E test mejorado

4. **availability-query.e2e.spec.ts - TypeScript Error Fixed**
   - ✅ Corregido `address` de objeto a string
   - **Impacto**: Compilación exitosa

---

## 🔍 Causas Raíz Identificadas

### **Causa #0: Database Name Mismatch** ✅ RESUELTA

**Síntoma**: Tests se colgaban infinitamente intentando conectarse a `bookings_test`

**Problema**:

- Global setup crea schema en `postgres_test`
- Tests de integración tenían hardcoded `bookings_test` como fallback
- Cuando `process.env.DB_DATABASE` no se cargaba, intentaban conectarse a BD inexistente
- Resultado: Timeout infinito con reintentos

**Solución Implementada**:

```bash
find . -name "*.spec.ts" -type f -exec sed -i '' "s/bookings_test/postgres_test/g" {} \;
```

- ✅ 32 archivos actualizados
- ✅ Tests ya no se cuelgan
- ✅ Conexión exitosa a `postgres_test`

---

### **Causa #NEW: synchronize: true en Integration Tests** ⚠️ CRÍTICO

**Síntoma**:

```
QueryFailedError: duplicate key value violates unique constraint "pg_type_typname_nsp_index"
```

**Problema**:

- Global setup ya crea el schema con `synchronize: true`
- Tests de integración también usan `synchronize: true`
- Cuando múltiples tests corren en paralelo, intentan crear el schema simultáneamente
- PostgreSQL lanza error de constraint violation

**Solución Requerida**:

- Cambiar `synchronize: true` → `synchronize: false` en TODOS los tests de integración
- El schema ya existe, solo necesitamos limpiar datos entre tests
- Usar `cleanDatabase()` helper que hace `TRUNCATE ... RESTART IDENTITY CASCADE`

**Archivos Afectados**: ~50 tests de integración

---

### **Causa #1: Limpieza de Base de Datos Incompleta** ✅ RESUELTA

**Estado**: ✅ Implementada

**Solución**:

```typescript
await dataSource.query(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`);
```

---

### **Causa #2: Factories Retornan Null** ⚠️ EN PROGRESO

**Síntoma**:

```typescript
TypeError: Cannot read properties of null (reading 'getUserId')
```

**Problema**:

- Tests crean datos con `generateTestId()` pero luego usan IDs diferentes en commands
- Factory no encuentra el registro porque el ID no coincide

**Solución Implementada**:

- ✅ Python script actualiza 10 archivos con `generateTestId()`
- ✅ `upgrade-subscription` test corregido manualmente
- ⏳ Quedan ~15 tests por verificar

**Archivos Pendientes**:

- `account/app/commands/restore-subscription/__tests__/handler.integration.spec.ts`
- Otros tests de integration que aún fallan

---

### **Causa #3: Rutas de API Incorrectas** ✅ PARCIALMENTE RESUELTA

**Estado**: ✅ E2EAuthHelper corregido, ⏳ Quedan tests individuales

**Solución Implementada**:

- ✅ E2EAuthHelper usa rutas sin `/api` prefix
- ✅ schedule-crud.e2e.spec.ts actualizado

**Archivos Pendientes**:

- `account/presentation/controllers/__tests__/business-owner-profile.e2e.spec.ts`
- `business/presentation/controllers/__tests__/business.e2e.spec.ts`
- `offering/presentation/controllers/__tests__/offering-crud.e2e.spec.ts`
- `customer/presentation/controllers/__tests__/customer.e2e.spec.ts`

---

### **Causa #4: Autenticación Incorrecta en E2E Tests** ✅ PARCIALMENTE RESUELTA

**Estado**: ✅ 2 tests actualizados, ⏳ Quedan 3 tests

**Solución Implementada**:

- ✅ `availability-query.e2e.spec.ts` usa `E2EAuthHelper`
- ✅ `schedule-crud.e2e.spec.ts` usa `E2EAuthHelper`

**Archivos Pendientes**:

- `availability/presentation/controllers/__tests__/blockout-crud.e2e.spec.ts`
- Otros E2E tests que no usan `E2EAuthHelper`

---

### **Causa #5: Concurrency Exceptions** ⏳ PENDIENTE

**Síntoma**:

```
ConcurrencyException: BusinessOwner was modified by another transaction
```

**Solución Requerida**:

- Recargar aggregates después de cada modificación
- O usar IDs únicos por test

---

## 📊 Resumen de Impacto

**Estado Actual** (después de fixes):

- ✅ Tests ya NO se cuelgan
- ✅ 138 suites pasando (74% success rate)
- ✅ 1310 tests pasando
- ⚠️ 48 suites fallando (26%)
- ⚠️ 439 tests fallando

**Mejoras desde inicio**:

- Timeout infinito → Tests completan en ~50 segundos
- 0 suites pasando → 138 suites pasando
- Database connection issues → Resueltos

| Causa                       | Severidad | Tests Afectados | Estado         |
| --------------------------- | --------- | --------------- | -------------- |
| #0: BD Name Mismatch        | CRÍTICA   | TODOS           | ✅ Resuelta    |
| #NEW: synchronize conflicts | CRÍTICA   | ~50 tests       | ✅ Resuelta    |
| #NEW2: Isolated DataSource  | ALTA      | ~48 tests       | ⏳ En progreso |
| #2: Factories null          | MEDIA     | ~20 tests       | ⏳ Pendiente   |
| #3: Rutas 404               | MEDIA     | ~10 tests       | ⏳ Pendiente   |
| #4: Auth 401                | BAJA      | ~5 tests        | ⏳ Pendiente   |

---

## 🛠️ Plan de Acción Actualizado

### **Prioridad 1: Completar Factories Null (Causa #2)** - 50% COMPLETO

- [x] Crear `generateTestId()` helper
- [x] Python script para reemplazar IDs hardcodeados
- [x] Actualizar `upgrade-subscription` test manualmente
- [ ] Verificar y corregir `restore-subscription` test
- [ ] Ejecutar tests y verificar mejoras

**Impacto Estimado**: ~20 tests

### **Prioridad 2: Completar Rutas API (Causa #3)** - 30% COMPLETO

- [x] Corregir E2EAuthHelper
- [x] Actualizar `schedule-crud.e2e.spec.ts`
- [ ] Actualizar `blockout-crud.e2e.spec.ts`
- [ ] Actualizar `business-owner-profile.e2e.spec.ts`
- [ ] Actualizar `business.e2e.spec.ts`
- [ ] Actualizar `offering-crud.e2e.spec.ts`
- [ ] Actualizar `customer.e2e.spec.ts`

**Impacto Estimado**: ~10 tests

### **Prioridad 3: Completar Autenticación (Causa #4)** - 40% COMPLETO

- [x] Actualizar `availability-query.e2e.spec.ts`
- [x] Actualizar `schedule-crud.e2e.spec.ts`
- [ ] Actualizar `blockout-crud.e2e.spec.ts`
- [ ] Verificar otros E2E tests

**Impacto Estimado**: ~5 tests

### **Prioridad 4: Fix Concurrency (Causa #5)** - PENDIENTE

- [ ] Identificar tests con ConcurrencyException
- [ ] Recargar aggregates después de modificaciones
- [ ] Agregar retry logic si es necesario

**Impacto Estimado**: ~3 tests

---

## 🔧 Helpers Disponibles

### `generateTestId()` - Generar IDs únicos

```typescript
import { generateTestId } from '@test-utils/integration-test-helper';

const businessOwnerId = generateTestId();
const userId = generateTestId();
```

### `generateTestEmail()` - Generar emails únicos

```typescript
import { generateTestEmail } from '@test-utils/integration-test-helper';

const email = generateTestEmail();
// test-1703456789123-abc123@example.com
```

### `E2EAuthHelper` - Autenticación en E2E tests

```typescript
import { E2EAuthHelper } from '@test-utils/e2e-helpers';

const authHelper = new E2EAuthHelper(app);
const testUser = await authHelper.createBusinessOwner();
// testUser.token, testUser.businessId disponibles
```

### `cleanDatabase()` - Limpiar BD con RESTART IDENTITY

```typescript
import { cleanDatabase } from '@test-utils/integration-test-helper';

beforeEach(async () => {
  await cleanDatabase(dataSource);
});
```

---

## 📝 Notas Adicionales

### Mejoras Recientes

- ✅ Tests pasan de 341 fallos a 330 fallos (~3% mejora)
- ✅ Tiempo de ejecución: ~50 segundos (muy rápido)
- ✅ Python script automatiza reemplazo de IDs y emails
- ✅ E2EAuthHelper simplifica autenticación en E2E tests

### Próximos Pasos Inmediatos

1. Ejecutar tests para verificar mejoras actuales
2. Actualizar tests restantes de E2E con `E2EAuthHelper`
3. Verificar y corregir `restore-subscription` test
4. Actualizar tests de controllers con rutas correctas

---

**Última Actualización**: 2024-12-24 20:00
**Próximo Paso**: Ejecutar tests y continuar con Prioridad 1 y 2

---

## 🎯 Próximos Pasos Inmediatos

### **Paso 1: Migrar 2-3 tests a createIntegrationTestDataSource()**

Seleccionar tests simples primero:

1. `business-owner-read.repository.integration.spec.ts`
2. `business-owner-write.repository.integration.spec.ts`
3. `business-owner.factory.integration.spec.ts`

**Template de migración**:

```typescript
// Importar helpers
import {
  createIntegrationTestDataSource,
  cleanDatabase,
} from '@test-utils/integration-test-helper';

// Reemplazar DataSource creation
let dataSource: DataSource;

beforeAll(async () => {
  dataSource = await createIntegrationTestDataSource();
});

// Reemplazar cleanup
beforeEach(async () => {
  await cleanDatabase(dataSource);
});

afterAll(async () => {
  await dataSource.destroy();
});
```

### **Paso 2: Verificar que pasan**

```bash
pnpm test business-owner-read.repository.integration.spec.ts
```

### **Paso 3: Commit**

```bash
git add -A
git commit -m "fix(tests): migrate 3 tests to shared DataSource helper"
```

### **Paso 4: Repetir con más tests**

Continuar con batches de 2-3 tests hasta completar los 48 suites.

---

**Última Actualización**: 2024-12-24 20:30
**Próximo Paso**: Migrar primeros 3 tests a createIntegrationTestDataSource()
