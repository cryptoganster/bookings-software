# Plan de Reorganización a Monorepo Fullstack

**Fecha:** Diciembre 2024  
**Objetivo:** Convertir el proyecto backend actual en un monorepo fullstack con pnpm workspaces

---

## Fase 1: Preparación (30 min)

### 1.1 Backup y Verificación

```bash
# Crear rama para reorganización
git checkout -b feature/monorepo-restructure

# Verificar que todo funciona antes de mover
pnpm test
pnpm build

# Commit estado actual
git add .
git commit -m "chore: checkpoint before monorepo restructure"
```

### 1.2 Instalar pnpm

```bash
# Instalar pnpm globalmente (si no está instalado)
npm install -g pnpm

# Verificar instalación
pnpm --version
```

### 1.3 Documentar Estado Actual

```bash
# Listar dependencias actuales
npm list --depth=0 > docs/dependencies-before.txt

# Listar scripts
cat package.json | grep -A 20 '"scripts"' > docs/scripts-before.txt
```

---

## Fase 2: Crear Estructura de Monorepo (45 min)

### 2.1 Crear Directorios Base

```bash
# Crear estructura de apps
mkdir -p apps/backend
mkdir -p apps/frontend

# Crear estructura de packages compartidos
mkdir -p packages/shared-types/src
mkdir -p packages/shared-types/dist

# Crear directorio temporal para mover archivos
mkdir -p .temp-migration
```

### 2.2 Mover Backend a apps/backend

```bash
# Mover código fuente
mv src apps/backend/
mv test apps/backend/

# Mover configuraciones
mv tsconfig.json apps/backend/
mv tsconfig.build.json apps/backend/
mv nest-cli.json apps/backend/
mv eslint.config.mjs apps/backend/
mv .prettierrc apps/backend/
mv eslint-local-rules.cjs apps/backend/

# Mover archivos de entorno
mv .env apps/backend/
mv .env.example apps/backend/
mv .env.test apps/backend/

# Mover package.json (lo modificaremos después)
cp package.json apps/backend/package.json

# Mover docker
mv docker-compose.dev.yml apps/backend/
```

### 2.3 Mantener en Raíz

```bash
# Estos archivos permanecen en la raíz
# - .git/
# - .gitignore (actualizar)
# - docs/
# - .kiro/
# - README.md (actualizar)
# - LICENSE
# - MIGRATIONS_AND_SEEDS.md
# - QUICK_START_DATABASE.md
# - README.docker.md
# - CLEANUP_SUMMARY.md
```

---

## Fase 3: Configurar Workspace (1 hora)

### 3.1 Crear pnpm-workspace.yaml

```bash
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
EOF
```

### 3.2 Crear Root package.json

```bash
cat > package.json << 'EOF'
{
  "name": "bookings-system-monorepo",
  "version": "1.0.0",
  "private": true,
  "description": "Sistema de Reservas Multi-Tenant - Monorepo Fullstack",
  "scripts": {
    "dev": "pnpm --parallel --stream run dev",
    "dev:backend": "pnpm --filter backend dev",
    "dev:frontend": "pnpm --filter frontend dev",
    "build": "pnpm --recursive run build",
    "build:backend": "pnpm --filter backend build",
    "build:frontend": "pnpm --filter frontend build",
    "start:backend": "pnpm --filter backend start:prod",
    "start:frontend": "pnpm --filter frontend preview",
    "test": "pnpm --recursive run test",
    "test:backend": "pnpm --filter backend test",
    "test:e2e:backend": "pnpm --filter backend test:e2e",
    "test:frontend": "pnpm --filter frontend test",
    "lint": "pnpm --recursive run lint",
    "lint:fix": "pnpm --recursive run lint:fix",
    "format": "pnpm --recursive run format",
    "clean": "pnpm --recursive run clean && rm -rf node_modules",
    "migration:generate": "pnpm --filter backend migration:generate",
    "migration:run": "pnpm --filter backend migration:run",
    "migration:revert": "pnpm --filter backend migration:revert",
    "seed": "pnpm --filter backend seed"
  },
  "keywords": [
    "bookings",
    "whatsapp",
    "nestjs",
    "react",
    "monorepo"
  ],
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "turbo": "^1.11.0"
  }
}
EOF
```

