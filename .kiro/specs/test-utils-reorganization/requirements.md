# Requirements Document - Test Utils Reorganization

## Introduction

Reorganizar la estructura de test utilities del backend para consolidar todos los archivos de testing en `apps/backend/test/` y eliminar `apps/backend/src/test-utils/`, siguiendo las mejores prácticas de separación entre código de producción y código de testing.

## Glossary

- **Test Utils**: Utilidades compartidas para testing (helpers, fixtures, generators)
- **E2E Tests**: Tests end-to-end que prueban la aplicación completa
- **Integration Tests**: Tests que prueban la integración entre componentes
- **Unit Tests**: Tests que prueban componentes individuales
- **Helpers**: Funciones auxiliares para facilitar la escritura de tests
- **Fixtures**: Datos de prueba predefinidos para tests
- **Generators**: Funciones que generan datos aleatorios para property-based testing

## Requirements

### Requirement 1: Consolidar E2E Helpers

**User Story:** Como desarrollador, quiero que todos los E2E helpers estén en una ubicación consistente, para facilitar su descubrimiento y mantenimiento.

#### Acceptance Criteria

1. WHEN se buscan E2E helpers THEN todos deben estar en `apps/backend/test/e2e/helpers/`
2. WHEN se importa `auth-helper.ts` THEN debe estar en `apps/backend/test/e2e/helpers/auth-helper.ts`
3. WHEN se importa `types.ts` THEN debe estar en `apps/backend/test/e2e/helpers/types.ts`
4. WHEN se actualizan imports THEN todos los tests E2E deben usar la nueva ubicación
5. WHEN se ejecutan tests E2E THEN todos deben pasar sin errores de importación

### Requirement 2: Consolidar Fixtures

**User Story:** Como desarrollador, quiero que las fixtures estén en `test/e2e/fixtures/` al mismo nivel que helpers, para mantener una separación clara entre helpers (funciones simples) y fixtures (clases con estado y cleanup).

#### Acceptance Criteria

1. WHEN se buscan fixtures THEN deben estar en `apps/backend/test/e2e/fixtures/`
2. WHEN se comparan helpers y fixtures THEN helpers son funciones simples y fixtures son clases con estado
3. WHEN se verifica el uso de fixtures THEN solo se deben mover si están siendo usadas en tests
4. WHEN fixtures no están siendo usadas THEN deben ser eliminadas
5. WHEN se actualizan imports de fixtures THEN todos los tests deben usar la nueva ubicación

### Requirement 3: Consolidar Generators

**User Story:** Como desarrollador, quiero que los generators estén en `apps/backend/test/utils/`, para tener utilidades de testing generales separadas de helpers específicos de E2E.

#### Acceptance Criteria

1. WHEN se buscan generators THEN deben estar en `apps/backend/test/utils/generators.ts`
2. WHEN se importa `generators.ts` THEN debe estar en `apps/backend/test/utils/generators.ts`
3. WHEN se actualizan imports THEN todos los tests (unit, integration, PBT) deben usar la nueva ubicación
4. WHEN se ejecutan tests THEN todos deben pasar sin errores de importación
5. WHEN se verifica el path alias THEN `@test-utils/generators` debe apuntar a `test/utils/generators`

### Requirement 4: Mover Tests E2E de Controllers

**User Story:** Como desarrollador, quiero que todos los tests E2E estén en `apps/backend/test/e2e/`, para mantener una estructura consistente y separar tests E2E de tests unitarios.

#### Acceptance Criteria

1. WHEN se buscan tests E2E THEN todos deben estar en `apps/backend/test/e2e/`
2. WHEN se encuentra `customer.e2e.spec.ts` en controllers THEN debe moverse a `apps/backend/test/e2e/customer-api.e2e-spec.ts`
3. WHEN se actualizan imports en tests E2E THEN deben usar paths relativos correctos
4. WHEN se ejecutan tests E2E THEN todos deben pasar sin errores
5. WHEN se verifica la estructura THEN no deben existir archivos `*.e2e.spec.ts` en `src/`

### Requirement 5: Eliminar src/test-utils

**User Story:** Como desarrollador, quiero eliminar `apps/backend/src/test-utils/` completamente, para mantener una separación clara entre código de producción y código de testing.

#### Acceptance Criteria

