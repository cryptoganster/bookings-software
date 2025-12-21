# Design Document - Fix Integration Tests

## Overview

Los tests de integración fallan debido a conflictos de versiones entre `@nestjs/typeorm`, `typeorm` y `pg`. El error `TypeError: this.postgres.Pool is not a constructor` indica que TypeORM está intentando usar una API de `pg` que no existe en la versión instalada, o viceversa.

## Root Cause Analysis

**Problema identificado:**

- `@nestjs/typeorm@11.0.0` declara peer dependencies:
  - `pg@8.13.1`
  - `typeorm@0.3.20`
- Versiones instaladas actualmente:
  - `pg@8.16.3`
  - `typeorm@0.3.28`

**Causa del error:**
TypeORM 0.3.28 puede estar usando APIs de `pg` que cambiaron entre versiones, causando que `this.postgres.Pool` no sea un constructor válido.

## Architecture

### Solución 1: Downgrade a versiones compatibles (RECOMENDADA)

Usar las versiones exactas que `@nestjs/typeorm@11.0.0` espera:

```json
{
  "dependencies": {
    "pg": "8.13.1",
    "typeorm": "0.3.20"
  }
}
```

**Ventajas:**

- ✅ Garantiza compatibilidad total
- ✅ Evita problemas futuros
- ✅ Solución rápida

**Desventajas:**

- ❌ Perdemos features de versiones más nuevas
- ❌ Posibles security fixes en versiones más nuevas

### Solución 2: Upgrade @nestjs/typeorm (ALTERNATIVA)

Actualizar a una versión más reciente de `@nestjs/typeorm` que soporte las versiones actuales.

**Ventajas:**

- ✅ Mantenemos versiones más recientes
- ✅ Posibles mejoras de performance

**Desventajas:**

- ❌ Puede requerir cambios en el código
- ❌ Más riesgoso

## Components and Interfaces

### Componentes Afectados

1. **TypeORM DataSource**
   - Ubicación: `apps/backend/src/config/database.ts`
   - Responsabilidad: Configurar conexión a PostgreSQL

2. **Test Setup**
   - Ubicación: `apps/backend/test/setup.ts`
   - Responsabilidad: Configurar ambiente de pruebas

3. **Integration Tests**
   - Ubicación: `apps/backend/src/**/__tests__/*.integration.spec.ts`
   - Responsabilidad: Validar integración con BD

## Data Models

No aplica - este es un fix de dependencias.

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Database Connection Success

_For any_ integration test, when the test module is initialized, the database connection should be established successfully without Pool constructor errors.
**Validates: Requirements 1.1, 1.3**

### Property 2: Test Isolation

_For any_ integration test, when the test completes, all database connections should be closed properly without leaving open handles.
**Validates: Requirements 1.4**

### Property 3: Version Compatibility

_For any_ combination of TypeORM and pg versions, when they are declared as peer dependencies by @nestjs/typeorm, the system should use compatible versions.
**Validates: Requirements 3.1, 3.2**

## Error Handling

### Error Scenarios

1. **Pool Constructor Error**
   - Causa: Incompatibilidad de versiones
   - Solución: Usar versiones compatibles
   - Mensaje: `TypeError: this.postgres.Pool is not a constructor`

2. **Connection Timeout**
   - Causa: PostgreSQL no está corriendo
   - Solución: Verificar que el contenedor de Docker esté activo
   - Mensaje: `Connection timeout`

3. **Authentication Failed**
   - Causa: Credenciales incorrectas en `.env.test`
   - Solución: Verificar usuario/password
   - Mensaje: `password authentication failed`

## Testing Strategy

### Unit Tests

No aplica - este es un fix de infraestructura.

### Integration Tests

Todos los tests de integración existentes deben pasar después del fix:

- `apps/backend/src/**/__tests__/*.integration.spec.ts`

### Validation Steps

1. Limpiar node_modules y reinstalar dependencias
2. Ejecutar tests de integración: `npm test -- --testPathPattern="integration.spec.ts"`
3. Verificar que todos los tests pasen
4. Verificar que no haya handles abiertos al finalizar

## Implementation Plan

### Step 1: Backup Current State

```bash
# Guardar package.json actual
cp apps/backend/package.json apps/backend/package.json.backup
```

### Step 2: Update Dependencies

```bash
# Downgrade a versiones compatibles
cd apps/backend
npm install pg@8.13.1 typeorm@0.3.20 --save-exact
```

### Step 3: Clean Install

```bash
# Limpiar y reinstalar
rm -rf node_modules package-lock.json
cd ../..
pnpm install
```

### Step 4: Run Tests

```bash
cd apps/backend
npm test -- --testPathPattern="integration.spec.ts"
```

### Step 5: Verify

- Todos los tests deben pasar
- No debe haber errores de Pool constructor
- No debe haber handles abiertos

## Alternative: If Downgrade Doesn't Work

Si el downgrade no resuelve el problema, investigar:

1. **Verificar importación de pg en TypeORM**
   - Revisar cómo TypeORM importa `Pool` de `pg`
   - Verificar si hay cambios en la API entre versiones

2. **Verificar configuración de TypeORM**
   - Asegurar que `type: 'postgres'` esté configurado correctamente
   - Verificar que no haya configuraciones conflictivas

3. **Considerar usar pg-pool directamente**
   - Si el problema persiste, podríamos necesitar configurar el pool manualmente

## Rollback Plan

Si la solución causa problemas:

```bash
# Restaurar package.json original
cp apps/backend/package.json.backup apps/backend/package.json

# Reinstalar
rm -rf node_modules package-lock.json
cd ../..
pnpm install
```

## Success Criteria

- ✅ Todos los tests de integración pasan
- ✅ No hay errores de "Pool is not a constructor"
- ✅ No hay handles abiertos después de los tests
- ✅ Las versiones de dependencias son compatibles según npm/pnpm