### 3.3 Actualizar apps/backend/package.json

```bash
cat > apps/backend/package.json << 'EOF'
{
  "name": "backend",
  "version": "1.0.0",
  "description": "Backend NestJS - Sistema de Reservas",
  "author": "",
  "private": true,
  "license": "UNLICENSED",
  "scripts": {
    "dev": "nest start --watch",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --config eslint.config.mjs",
    "lint:fix": "eslint \"{src,apps,libs,test}/**/*.ts\" --config eslint.config.mjs --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "migration:generate": "typeorm migration:generate",
    "migration:run": "typeorm migration:run",
    "migration:revert": "typeorm migration:revert",
    "seed": "ts-node -r tsconfig-paths/register src/database/seeds/run-seeds.ts",
    "clean": "rm -rf dist node_modules"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/config": "^3.1.1",
    "@nestjs/core": "^10.0.0",
    "@nestjs/cqrs": "^10.2.6",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/platform-fastify": "^10.3.0",
    "@nestjs/terminus": "^10.2.0",
    "@nestjs/typeorm": "^10.0.1",
    "bcrypt": "^5.1.1",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "date-fns": "^3.0.6",
    "date-fns-tz": "^2.0.0",
    "nestjs-pino": "^3.5.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "pg": "^8.11.3",
    "pino-http": "^8.6.1",
    "pino-pretty": "^10.3.1",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1",
    "typeorm": "^0.3.19",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/bcrypt": "^5.0.2",
    "@types/jest": "^29.5.2",
    "@types/node": "^20.3.1",
    "@types/passport-jwt": "^4.0.0",
    "@types/supertest": "^6.0.0",
    "@types/uuid": "^9.0.7",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.42.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.0",
    "jest": "^29.5.0",
    "prettier": "^3.0.0",
    "source-map-support": "^0.5.21",
    "supertest": "^6.3.3",
    "ts-jest": "^29.1.0",
    "ts-loader": "^9.4.3",
    "ts-node": "^10.9.1",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.1.3"
  },
  "jest": {
    "moduleFileExtensions": [
      "js",
      "json",
      "ts"
    ],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": [
      "**/*.(t|j)s"
    ],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
EOF
```

### 3.4 Actualizar .gitignore

```bash
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
**/node_modules/

# Build outputs
dist/
**/dist/
build/
**/build/
*.tsbuildinfo

# Environment variables
.env
.env.local
.env.*.local
**/.env
**/.env.local
!.env.example

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
**/*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Coverage
coverage/
**/coverage/
.nyc_output/

# pnpm
pnpm-lock.yaml
.pnpm-debug.log*

# Kiro (opcional)
# .kiro/

# TypeORM
ormconfig.json

# Tests
test-results/

# Temporary
.temp-migration/
EOF
```

---

## Fase 4: Configurar Shared Types (30 min)

### 4.1 Crear packages/shared-types/package.json

```bash
cat > packages/shared-types/package.json << 'EOF'
{
  "name": "@packages/shared-types",
  "version": "1.0.0",
  "description": "Tipos y DTOs compartidos entre backend y frontend",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist"
  },
  "keywords": [
    "types",
    "dto",
    "shared"
  ],
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
EOF
```

### 4.2 Crear packages/shared-types/tsconfig.json

```bash
cat > packages/shared-types/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "commonjs",
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF
```

### 4.3 Crear tipos compartidos iniciales