1. WHEN se verifica la estructura THEN `apps/backend/src/test-utils/` no debe existir
2. WHEN se buscan imports de `@test-utils` THEN todos deben apuntar a `test/` directory
3. WHEN se ejecutan todos los tests THEN todos deben pasar sin errores
4. WHEN se compila el proyecto THEN no debe haber errores de importación
5. WHEN se verifica tsconfig THEN los path aliases deben estar actualizados correctamente

### Requirement 6: Actualizar Path Aliases

**User Story:** Como desarrollador, quiero que los path aliases de TypeScript reflejen la nueva estructura, para mantener imports limpios y consistentes.

#### Acceptance Criteria

1. WHEN se configura tsconfig THEN `@test-utils/*` debe apuntar a `test/utils/*`
2. WHEN se configura tsconfig THEN `@e2e-helpers/*` debe apuntar a `test/e2e/helpers/*`
3. WHEN se actualizan imports THEN todos los tests deben usar los nuevos aliases
4. WHEN se ejecutan tests THEN todos deben pasar sin errores de resolución de módulos
5. WHEN se verifica Jest config THEN `moduleNameMapper` debe estar sincronizado con tsconfig

### Requirement 7: Consolidar Test Setup Files

**User Story:** Como desarrollador, quiero que todos los archivos de configuración y setup de tests estén en `test/setup/`, para tener una estructura organizada y fácil de mantener.

#### Acceptance Criteria

1. WHEN se buscan archivos de setup THEN deben estar en `apps/backend/test/setup/`
2. WHEN se mueve `jest-e2e.json` THEN debe estar en `test/setup/jest-e2e.json`
3. WHEN se mueven archivos de setup THEN los paths en configuraciones deben actualizarse
4. WHEN se ejecutan tests E2E THEN deben usar la nueva configuración sin errores
5. WHEN se verifica la estructura THEN `test/` raíz solo debe contener directorios (e2e/, setup/, utils/)

### Requirement 8: Mantener Compatibilidad con Tests Existentes

**User Story:** Como desarrollador, quiero que todos los tests existentes sigan funcionando después de la reorganización, para garantizar que no se rompa nada.

#### Acceptance Criteria

1. WHEN se ejecutan tests unitarios THEN todos deben pasar
2. WHEN se ejecutan tests de integración THEN todos deben pasar
3. WHEN se ejecutan tests E2E THEN todos deben pasar (13/13)
4. WHEN se ejecutan tests PBT THEN todos deben pasar
5. WHEN se ejecuta `pnpm test:backend` THEN todos los tests deben pasar sin errores

## Summary

Esta reorganización consolidará toda la infraestructura de testing en `apps/backend/test/`, eliminará `apps/backend/src/test-utils/`, y actualizará todos los imports y path aliases para mantener una estructura consistente y clara entre código de producción y código de testing.

**Estructura Final:**

```
apps/backend/
├── src/                          # Solo código de producción
│   └── (sin test-utils)
└── test/                         # Todo el código de testing
    ├── setup/                    # ✅ Configuración de tests
    │   ├── jest-e2e.json         # Movido
    │   ├── README.md             # Movido
    │   ├── setup-db.ts           # Movido
    │   ├── setup-test-db.sh      # Movido
    │   └── setup.ts              # Movido
    ├── e2e/
    │   ├── helpers/
    │   │   ├── auth-helper.ts    # Movido desde src/test-utils/e2e/
    │   │   ├── types.ts          # Movido desde src/test-utils/e2e/
    │   │   ├── capacity-helper.ts
    │   │   └── offering-helper.ts
    │   ├── fixtures/             # ✅ Al mismo nivel que helpers/
    │   │   ├── appointment.fixture.ts
    │   │   ├── business.fixture.ts
    │   │   └── customer.fixture.ts
    │   ├── app.e2e-spec.ts
    │   ├── conversation-flow.e2e-spec.ts
    │   ├── customer-flow.e2e-spec.ts
    │   └── customer-api.e2e-spec.ts  # Movido desde src/customer/presentation/controllers/__tests__/
    └── utils/
        └── generators.ts         # Movido desde src/test-utils/
```

**Path Aliases:**

```json
{
  "@test-utils/*": ["test/utils/*"],
  "@e2e-helpers/*": ["test/e2e/helpers/*"],
  "@e2e-fixtures/*": ["test/e2e/fixtures/*"]
}
```
