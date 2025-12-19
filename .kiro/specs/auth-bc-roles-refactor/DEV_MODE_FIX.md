# Dev Mode Fix - NestJS en Monorepo

## Problema

`pnpm dev:backend` (que ejecuta `nest start --watch`) fallaba con:

```
Error: Cannot find module '/Users/.../apps/backend/dist/main'
```

Mientras que `npm run start:prod` (que ejecuta `node dist/main`) funcionaba correctamente.

## Causa Raíz

El problema es la estructura de monorepo:

1. **`nest build`** genera el output en: `dist/apps/backend/src/`
2. **`nest start --watch`** busca el archivo en: `dist/main`
3. El script `postbuild` mueve los archivos, pero solo se ejecuta con `npm run build`, no durante el watch mode

## Solución

Usar **nodemon** en lugar de `nest start --watch` para desarrollo:

### 1. Configuración de nodemon (`nodemon.json`)

```json
{
  "watch": ["src"],
  "ext": "ts",
  "ignore": ["src/**/*.spec.ts"],
  "exec": "pnpm build && node dist/main.js"
}
```

### 2. Scripts actualizados (`package.json`)

```json
{
  "scripts": {
    "dev": "nodemon",
    "start:dev": "nodemon",
    "start:debug": "nodemon --inspect",
    "start:prod": "node dist/main"
  }
}
```

### 3. Configuración de NestJS CLI (`nest-cli.json`)

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "entryFile": "main",
  "compilerOptions": {
    "deleteOutDir": true,
    "tsConfigPath": "tsconfig.json",
    "webpack": false,
    "assets": []
  }
}
```

**Nota:** Removimos `"root": "src"` que causaba problemas con la estructura de monorepo.

## Ventajas de nodemon

1. ✅ **Funciona con monorepo**: Ejecuta el build completo incluyendo `postbuild`
2. ✅ **Hot reload**: Detecta cambios en archivos `.ts` y reinicia automáticamente
3. ✅ **Consistente**: Mismo comportamiento en dev y prod
4. ✅ **Debugging**: Soporte para `--inspect` flag

## Comparación

| Aspecto            | `nest start --watch`    | `nodemon`                 |
| ------------------ | ----------------------- | ------------------------- |
| **Monorepo**       | ❌ Problemas con paths  | ✅ Funciona correctamente |
| **Hot reload**     | ✅ Sí                   | ✅ Sí                     |
| **Build completo** | ❌ No ejecuta postbuild | ✅ Ejecuta postbuild      |
| **Debugging**      | ✅ `--debug` flag       | ✅ `--inspect` flag       |
| **Memoria**        | ~1.2 GB                 | ~150 MB                   |

## Comandos

```bash
# Desarrollo (con hot reload)
pnpm dev:backend

# Desarrollo con debugging
npm run start:debug

# Producción
npm run start:prod
```

## Health Endpoint

Con esta configuración, el health endpoint funciona correctamente:

```bash
curl http://localhost:3000/api/health
```

Respuesta:

```json
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

## Referencias

- [NestJS CLI vs node dist/main](https://stackoverflow.com/questions/70804471/difference-between-nest-start-and-node-dist-main-js)
- [NestJS Memory Consumption](https://www.reddit.com/r/Nestjs_framework/comments/wcfff4/can_someone_explain_to_me_the_high_memory/)
- [Nodemon Documentation](https://nodemon.io/)