```bash
cat > packages/shared-types/src/index.ts << 'EOF'
// DTOs de Appointment
export interface CreateAppointmentDto {
  customerId: string;
  offeringId: string;
  dateTime: Date;
}

export interface AppointmentReadModel {
  id: string;
  businessId: string;
  customerId: string;
  customerName: string | null;
  customerPhone: string;
  offeringId: string;
  offeringName: string;
  dateTime: Date;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  createdAt: Date;
  cancelledAt: Date | null;
}

// DTOs de Offering
export interface CreateOfferingDto {
  name: string;
  duration: number;
  maxCapacityPerSlot: number;
  maxDailyCapacity?: number;
}

export interface OfferingReadModel {
  id: string;
  businessId: string;
  name: string;
  duration: number;
  maxCapacityPerSlot: number;
  maxDailyCapacity: number | null;
  isActive: boolean;
}

// DTOs de Schedule
export interface CreateScheduleDto {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface ScheduleReadModel {
  id: string;
  businessId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

// DTOs de Business
export interface BusinessReadModel {
  id: string;
  ownerId: string;
  name: string;
  whatsappNumber: string;
  address: string;
  timezone: string;
  createdAt: Date;
}

// DTOs de Conversation
export interface ConversationReadModel {
  id: string;
  businessId: string;
  customerId: string;
  customerName: string | null;
  customerPhone: string;
  status: 'ACTIVE' | 'AWAITING_ADMIN' | 'RESOLVED';
  lastMessageAt: Date;
}

export interface MessageReadModel {
  id: string;
  conversationId: string;
  direction: 'INBOUND' | 'OUTBOUND';
  content: string;
  messageType: 'TEXT' | 'BUTTON' | 'LOCATION';
  sentAt: Date;
  isFromAdmin: boolean;
}

// Tipos de respuesta API
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
}

// Tipos de filtros
export interface AppointmentFilters {
  status?: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  dateRange?: [Date, Date];
  offeringId?: string;
}
EOF
```

---

## Fase 5: Instalar Dependencias (15 min)

### 5.1 Limpiar node_modules antiguos

```bash
# Eliminar node_modules y package-lock.json de la raíz
rm -rf node_modules package-lock.json

# Eliminar dist si existe
rm -rf dist
```

### 5.2 Instalar con pnpm

```bash
# Instalar todas las dependencias del workspace
pnpm install

# Esto instalará:
# - Dependencias del root
# - Dependencias de apps/backend
# - Dependencias de packages/shared-types
```

### 5.3 Verificar instalación

```bash
# Verificar estructura de node_modules
ls -la node_modules/.pnpm

# Verificar que backend tiene sus dependencias
ls -la apps/backend/node_modules

# Build shared-types
pnpm --filter @packages/shared-types build
```

---

## Fase 6: Inicializar Frontend (1 hora)

### 6.1 Crear proyecto Vite + React

```bash
cd apps/frontend
pnpm create vite@latest . --template react-ts
```

### 6.2 Actualizar apps/frontend/package.json

```bash
cat > apps/frontend/package.json << 'EOF'
{
  "name": "frontend",
  "version": "1.0.0",
  "type": "module",
  "description": "Frontend React - Panel de Administración",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "clean": "rm -rf dist node_modules"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.20.0",
    "@tanstack/react-query": "^5.17.0",
    "@mantine/core": "^7.3.2",
    "@mantine/hooks": "^7.3.2",
    "@mantine/dates": "^7.3.2",
    "@mantine/notifications": "^7.3.2",
    "@mantine/modals": "^7.3.2",
    "@tabler/icons-react": "^2.44.0",
    "react-hook-form": "^7.49.0",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.3",
    "axios": "^1.6.2",
    "date-fns": "^3.0.6",
    "date-fns-tz": "^2.0.0",
    "dayjs": "^1.11.10",
    "zustand": "^4.4.7",
    "@packages/shared-types": "workspace:*"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "prettier": "^3.1.1",
    "typescript": "^5.2.2",
    "vite": "^5.0.8",
    "vitest": "^1.0.4",
    "@testing-library/react": "^14.1.2",
    "@testing-library/user-event": "^14.5.1",
    "@vitest/ui": "^1.0.4",
    "msw": "^2.0.11"
  }
}
EOF
```

### 6.3 Configurar Vite

```bash
cat > apps/frontend/vite.config.ts << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@app': path.resolve(__dirname, './src/app'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@widgets': path.resolve(__dirname, './src/widgets'),
      '@features': path.resolve(__dirname, './src/features'),
      '@entities': path.resolve(__dirname, './src/entities'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
EOF
```

### 6.4 Configurar TypeScript para Frontend

```bash
cat > apps/frontend/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@app/*": ["./src/app/*"],
      "@pages/*": ["./src/pages/*"],
      "@widgets/*": ["./src/widgets/*"],
      "@features/*": ["./src/features/*"],
      "@entities/*": ["./src/entities/*"],
      "@shared/*": ["./src/shared/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF
```

