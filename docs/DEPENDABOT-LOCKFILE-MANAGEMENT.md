# Dependabot & Lockfile Management

**Gestión de dependencias y sincronización de pnpm-lock.yaml**

---

## 🎯 Problema Común

**Síntoma:** CI falla con error:

```
ERR_PNPM_OUTDATED_LOCKFILE  Cannot install with "frozen-lockfile"
because pnpm-lock.yaml is not up to date with package.json
```

**Causa:** Dependabot actualiza `package.json` pero no regenera `pnpm-lock.yaml` correctamente en monorepos.

---

## 🛡️ Prevención Automática

### 1. Hook Pre-Push (Local)

El hook `.husky/pre-push-safety` ahora valida que el lockfile esté sincronizado:

```bash
# Automáticamente verifica antes de cada push
git push origin feature/mi-rama

# Si detecta desincronización:
❌ ERROR: pnpm-lock.yaml is out of sync with package.json files!
```

**Acción:** Sigue las instrucciones del hook para corregir.

### 2. GitHub Action (CI)

El workflow `dependabot-auto-fix.yml` detecta y corrige automáticamente PRs de Dependabot:

- ✅ Detecta lockfile desincronizado
- ✅ Ejecuta `pnpm install --lockfile-only`
- ✅ Commitea el lockfile actualizado
- ✅ Comenta en el PR

**Resultado:** PRs de Dependabot se auto-corrigen sin intervención manual.

---

## 🔧 Corrección Manual

### Opción 1: Localmente (Recomendado)

```bash
# 1. Checkout al PR de Dependabot
gh pr checkout 412

# 2. Actualizar lockfile
pnpm install

# 3. Verificar cambios
git diff pnpm-lock.yaml

# 4. Commitear
git add pnpm-lock.yaml
git commit -m "chore: update pnpm-lock.yaml"

# 5. Push
git push
```

### Opción 2: Script de Verificación

```bash
# Verificar si el lockfile está sincronizado
bash scripts/check-lockfile-sync.sh

# Si está desincronizado, seguir instrucciones
```

### Opción 3: Vía GitHub UI

1. Ir al PR de Dependabot
2. Esperar a que el workflow `dependabot-auto-fix.yml` se ejecute
3. El lockfile se actualizará automáticamente
4. Mergear el PR normalmente

---

## 📋 Workflow Recomendado

### Para PRs de Dependabot

```bash
# 1. Esperar a que GitHub Action auto-corrija (5-10 min)
# 2. Verificar que CI pase
# 3. Mergear el PR

# Si GitHub Action falla o no se ejecuta:
gh pr checkout <PR-NUMBER>
pnpm install
git add pnpm-lock.yaml
git commit -m "chore: update pnpm-lock.yaml"
git push
```

### Para Cambios Manuales de Dependencias

```bash
# 1. Modificar package.json
vim apps/backend/package.json

# 2. Actualizar lockfile INMEDIATAMENTE
pnpm install

# 3. Commitear AMBOS archivos juntos
git add apps/backend/package.json pnpm-lock.yaml
git commit -m "chore: add new dependency"

# 4. Push (hook validará sincronización)
git push origin feature/mi-rama
```

---

## 🚫 Anti-Patterns a Evitar

### ❌ NO hacer:

```bash
# Modificar package.json sin actualizar lockfile
vim apps/backend/package.json
git add apps/backend/package.json
git commit -m "add dependency"
git push  # ❌ Hook bloqueará

# Saltarse validación
git push --no-verify  # ❌ Prohibido

# Mergear PR de Dependabot sin verificar CI
# ❌ Puede romper CI de otros PRs
```

### ✅ SÍ hacer:

```bash
# Siempre actualizar lockfile después de cambios
vim apps/backend/package.json
pnpm install  # ✅ Actualiza lockfile
git add apps/backend/package.json pnpm-lock.yaml
git commit -m "chore: add dependency"

# Verificar antes de push
bash scripts/check-lockfile-sync.sh  # ✅ Validación manual
git push  # ✅ Hook validará automáticamente

# Esperar a que CI pase antes de mergear
# ✅ Garantiza que el lockfile es correcto
```

---

## 🔍 Debugging

### Verificar Estado del Lockfile

```bash
# Opción 1: Script de verificación
bash scripts/check-lockfile-sync.sh

# Opción 2: Comando pnpm directo
pnpm install --lockfile-only --frozen-lockfile

# Opción 3: Ver diferencias
pnpm install --lockfile-only
git diff pnpm-lock.yaml
```

### Identificar Qué Package.json Cambió

```bash
# Ver todos los package.json modificados
git diff --name-only origin/master | grep package.json

# Ver cambios específicos
git diff origin/master apps/backend/package.json
```

### Regenerar Lockfile Completamente

```bash
# ⚠️ Solo si el lockfile está corrupto
rm pnpm-lock.yaml
pnpm install
git add pnpm-lock.yaml
git commit -m "chore: regenerate pnpm-lock.yaml"
```

---

## 📊 Configuración de Dependabot

### Agrupación de Dependencias

Para reducir PRs y problemas de lockfile, Dependabot agrupa dependencias relacionadas:

```yaml
# .github/dependabot.yml
groups:
  nestjs:
    patterns:
      - "@nestjs/*"
  react:
    patterns:
      - "react*"
      - "@types/react*"
```

**Beneficio:** Un solo PR para todas las actualizaciones de NestJS, reduciendo conflictos de lockfile.

---

## ✅ Checklist de Dependencias

### Antes de Commitear

- [ ] Modifiqué `package.json`
- [ ] Ejecuté `pnpm install`
- [ ] Verifiqué `git diff pnpm-lock.yaml`
- [ ] Incluí `pnpm-lock.yaml` en el commit
- [ ] CI pasó exitosamente

### Antes de Mergear PR de Dependabot

- [ ] CI pasó (todos los checks verdes)
- [ ] Lockfile está actualizado (verificar commits)
- [ ] No hay conflictos con master
- [ ] GitHub Action se ejecutó correctamente (si aplica)

---

## 🎓 Educación del Equipo

### Regla de Oro

> **Siempre que modifiques `package.json`, ejecuta `pnpm install` inmediatamente.**

### Por Qué Importa

1. **CI Consistency:** Garantiza que CI pueda instalar dependencias
2. **Reproducibilidad:** Todos los devs tienen las mismas versiones
3. **Seguridad:** Lockfile incluye checksums de integridad
4. **Velocidad:** Instalaciones más rápidas con lockfile actualizado

---

## 📈 Métricas de Éxito

### Semana 1

- [ ] 0 PRs bloqueados por lockfile desincronizado
- [ ] 100% de PRs de Dependabot auto-corregidos
- [ ] 0 merges manuales de lockfile

### Mes 1

- [ ] Equipo familiarizado con el workflow
- [ ] 0 incidentes de CI por lockfile
- [ ] Dependencias actualizadas semanalmente

---

**Última Actualización:** January 12, 2026  
**Status:** ✅ Activo  
**Enforcement:** 🔒 Strict Mode (Pre-Push Hook)
