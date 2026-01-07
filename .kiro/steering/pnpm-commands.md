---
inclusion: always
---

# PNPM Commands y Scripts

Este documento define los comandos estándar de pnpm para el monorepo.

## Estructura del Monorepo

El proyecto usa **pnpm workspaces** con la siguiente estructura:

```
root/
├── apps/
│   ├── backend/
│   └── frontend/
└── packages/
    └── shared-types/
```

## Comandos Principales

### Testing

```bash
# Ejecutar tests en backend
pnpm test:backend

# Ejecutar tests en frontend
pnpm test:frontend

# Ejecutar todos los tests
pnpm test

# Tests con coverage
pnpm test:backend:coverage
pnpm test:frontend:coverage

# Tests en modo watch
pnpm test:backend:watch
pnpm test:frontend:watch

# Tests con UI (frontend)
pnpm test:frontend:ui
```

### TypeScript Type Checking

```bash
# Type check backend
pnpm typecheck:backend

# Type check frontend
pnpm typecheck:frontend

# Type check todo el monorepo
pnpm typecheck
```

### Linting

```bash
# Lint backend
pnpm lint:backend

# Lint frontend
pnpm lint:frontend

# Lint todo el monorepo
pnpm lint

# Lint con auto-fix
pnpm lint:backend:fix
pnpm lint:frontend:fix
pnpm lint:fix
```

### Formatting

```bash
# Format backend
pnpm format:backend

# Format frontend
pnpm format:frontend

# Format todo el monorepo
pnpm format

# Check formatting sin modificar
pnpm format:check
```

### Build

```bash
# Build backend
pnpm build:backend

# Build frontend
pnpm build:frontend

# Build todo
pnpm build
```

### Development

```bash
# Iniciar backend en desarrollo
pnpm dev:backend

# Iniciar frontend en desarrollo
pnpm dev:frontend

# Iniciar ambos (paralelo)
pnpm dev
```

## Comandos por Workspace

### Ejecutar comando en workspace específico

```bash
# Sintaxis general
pnpm --filter <workspace-name> <command>

# Ejemplos
pnpm --filter backend test
pnpm --filter frontend dev
pnpm --filter shared-types build
```

### Instalar dependencia en workspace específico

```bash
# Backend
pnpm --filter backend add <package>
pnpm --filter backend add -D <package>

# Frontend
pnpm --filter frontend add <package>
pnpm --filter frontend add -D <package>
```

## Nombres de Workspaces

Los workspaces se definen en `pnpm-workspace.yaml` y `package.json` de cada app:

- **backend** - Backend NestJS
- **frontend** - Frontend React + Vite
- **shared-types** - Tipos compartidos

**Nota:** Los nombres son simples (sin prefijo `@bookings/`) para facilitar los comandos.

## Scripts Internos de cada Workspace

### Backend (apps/backend/package.json)

```json
{
  "scripts": {
    "dev": "nodemon",
    "build": "nest build",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --max-warnings 0",
    "lint:fix": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "typecheck": "tsc --noEmit"
  }
}
```

### Frontend (apps/frontend/package.json)

```json
{
  "scripts": {
    "dev": "vite --host",
    "build": "tsc -b && vite build",
    "test": "vitest --run",
    "test:watch": "vitest",
    "test:coverage": "vitest --run --coverage",
    "test:ui": "vitest --ui",
    "lint": "eslint . --max-warnings 0",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx}\"",
    "typecheck": "tsc --noEmit"
  }
}
```

**Nota sobre Testing:**
- `test`: Single-run mode (para CI/CD) - ejecuta tests una vez y termina
- `test:watch`: Watch mode (para desarrollo) - re-ejecuta tests al detectar cambios
- Ambos workspaces usan el mismo patrón para consistencia

## Mejores Prácticas

### 1. Usar comandos desde root

Siempre ejecutar comandos desde la raíz del monorepo usando los scripts definidos en el `package.json` principal.

```bash
# ✅ Correcto
pnpm test:backend

# ❌ Evitar
cd apps/backend && pnpm test
```

### 2. Instalar dependencias

```bash
# Instalar todas las dependencias del monorepo
pnpm install

# Instalar en workspace específico
pnpm --filter backend add axios
pnpm --filter frontend add @tanstack/react-query
```

### 3. Limpiar node_modules

```bash
# Limpiar todo el monorepo
pnpm clean

# Limpiar y reinstalar
pnpm clean && pnpm install
```

### 4. CI/CD

En CI/CD, ejecutar en este orden:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Troubleshooting

### Error: "workspace not found"

Verificar que el nombre en `package.json` del workspace coincida con el usado en el comando.

### Error: "command not found"

Verificar que el script esté definido en el `package.json` correspondiente.

### Dependencias no se instalan

```bash
# Limpiar cache de pnpm
pnpm store prune

# Reinstalar
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

## Referencias

- [pnpm Workspaces](https://pnpm.io/workspaces)
- [pnpm CLI](https://pnpm.io/cli/add)
- [Filtering](https://pnpm.io/filtering)