### 6.5 Crear estructura FSD básica

```bash
cd apps/frontend

# Crear estructura Feature-Sliced Design
mkdir -p src/app/{providers,router,store,layouts}
mkdir -p src/pages
mkdir -p src/widgets
mkdir -p src/features
mkdir -p src/entities
mkdir -p src/shared/{api,config,lib,ui,hooks}

# Volver a raíz
cd ../..
```

---

## Fase 7: Actualizar Documentación (30 min)

### 7.1 Actualizar README.md principal

```bash
cat > README.md << 'EOF'
# Sistema de Reservas Multi-Tenant

Sistema fullstack para gestión de reservaciones vía WhatsApp Business API.

## Estructura del Proyecto

```

bookings-system/
├── apps/
│ ├── backend/ # NestJS API
│ └── frontend/ # React + Vite Panel
├── packages/
│ └── shared-types/ # Tipos compartidos
├── docs/ # Documentación
└── .kiro/ # Configuración Kiro

````

## Stack Tecnológico

### Backend
- NestJS 10
- TypeScript
- PostgreSQL
- TypeORM
- CQRS + DDD
- Fastify + Pino

### Frontend
- React 18
- Vite 5
- TypeScript
- Mantine UI
- TanStack Query
- Zustand

## Inicio Rápido

### Prerrequisitos
- Node.js 20+
- pnpm 8+
- PostgreSQL 14+

### Instalación

```bash
# Instalar pnpm
npm install -g pnpm

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp apps/backend/.env.example apps/backend/.env
# Editar apps/backend/.env con tus credenciales

# Ejecutar migraciones
pnpm migration:run

# Ejecutar seeds (opcional)
pnpm seed
````

### Desarrollo

```bash
# Iniciar backend + frontend simultáneamente
pnpm dev

# O iniciar individualmente
pnpm dev:backend   # http://localhost:3000
pnpm dev:frontend  # http://localhost:5173
```

### Testing

```bash
# Todos los tests
pnpm test

# Tests por aplicación
pnpm test:backend
pnpm test:frontend

# E2E backend
pnpm test:e2e:backend
```

### Build

```bash
# Build todo
pnpm build

# Build individual
pnpm build:backend
pnpm build:frontend
```

## Scripts Disponibles

Ver `package.json` en la raíz para lista completa de scripts.

## Documentación

- [PRD Backend](docs/steering/backend/PRD.md)
- [PRD Frontend](.kiro/steering/frontend/PRD.md)
- [Arquitectura](docs/steering/architecture.md)
- [Bounded Contexts](docs/steering/bounded-contexts.md)
- [DDD Patterns](docs/steering/ddd-patterns.md)
- [CQRS](docs/steering/cqrs.md)

## Licencia

ISC
EOF

````

### 7.2 Crear README para Backend

```bash
cat > apps/backend/README.md << 'EOF'
# Backend - Sistema de Reservas

API NestJS con arquitectura Clean + DDD + CQRS.

## Estructura

````

src/
├── auth/ # Autenticación JWT
├── availability/ # Horarios y capacidad
├── booking/ # Reservaciones (BC principal)
├── conversation/ # Mensajería WhatsApp
├── customer/ # Clientes finales
├── shared/ # Shared Kernel
├── config/ # Configuración
├── database/ # Migraciones y seeds
└── main.ts # Entry point

````

## Variables de Entorno

Copiar `.env.example` a `.env` y configurar:

```bash
# Application
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=bookings_dev

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRATION=1d

# WhatsApp (opcional para MVP)
WHATSAPP_API_URL=
WHATSAPP_ACCESS_TOKEN=
````

## Comandos

```bash
# Desarrollo
pnpm dev

# Build
pnpm build

# Tests
pnpm test
pnpm test:e2e
pnpm test:cov

# Migraciones
pnpm migration:generate -- -n MigrationName
pnpm migration:run
pnpm migration:revert

# Seeds
pnpm seed
```

## API Endpoints

- `POST /api/auth/login` - Login
- `GET /api/appointments` - Listar citas
- `POST /api/appointments` - Crear cita
- `DELETE /api/appointments/:id` - Cancelar cita
- Ver más en Swagger: http://localhost:3000/api

## Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Coverage
pnpm test:cov
```

