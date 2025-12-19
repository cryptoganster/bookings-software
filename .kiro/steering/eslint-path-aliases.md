# ESLint Path Aliases - Enforce TypeScript Path Aliases

Este documento explica la regla personalizada de ESLint que obliga el uso de path aliases de TypeScript en lugar de imports relativos.

## Propósito

Mantener consistencia en los imports y mejorar la legibilidad del código usando path aliases definidos en `tsconfig.json`.

## Path Aliases Permitidos

Los siguientes path aliases están configurados y son los **ÚNICOS** permitidos en el proyecto:

| Alias                    | Ubicación                        | Propósito                                     |
| ------------------------ | -------------------------------- | --------------------------------------------- |
| `@packages/shared-types` | `packages/shared-types/`         | Tipos compartidos entre apps                  |
| `@shared/*`              | `apps/backend/src/shared/`       | Shared kernel (base classes, VOs, interfaces) |
| `@booking/*`             | `apps/backend/src/booking/`      | Booking BC                                    |
| `@conversation/*`        | `apps/backend/src/conversation/` | Conversation BC                               |
| `@auth/*`                | `apps/backend/src/auth/`         | Auth BC                                       |
| `@availability/*`        | `apps/backend/src/availability/` | Availability BC                               |
| `@offering/*`            | `apps/backend/src/offering/`     | Offering BC                                   |
| `@customer/*`            | `apps/backend/src/customer/`     | Customer BC                                   |
| `@test-utils/*`          | `apps/backend/src/test-utils/`   | Test utilities                                |
| `@database/*`            | `apps/backend/src/database/`     | Database migrations, seeds                    |
| `@config/*`              | `apps/backend/src/config/`       | Configuration files                           |

## Regla ESLint: `enforce-path-aliases`

### Comportamiento

La regla `local-rules/enforce-path-aliases` valida que:

1. **Todos los imports internos usen path aliases** en lugar de rutas relativas
2. **Solo se usen aliases permitidos** (los listados arriba)
3. **Autofix disponible** - ESLint puede corregir automáticamente

### Ejemplos

#### ❌ Incorrecto (imports relativos)

```typescript
// En apps/backend/src/customer/app/commands/identify-customer/handler.ts
import { ICustomerFactory } from "../../../domain/interfaces/factories";
import { Customer } from "../../../domain/aggregates/customer";
import { UUID } from "../../../../shared/vo/uuid";
```

#### ✅ Correcto (path aliases)

```typescript
// En apps/backend/src/customer/app/commands/identify-customer/handler.ts
import { ICustomerFactory } from "@customer/domain/interfaces/factories";
import { Customer } from "@customer/domain/aggregates/customer";
import { UUID } from "@shared/vo/uuid";
```

#### ❌ Incorrecto (alias no permitido)

```typescript
import { Something } from "@utils/something"; // ❌ @utils no está en la lista
import { Helper } from "@helpers/helper"; // ❌ @helpers no está en la lista
```

#### ✅ Correcto (usar alias permitido)

```typescript
import { Something } from "@test-utils/something"; // ✅ @test-utils está permitido
import { Helper } from "@shared/helpers/helper"; // ✅ @shared está permitido
```

## Configuración

### 1. TypeScript (`apps/backend/tsconfig.json`)

```json
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@packages/shared-types": ["../../packages/shared-types/src/index.ts"],
      "@shared/*": ["src/shared/*"],
      "@booking/*": ["src/booking/*"],
      "@conversation/*": ["src/conversation/*"],
      "@auth/*": ["src/auth/*"],
      "@availability/*": ["src/availability/*"],
      "@offering/*": ["src/offering/*"],
      "@customer/*": ["src/customer/*"],
      "@test-utils/*": ["src/test-utils/*"],
      "@database/*": ["src/database/*"],
      "@config/*": ["src/config/*"]
    }
  }
}
```

### 2. Jest (`apps/backend/package.json`)

