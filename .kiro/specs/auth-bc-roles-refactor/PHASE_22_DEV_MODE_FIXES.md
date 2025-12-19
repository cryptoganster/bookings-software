# Phase 22 - Dev Mode Fixes Summary

## Problema Identificado

Al ejecutar `pnpm dev:backend`, el servidor fallaba con:

```
Error: Cannot find module '/Users/.../apps/backend/dist/main'
```

Sin embargo, `npm run start:prod` funcionaba correctamente.

## Análisis

### Causa Raíz

La estructura de monorepo causaba un desajuste entre:

- **Output de `nest build`**: `dist/apps/backend/src/`
- **Expectativa de `nest start --watch`**: `dist/main`

El script `postbuild` mueve los archivos correctamente, pero solo se ejecuta con `npm run build`, no durante el watch mode de NestJS CLI.

### Comparación de Comandos

| Comando                       | Herramienta | Build     | Postbuild | Resultado   |
| ----------------------------- | ----------- | --------- | --------- | ----------- |
| `npm run start:prod`          | Node.js     | ✅ Manual | ✅ Sí     | ✅ Funciona |
| `pnpm dev:backend` (antes)    | NestJS CLI  | ✅ Watch  | ❌ No     | ❌ Falla    |
| `npm run start:dev` (antes)   | NestJS CLI  | ✅ Watch  | ❌ No     | ❌ Falla    |
| `npm run start:dev` (después) | nodemon     | ✅ Watch  | ✅ Sí     | ✅ Funciona |

## Solución Implementada

### 1. Actualizar `package.json`

**Cambios:**

```json
{
  "scripts": {
    "dev": "nodemon",
    "start:dev": "nodemon", // ← Cambio: era "nest start --watch"
    "start:debug": "nodemon --inspect", // ← Cambio: era "nest start --debug --watch"
    "start:prod": "node dist/main" // ← Cambio: era "node dist/apps/backend/src/main"
  }
}
```

### 2. Configuración de nodemon (`nodemon.json`)

Ya existía y estaba correctamente configurado:

```json
{
  "watch": ["src"],
  "ext": "ts",
  "ignore": ["src/**/*.spec.ts"],
  "exec": "pnpm build && node dist/main.js"
}
```

### 3. Actualizar `nest-cli.json`

**Cambio:**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "entryFile": "main",
  // ← Removido: "root": "src" (causaba problemas con monorepo)
  "compilerOptions": {
    "deleteOutDir": true,
    "tsConfigPath": "tsconfig.json",
    "webpack": false,
    "assets": []
  }
}
```

## Ventajas de la Solución

### ✅ Ventajas de nodemon

1. **Compatibilidad con monorepo**: Ejecuta el build completo incluyendo `postbuild`
2. **Consistencia**: Mismo comportamiento en dev y prod
3. **Hot reload**: Detecta cambios y reinicia automáticamente
4. **Menor memoria**: ~150 MB vs ~1.2 GB de `nest start --watch`
5. **Debugging**: Soporte para `--inspect` flag

### ⚠️ Trade-offs

1. **Velocidad**: ~6-10 segundos por cambio vs ~2-5 segundos con `nest start --watch`
2. **Build completo**: Más lento pero más confiable

## Verificación

### Health Endpoint

Ahora funciona correctamente:

```bash
$ curl http://localhost:3000/api/health
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    }
  }
}
```

### Logs del Servidor

```
[nodemon] 3.1.11
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): src/**/*
[nodemon] watching extensions: ts
[nodemon] starting `pnpm build && node dist/main.js`

Application is running on: http://127.0.0.1:3000
[2025-12-18 09:16:36.060 -0400] INFO: Nest application successfully started
```

## Archivos Modificados

1. ✅ `apps/backend/package.json` - Scripts actualizados
2. ✅ `apps/backend/nest-cli.json` - Removido `"root": "src"`
3. ✅ `.kiro/steering/hot-reload.md` - Documentación actualizada
4. ✅ `.kiro/specs/auth-bc-roles-refactor/DEV_MODE_FIX.md` - Documentación técnica

## Comandos Actualizados

```bash
# Desarrollo (con hot reload)
pnpm dev:backend
# o
npm run start:dev

# Desarrollo con debugging
npm run start:debug

# Producción
npm run start:prod
```

## Referencias

- [Stack Overflow: nest start vs node dist/main](https://stackoverflow.com/questions/70804471/difference-between-nest-start-and-node-dist-main-js)
- [Reddit: NestJS Memory Consumption](https://www.reddit.com/r/Nestjs_framework/comments/wcfff4/can_someone_explain_to_me_the_high_memory/)
- [Nodemon Documentation](https://nodemon.io/)

## Próximos Pasos

1. ✅ Verificar que el backend funciona en dev mode
2. ✅ Verificar que el health endpoint responde
3. ⏳ Ejecutar tests de Playwright para verificar funcionalidad completa
4. ⏳ Investigar el timeout del frontend en los tests