EOF

````

### 7.3 Crear README para Frontend

```bash
cat > apps/frontend/README.md << 'EOF'
# Frontend - Panel de Administración

Panel web React con Feature-Sliced Design.

## Estructura

````

src/
├── app/ # Inicialización (providers, router)
├── pages/ # Páginas completas
├── widgets/ # Composiciones complejas
├── features/ # Casos de uso interactivos
├── entities/ # Modelos de dominio
└── shared/ # Código reutilizable

````

## Desarrollo

```bash
# Iniciar dev server
pnpm dev

# Build
pnpm build

# Preview build
pnpm preview

# Tests
pnpm test
pnpm test:ui
````

## Configuración

El frontend se conecta al backend en `http://localhost:3000/api` mediante proxy de Vite.

Ver `vite.config.ts` para configuración de proxy.

## Rutas Principales

- `/` - Dashboard
- `/appointments` - Gestión de citas
- `/offerings` - Servicios ofrecidos
- `/schedules` - Horarios
- `/conversations` - Consultas de clientes
- `/settings` - Configuración

## Testing

```bash
# Unit tests con Vitest
pnpm test

# UI de tests
pnpm test:ui

# Coverage
pnpm test:coverage
```

EOF

````

---

## Fase 8: Verificación y Testing (45 min)

### 8.1 Verificar Backend

```bash
# Navegar a backend
cd apps/backend

# Verificar que compila
pnpm build

# Verificar tests
pnpm test

# Iniciar en modo dev
pnpm dev
````

### 8.2 Verificar Frontend

```bash
# Navegar a frontend
cd apps/frontend

# Instalar dependencias si falta algo
pnpm install

# Verificar que compila
pnpm build

# Iniciar en modo dev
pnpm dev
```

### 8.3 Verificar Shared Types

```bash
# Build shared types
pnpm --filter @packages/shared-types build

# Verificar que backend puede importar
cd apps/backend
node -e "console.log(require('@packages/shared-types'))"
```

### 8.4 Probar Comando Unificado

```bash
# Desde la raíz
pnpm dev

# Debería iniciar:
# - Backend en http://localhost:3000
# - Frontend en http://localhost:5173
```

---

## Fase 9: Migración de Código Existente (2 horas)

### 9.1 Actualizar Imports en Backend

```bash
# Buscar imports que necesiten actualización
cd apps/backend
grep -r "from '@shared" src/

# No debería haber cambios necesarios si los paths están bien configurados
```

### 9.2 Configurar Path Aliases en Backend

Verificar que `apps/backend/tsconfig.json` tenga:

```json
{
  "compilerOptions": {
    "paths": {
      "@shared/*": ["src/shared/*"],
      "@booking/*": ["src/booking/*"],
      "@availability/*": ["src/availability/*"],
      "@auth/*": ["src/auth/*"],
      "@conversation/*": ["src/conversation/*"]
    }
  }
}
```

### 9.3 Actualizar Variables de Entorno

```bash
# Verificar que .env está en apps/backend/
ls -la apps/backend/.env

# Si no existe, copiar desde ejemplo
cp apps/backend/.env.example apps/backend/.env
```

### 9.4 Actualizar Docker Compose (si aplica)

```bash
# Si usas docker-compose, actualizar paths
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: bookings_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build:
      context: ./apps/backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
    depends_on:
      - postgres
    volumes:
      - ./apps/backend:/app
      - /app/node_modules

  frontend:
    build:
      context: ./apps/frontend
      dockerfile: Dockerfile
    ports:
      - "5173:5173"
    volumes:
      - ./apps/frontend:/app
      - /app/node_modules
    depends_on:
      - backend

volumes:
  postgres_data:
EOF
```

---

## Fase 10: Limpieza y Commit (30 min)

### 10.1 Eliminar Archivos Temporales

```bash
# Eliminar directorio temporal
rm -rf .temp-migration

# Eliminar node_modules antiguos si quedaron
find . -name "node_modules" -type d -prune -exec rm -rf {} +

