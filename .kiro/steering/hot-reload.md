---
inclusion: always
---

# Hot Reload y Desarrollo en Tiempo Real

Este documento explica cómo funcionan los servidores de desarrollo y el hot reload en el proyecto.

## Servidores de Desarrollo

### Backend (NestJS)

**Comando:** `pnpm dev:backend` o `npm run start:dev`

**Implementación:** Usa **nodemon** en lugar de `nest start --watch` para compatibilidad con monorepo.

**Características:**

- Hot reload automático detectando cambios en archivos `.ts`
- Ejecuta build completo (incluyendo `postbuild`) en cada cambio
- Recompila y reinicia automáticamente
- No requiere reinicio manual
- Menor consumo de memoria (~150 MB vs ~1.2 GB)

**Configuración (`nodemon.json`):**

```json
{
  "watch": ["src"],
  "ext": "ts",
  "ignore": ["src/**/*.spec.ts"],
  "exec": "pnpm build && node dist/main.js"
}
```

**Logs típicos:**

```
[nodemon] starting `pnpm build && node dist/main.js`
Application is running on: http://127.0.0.1:3000
[2025-12-18 09:16:36.060 -0400] INFO: Nest application successfully started
```

**Nota importante:**

- Nodemon ejecuta el build completo en cada cambio, lo que toma ~5-10 segundos
- Esto es más lento que `nest start --watch` pero garantiza consistencia con producción
- El servidor se reinicia completamente en cada cambio

### Frontend (Vite + React)

**Comando:** `pnpm dev:frontend` o `npm run dev`

**Características:**

- Hot Module Replacement (HMR) ultra-rápido (~200ms)
- Actualización instantánea sin recargar la página completa
- Preserva el estado de React cuando es posible
- No requiere reinicio manual

**Logs típicos:**

```
🚀 FRONTEND is running on: http://localhost:5173
```

## Reglas de Trabajo con Hot Reload

### ✅ Hacer

1. **Iniciar servidores una sola vez**

   ```bash
   # Iniciar ambos servidores
   pnpm dev

   # O individualmente
   pnpm dev:backend
   pnpm dev:frontend
   ```

2. **Asumir que los servidores están corriendo**
   - Una vez iniciados, los servidores permanecen activos
   - Los cambios de código se aplican automáticamente
   - No es necesario reiniciar después de cada cambio

3. **Confiar en el hot reload**
   - Backend: Recompila y reinicia automáticamente
   - Frontend: Actualiza módulos en caliente (HMR)
   - Los cambios se reflejan en segundos

4. **Verificar logs solo cuando hay errores**
   - Si algo no funciona, revisar los logs
   - Buscar mensajes de error en rojo
   - Verificar que la compilación fue exitosa

### ❌ Evitar

1. **No reiniciar servidores innecesariamente**

   ```bash
   # ❌ No hacer esto después de cada cambio
   Ctrl+C
   pnpm dev
   ```

2. **No asumir que el servidor se detuvo**
   - Si los logs del frontend desaparecen después de un cambio en el backend, el frontend sigue corriendo
   - El mensaje de compilación del backend puede ocultar logs anteriores
   - Verificar en el navegador: http://localhost:5173

3. **No esperar a que termine la compilación para hacer más cambios**
   - Puedes seguir editando mientras compila
   - Los cambios se acumularán y se aplicarán

## Cuándo Reiniciar

### Backend

Reiniciar solo cuando:

- ✅ Cambias variables de entorno (`.env`)
- ✅ Instalas nuevas dependencias (`pnpm add`)
- ✅ Cambias configuración de NestJS (`nest-cli.json`, `nodemon.json`)
- ✅ Hay un error fatal que detiene el servidor

**No reiniciar cuando:**

- ❌ Cambias código TypeScript (`.ts`) - nodemon lo detecta automáticamente
- ❌ Agregas nuevos archivos - nodemon los incluye automáticamente
- ❌ Modificas imports - nodemon recompila automáticamente

