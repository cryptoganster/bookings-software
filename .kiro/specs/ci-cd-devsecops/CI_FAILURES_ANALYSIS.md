# Análisis de Fallos en CI/CD

**Fecha:** 18 de Diciembre, 2024  
**Run ID:** 20344441841  
**Commit:** Último merge a main

---

## 🔴 Problemas Identificados

### 1. CodeQL Workflow - Path no existe

**Error:**
```
Error: Path does not exist: ../results
```

**Ubicación:** `.github/workflows/codeql.yml` - Step "Perform CodeQL Analysis"

**Causa Raíz:**
El workflow de CodeQL está configurado incorrectamente. La acción `github/codeql-action/analyze@v2` está intentando subir resultados desde una ruta relativa `../results` que no existe.

**Análisis:**
- CodeQL genera automáticamente los resultados en su propia ubicación interna
- No necesitamos especificar manualmente la ruta de resultados
- El parámetro `sarif_file: ../results` está mal configurado

**Solución:**
Eliminar la configuración manual de `sarif_file`. CodeQL maneja esto automáticamente.

---

### 2. CI Workflow - pnpm-lock.yaml ausente en repositorio

**Error:**
```
ERR_PNPM_NO_LOCKFILE  Cannot install with "frozen-lockfile" because pnpm-lock.yaml is absent
```

**Ubicación:** `.github/workflows/ci.yml` - Step "Install dependencies"

**Causa Raíz:**
El archivo `pnpm-lock.yaml` existe localmente pero NO está commiteado al repositorio Git.

**Verificación Local:**
```bash
$ ls -la | grep pnpm-lock
-rw-r--r--@  1 user  staff  407921 Dec 17 00:12 pnpm-lock.yaml
```

**Análisis:**
- El archivo existe localmente (407KB, última modificación 17 de Diciembre)
- ✅ **CONFIRMADO:** `pnpm-lock.yaml` está en `.gitignore` (línea 11)
- El CI usa `--frozen-lockfile` que requiere el archivo para garantizar instalaciones determinísticas
- **Esto es un ERROR de configuración** - los lockfiles NUNCA deben estar en .gitignore

**Solución:**
1. ✅ Remover `pnpm-lock.yaml` de `.gitignore`
2. Agregar el archivo al repositorio: `git add pnpm-lock.yaml`
3. Commitear: `git commit -m "fix(ci): remove pnpm-lock.yaml from .gitignore for deterministic builds"`

---

## 📊 Estado de los Workflows

### CodeQL Workflow
- ❌ **Fallo:** Path no existe
- 🔧 **Fix:** Remover configuración manual de sarif_file
- ⏱️ **Tiempo estimado:** 5 minutos

### CI Workflow  
- ❌ **Fallo:** pnpm-lock.yaml ausente
- 🔧 **Fix:** Commitear pnpm-lock.yaml
- ⏱️ **Tiempo estimado:** 2 minutos

---

## 🛠️ Plan de Corrección

### Paso 1: Remover pnpm-lock.yaml de .gitignore

**Archivo:** `.gitignore` línea 11

**Cambio:**
```diff
# pnpm
.pnpm-store/
.pnpm-debug.log
- pnpm-lock.yaml
```

### Paso 2: Agregar pnpm-lock.yaml al repositorio
```bash
# Agregar el archivo
git add pnpm-lock.yaml

# Verificar que se agregó
git status

# Commitear
git commit -m "chore: add pnpm-lock.yaml for deterministic CI builds"
```

### Paso 3: Corregir CodeQL Workflow
Editar `.github/workflows/codeql.yml`:

**Antes:**
```yaml
- name: Perform CodeQL Analysis
  uses: github/codeql-action/analyze@v2
  with:
    category: "/language:${{ matrix.language }}"
    fail-on: critical,high
    sarif_file: ../results  # ❌ INCORRECTO
```

**Después:**
```yaml
- name: Perform CodeQL Analysis
  uses: github/codeql-action/analyze@v2
  with:
    category: "/language:${{ matrix.language }}"
    # CodeQL maneja automáticamente la ubicación de resultados
```

### Paso 4: Push y Verificar
```bash
# Push de los cambios
git push origin main

# Monitorear el workflow
# https://github.com/cryptoganster/bookings-software/actions
```

---

## ✅ Criterios de Éxito

### CodeQL Workflow
- [ ] Workflow completa sin errores
- [ ] Resultados aparecen en Security tab
- [ ] No hay vulnerabilidades críticas/altas

### CI Workflow
- [ ] `pnpm install --frozen-lockfile` ejecuta exitosamente
- [ ] Todos los jobs (lint, test, build) pasan
- [ ] Coverage reports se generan correctamente

---

## 📝 Notas Adicionales

### ¿Por qué pnpm-lock.yaml es importante?

1. **Determinismo:** Garantiza que todos (dev, CI, producción) instalen exactamente las mismas versiones
2. **Seguridad:** Previene ataques de dependency confusion
3. **Performance:** pnpm puede usar el lockfile para instalaciones más rápidas
4. **Debugging:** Facilita reproducir bugs relacionados con dependencias

### ¿Por qué --frozen-lockfile en CI?

- Previene instalaciones no determinísticas
- Falla rápido si hay inconsistencias entre package.json y lockfile
- Es la mejor práctica para CI/CD

### Alternativas (NO RECOMENDADAS)

❌ Cambiar a `pnpm install --no-frozen-lockfile`
- Pierde determinismo
- Puede instalar versiones diferentes en cada run
- Dificulta debugging

❌ Usar `npm` en lugar de `pnpm`
- Pierde beneficios de pnpm (velocidad, espacio en disco)
- Requiere reescribir todos los scripts

---

## 🔗 Referencias

- [pnpm Lockfile](https://pnpm.io/git#lockfiles)
- [GitHub CodeQL Action](https://github.com/github/codeql-action)
- [CI Best Practices](https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs)

---

## 📅 Timeline

| Acción | Tiempo Estimado | Responsable |
|--------|-----------------|-------------|
| Verificar .gitignore | 2 min | Dev |
| Agregar pnpm-lock.yaml | 3 min | Dev |
| Corregir CodeQL workflow | 5 min | Dev |
| Push y verificar | 10 min | CI/CD |
| **Total** | **20 min** | - |

---

**Estado:** 🔴 Pendiente de corrección  
**Prioridad:** 🔥 Alta (bloquea CI/CD)  
**Impacto:** Todos los merges a main/develop fallan