# Eliminar package-lock.json si quedó
find . -name "package-lock.json" -delete
```

### 10.2 Verificar .gitignore

```bash
# Verificar que archivos correctos están ignorados
git status

# Debería mostrar solo:
# - Archivos de configuración nuevos
# - Archivos movidos
# - No debería mostrar node_modules, dist, .env
```

### 10.3 Commit de Reorganización

```bash
# Agregar todos los cambios
git add .

# Commit
git commit -m "refactor: reorganize project as fullstack monorepo

- Move backend to apps/backend/
- Initialize frontend in apps/frontend/
- Create shared-types package
- Configure pnpm workspaces
- Update documentation
- Add unified dev command

BREAKING CHANGE: Project structure changed to monorepo"

# Push
git push origin feature/monorepo-restructure
```

---

## Fase 11: Configuración Opcional - Turborepo (15 min)

### 11.1 Instalar Turbo

```bash
pnpm add -D turbo
```

### 11.2 Crear turbo.json

```bash
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "inputs": ["src/**/*.ts", "src/**/*.tsx", "test/**/*.ts"]
    },
    "test:e2e": {
      "dependsOn": ["build"],
      "cache": false
    },
    "lint": {
      "outputs": []
    },
    "format": {
      "outputs": []
    },
    "clean": {
      "cache": false
    }
  }
}
EOF
```

### 11.3 Actualizar Scripts con Turbo

```bash
# Actualizar package.json root para usar turbo
# Reemplazar "pnpm --recursive" con "turbo"
```

---

## Checklist Final

### ✅ Estructura

- [ ] Directorio `apps/backend/` creado con todo el código backend
- [ ] Directorio `apps/frontend/` creado con estructura FSD
- [ ] Directorio `packages/shared-types/` creado con tipos compartidos
- [ ] `pnpm-workspace.yaml` configurado
- [ ] Root `package.json` con scripts unificados

### ✅ Configuración

- [ ] `.gitignore` actualizado
- [ ] `README.md` principal actualizado
- [ ] READMEs individuales creados
- [ ] Variables de entorno configuradas
- [ ] Path aliases configurados

### ✅ Dependencias

- [ ] pnpm instalado globalmente
- [ ] `pnpm install` ejecutado exitosamente
- [ ] Shared types compilados
- [ ] Backend compila sin errores
- [ ] Frontend compila sin errores

### ✅ Funcionalidad

- [ ] `pnpm dev` inicia backend y frontend
- [ ] Backend responde en http://localhost:3000
- [ ] Frontend responde en http://localhost:5173
- [ ] Tests de backend pasan
- [ ] Proxy de Vite funciona correctamente

### ✅ Git

- [ ] Cambios commiteados
- [ ] Branch pusheado
- [ ] Pull request creado (opcional)

---

## Troubleshooting

### Problema: pnpm no encuentra workspace packages

**Solución:**

```bash
# Reinstalar desde cero
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

### Problema: Backend no encuentra shared-types

**Solución:**

```bash
# Build shared-types primero
pnpm --filter @packages/shared-types build

# Luego reinstalar backend
pnpm --filter backend install
```

### Problema: Frontend no compila

**Solución:**

```bash
# Verificar que todas las dependencias están instaladas
cd apps/frontend
pnpm install

# Verificar tsconfig.json
cat tsconfig.json
```

### Problema: Ports en uso

**Solución:**

```bash
# Matar procesos en puerto 3000
lsof -ti:3000 | xargs kill -9

# Matar procesos en puerto 5173
lsof -ti:5173 | xargs kill -9
```

---

## Próximos Pasos

1. **Implementar Frontend según PRD**
   - Seguir estructura FSD
   - Implementar páginas principales
   - Conectar con backend API

2. **Configurar CI/CD**
   - GitHub Actions para tests
   - Build automático
   - Deploy separado backend/frontend

3. **Optimizaciones**
   - Configurar Turborepo para builds más rápidos
   - Implementar caching
   - Optimizar bundle sizes

4. **Documentación**
   - Documentar APIs con Swagger
   - Crear guías de desarrollo
   - Documentar componentes frontend

---

**Tiempo Total Estimado:** 6-8 horas

**Dificultad:** Media

**Riesgo:** Bajo (con backups y testing adecuado)