### Frontend

Reiniciar solo cuando:

- ✅ Cambias variables de entorno (`.env`)
- ✅ Instalas nuevas dependencias (`pnpm add`)
- ✅ Cambias configuración de Vite (`vite.config.ts`)
- ✅ Hay un error fatal que detiene el servidor

**No reiniciar cuando:**

- ❌ Cambias código TypeScript/React (`.ts`, `.tsx`)
- ❌ Cambias estilos CSS
- ❌ Agregas nuevos componentes
- ❌ Modificas imports

## Verificar que los Servidores Están Corriendo

### Método 1: Verificar en el navegador

```bash
# Backend
curl http://localhost:3000/health

# Frontend
# Abrir http://localhost:5173 en el navegador
```

### Método 2: Verificar procesos

```bash
# Ver procesos de Node.js
ps aux | grep node

# Ver qué está usando los puertos
lsof -i :3000  # Backend
lsof -i :5173  # Frontend
```

### Método 3: Logs del proceso

Si estás usando un gestor de procesos o terminal, verifica que los logs sigan apareciendo cuando haces cambios.

## Troubleshooting

### Problema: "Los cambios no se reflejan"

**Solución:**

1. Verificar que el archivo se guardó correctamente
2. Revisar los logs para errores de compilación
3. Hacer hard refresh en el navegador (Cmd+Shift+R en Mac, Ctrl+Shift+R en Windows)
4. Si persiste, reiniciar el servidor

### Problema: "Error de compilación"

**Solución:**

1. Leer el mensaje de error en los logs
2. Corregir el error en el código
3. Guardar el archivo
4. El servidor recompilará automáticamente

### Problema: "El servidor se detuvo"

**Solución:**

1. Verificar los logs para ver el error que causó la detención
2. Corregir el error
3. Reiniciar el servidor: `pnpm dev:backend` o `pnpm dev:frontend`

### Problema: "Los logs del frontend desaparecieron"

**Explicación:**

- Esto es normal cuando el backend recompila
- El mensaje de compilación del backend puede ocultar logs anteriores
- El frontend sigue corriendo en http://localhost:5173

**Verificación:**

```bash
# Verificar que el frontend responde
curl -s http://localhost:5173 | head -5
```

## Performance del Hot Reload

### Backend (NestJS con nodemon)

- **Tiempo de build completo:** ~5-8 segundos
- **Reinicio del servidor:** ~1-2 segundos
- **Total:** ~6-10 segundos por cambio
- **Ventaja:** Build completo garantiza consistencia con producción

### Frontend (Vite)

- **HMR:** ~100-300ms
- **Actualización en navegador:** Instantánea
- **Total:** < 1 segundo por cambio

## Best Practices

1. **Mantener los servidores corriendo durante toda la sesión de desarrollo**
2. **Hacer cambios incrementales y verificar en el navegador**
3. **Confiar en el hot reload para la mayoría de los cambios**
4. **Reiniciar solo cuando sea absolutamente necesario**
5. **Usar los logs para detectar errores, no para confirmar que el servidor está corriendo**

## Comandos Útiles

```bash
# Iniciar ambos servidores en paralelo
pnpm dev

# Iniciar solo backend
pnpm dev:backend

# Iniciar solo frontend
pnpm dev:frontend

# Verificar que los servidores responden
curl http://localhost:3000/health  # Backend
curl http://localhost:5173          # Frontend

# Ver logs en tiempo real (si usas pm2 u otro gestor)
pm2 logs backend
pm2 logs frontend
```

## Resumen

**Regla de oro:** Una vez que inicias los servidores con `pnpm dev`, déjalos corriendo. El hot reload se encargará de aplicar tus cambios automáticamente. Solo reinicia cuando cambies configuración, dependencias, o variables de entorno.

Esto mejora significativamente la velocidad de desarrollo y reduce interrupciones en el flujo de trabajo.