```json
{
  "jest": {
    "moduleNameMapper": {
      "^@shared/(.*)$": "<rootDir>/shared/$1",
      "^@booking/(.*)$": "<rootDir>/booking/$1",
      "^@conversation/(.*)$": "<rootDir>/conversation/$1",
      "^@auth/(.*)$": "<rootDir>/auth/$1",
      "^@availability/(.*)$": "<rootDir>/availability/$1",
      "^@offering/(.*)$": "<rootDir>/offering/$1",
      "^@customer/(.*)$": "<rootDir>/customer/$1",
      "^@test-utils/(.*)$": "<rootDir>/test-utils/$1",
      "^@database/(.*)$": "<rootDir>/database/$1",
      "^@config/(.*)$": "<rootDir>/config/$1"
    }
  }
}
```

### 3. ESLint (`apps/backend/eslint.config.mjs`)

```javascript
export default [
  {
    files: ["src/**/*.ts"],
    rules: {
      "local-rules/enforce-path-aliases": "error",
      // ... otras reglas
    },
  },
];
```

### 4. Regla Personalizada (`apps/backend/eslint-local-rules.cjs`)

La regla está implementada en `eslint-local-rules.cjs` con:

- Detección automática de imports relativos que deberían usar aliases
- Validación de aliases permitidos
- Autofix para convertir imports relativos a aliases

## Uso

### Validar imports

```bash
pnpm --filter backend lint
```

### Corregir automáticamente

```bash
pnpm --filter backend lint:fix
```

### En CI/CD

El CI valida automáticamente que todos los imports usen path aliases:

```yaml
- name: Lint
  run: pnpm lint:backend
```

## Beneficios

1. ✅ **Legibilidad** - Imports más claros y concisos
2. ✅ **Mantenibilidad** - Fácil refactorizar sin romper imports
3. ✅ **Consistencia** - Todos los imports siguen el mismo patrón
4. ✅ **Navegación** - IDE puede navegar mejor con aliases
5. ✅ **Escalabilidad** - Agregar nuevos BCs es más fácil

## Agregar Nuevo Alias

Si necesitas agregar un nuevo Bounded Context o directorio:

### 1. Actualizar `tsconfig.json`

```json
{
  "paths": {
    "@nuevo-bc/*": ["src/nuevo-bc/*"]
  }
}
```

### 2. Actualizar `package.json` (Jest)

```json
{
  "jest": {
    "moduleNameMapper": {
      "^@nuevo-bc/(.*)$": "<rootDir>/nuevo-bc/$1"
    }
  }
}
```

### 3. Actualizar `eslint-local-rules.cjs`

```javascript
const allowedAliases = [
  // ... aliases existentes
  "@nuevo-bc",
];

const aliasMap = {
  // ... mapeos existentes
  "src/nuevo-bc": "@nuevo-bc",
};
```

### 4. Ejecutar lint:fix

```bash
pnpm --filter backend lint:fix
```

## Troubleshooting

### Error: "Invalid path alias"

**Causa:** Estás usando un alias que no está en la lista permitida.

**Solución:** Usa uno de los aliases permitidos o agrega el nuevo alias siguiendo los pasos arriba.

### Error: "Use path alias instead of relative import"

**Causa:** Estás usando un import relativo cuando deberías usar un alias.

**Solución:** Ejecuta `pnpm --filter backend lint:fix` para corregir automáticamente.

### TypeScript no encuentra el módulo

**Causa:** El alias no está configurado en `tsconfig.json`.

**Solución:** Verifica que el alias esté en `compilerOptions.paths`.

### Jest no encuentra el módulo en tests

**Causa:** El alias no está configurado en `moduleNameMapper` de Jest.

**Solución:** Verifica que el alias esté en `jest.moduleNameMapper` en `package.json`.

## Referencias

- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html#path-mapping)
- [ESLint Custom Rules](https://eslint.org/docs/latest/extend/custom-rules)
- [Jest moduleNameMapper](https://jestjs.io/docs/configuration#modulenamemapper-objectstring-string--arraystring)

---

**Última actualización:** Diciembre 18, 2025  
**Versión:** 1.0  
**Estado:** Activo
