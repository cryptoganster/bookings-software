# Git Safety Hooks

Este proyecto incluye hooks de seguridad que **bloquean comandos peligrosos** para proteger el historial de Git y la calidad del código.

## 🛡️ Comandos Bloqueados

### 1. `git pull origin master` (Crea merge commits innecesarios)

**Hook:** `pre-merge-commit`

**Por qué está bloqueado:**

- Crea merge commits de sincronización que ensucian el historial
- Dificulta hacer `git bisect` y encontrar bugs
- No es compatible con la estrategia de rebase del proyecto

**Alternativa correcta:**

```bash
# Para sincronizar tu rama master local
git checkout master
git fetch origin
git reset --hard origin/master

# Para actualizar tu feature branch
git checkout feature/mi-rama
git fetch origin
git rebase origin/master
```

**Qué hace el hook:**

- Detecta si estás intentando hacer merge desde `origin/master`
- Bloquea el commit de merge
- Muestra el comando correcto a usar

---

### 2. `git push --force` (Peligroso, puede sobrescribir trabajo)

**Hook:** `pre-push-safety`

**Por qué está bloqueado:**

- Puede sobrescribir cambios de otros desarrolladores
- No verifica si hay commits remotos que no has visto
- Es destructivo e irreversible

**Alternativa correcta:**

```bash
# Usar --force-with-lease (seguro)
git push --force-with-lease origin feature/mi-rama
```

**Diferencia:**

- `--force`: Sobrescribe sin verificar
- `--force-with-lease`: Solo sobrescribe si no hay cambios remotos nuevos

**Qué hace el hook:**

- Detecta intentos de force push
- Bloquea el push
- Recomienda usar `--force-with-lease`

---

### 3. `rm -rf` y comandos destructivos (Elimina archivos sin posibilidad de recuperación)

**Hook:** `check-destructive-commands`

**Por qué está bloqueado:**

- Elimina permanentemente archivos sin posibilidad de recuperación
- Puede borrar trabajo no commiteado (untracked files)
- Git no puede recuperar archivos que nunca fueron trackeados
- Errores humanos pueden causar pérdida de horas de trabajo

**Alternativas correctas:**

```bash
# Para descartar cambios en archivos trackeados
git restore <file>
git restore .

# Para guardar cambios temporalmente
git stash
git stash --include-untracked  # Incluye archivos untracked

# Para limpiar archivos untracked (con preview primero)
git clean -n  # Preview de lo que se eliminará
git stash --include-untracked  # Guardar antes de limpiar
git clean -fd  # Solo después de verificar con -n
```

**Qué hace el hook:**

- Detecta comandos `rm -rf` o `rm -f` en archivos del proyecto
- Detecta `git clean -fd` sin preview previo
- Permite eliminar carpetas de build (node_modules, dist, coverage)
- Bloquea eliminación de código fuente y archivos de configuración

---

### 4. `git commit --no-verify` (Salta validaciones críticas)

**Hook:** `pre-commit` + documentación

**Por qué está bloqueado:**

- Salta ESLint, Prettier, TypeScript
- Salta tests unitarios e integración
- Salta escaneo de secretos y límites de tamaño
- Introduce código roto que falla en CI

**No hay alternativa:** Debes corregir los errores

**Validaciones que se saltan:**

1. **Branch check:** Commits directos en master (NUEVO)
2. **ESLint:** Errores de código y malas prácticas
3. **Prettier:** Formato inconsistente
4. **TypeScript:** Errores de tipos
5. **Tests:** Funcionalidad rota
6. **Secret scanning:** API keys expuestas
7. **File size:** Archivos demasiado grandes

**Qué hacer si el hook falla:**

```bash
# 1. Leer el error
git commit -m "feat: nueva funcionalidad"
# Hook muestra el error específico

# 2. Corregir el problema
pnpm lint --fix
pnpm format
pnpm typecheck
pnpm test

# 3. Intentar de nuevo
git add .
git commit -m "feat: nueva funcionalidad"
```

---

## 📋 Hooks Instalados

| Hook                         | Archivo                             | Propósito                                    |
| ---------------------------- | ----------------------------------- | -------------------------------------------- |
| `pre-commit`                 | `.husky/pre-commit`                 | Valida código antes de commit                |
| `pre-commit-branch-check`    | `.husky/pre-commit-branch-check`    | Bloquea commits directos en master (NUEVO)   |
| `pre-push`                   | `.husky/pre-push`                   | Ejecuta tests antes de push                  |
| `pre-push-safety`            | `.husky/pre-push-safety`            | Bloquea `git push --force` y verifica rebase |
| `pre-merge-commit`           | `.husky/pre-merge-commit`           | Bloquea `git pull origin master`             |
| `check-destructive-commands` | `.husky/check-destructive-commands` | Bloquea `rm -rf` y `git clean -fd` (NUEVO)   |
| `pre-checkout`               | `.husky/pre-checkout`               | Bloquea checkout con cambios sin commitear   |
| `post-checkout`              | `.husky/post-checkout`              | Advierte si master está desincronizado       |
| `commit-msg`                 | `.husky/commit-msg`                 | Valida formato de mensajes (Conventional)    |

---

## 🚨 Casos de Emergencia

### "Necesito hacer push urgente y el hook falla"

**❌ NO HACER:**

```bash
git push --no-verify  # BLOQUEADO
```

**✅ HACER:**

1. Identificar qué validación falla
2. Corregir el problema específico
3. Hacer push normal

**Si es un error del hook (muy raro):**

1. Reportar al equipo inmediatamente
2. Crear un hotfix para el hook
3. Nunca usar `--no-verify` como workaround

### "El hook está roto y bloquea todo"

**Pasos:**

1. Verificar que el problema es del hook, no de tu código
2. Revisar `.husky/` para identificar el hook problemático
3. Crear un issue en GitHub con detalles
4. Temporalmente, puedes comentar la línea problemática en el hook
5. Crear un PR para arreglar el hook

**Ejemplo:**

```bash
# En .husky/pre-commit, comentar temporalmente:
# bash scripts/pre-commit-secrets.sh  # TEMPORALMENTE DESHABILITADO - Issue #123
```

---

## 🔧 Cómo Funcionan los Hooks

### 1. Pre-merge-commit

```bash
# Detecta merge desde origin/master
if [[ "$merge_branch" == *"origin/master"* ]]; then
  echo "❌ ERROR: Merge commit from 'origin/master' detected!"
  exit 1
fi
```

### 2. Pre-push-safety

```bash
# Detecta force push comparando SHAs
if ! git merge-base --is-ancestor "$remote_sha" "$local_sha"; then
  echo "❌ ERROR: Force push detected!"
  exit 1
fi
```

### 3. Pre-commit (existente)

```bash
# Ejecuta validaciones
pnpm exec lint-staged  # ESLint, Prettier, TypeScript
bash scripts/pre-commit-secrets.sh
bash scripts/pre-commit-filesize.sh
```

---

## 🧪 Probar los Hooks

### Probar bloqueo de `rm -rf` en archivos del proyecto

```bash
# Esto debería fallar
rm -rf infra/github/ENFORCE-REBASE-ONLY.md

# Salida esperada:
# ❌ ERROR: Destructive file operation detected!
# 🚫 BLOCKED OPERATION: rm -rf infra/github/ENFORCE-REBASE-ONLY.md
```

### Probar bloqueo de `git clean -fd`

```bash
# Esto debería fallar
git clean -fd

# Salida esperada:
# ❌ ERROR: Destructive git clean detected!
# 🚫 BLOCKED OPERATION: git clean -fd
```

### Probar bloqueo de `git pull origin master`

```bash
# Esto debería fallar
git checkout master
git pull origin master

# Salida esperada:
# ❌ ERROR: Merge commit from 'origin/master' detected!
# 🚫 BLOCKED OPERATION: git pull origin master
```

### Probar bloqueo de `git push --force`

```bash
# Esto debería fallar
git push --force origin feature/test

# Salida esperada:
# ❌ ERROR: Force push detected!
# 🚫 BLOCKED OPERATION: git push --force
```

### Probar bloqueo de `--no-verify`

```bash
# Esto debería fallar
git commit --no-verify -m "test"

# Salida esperada:
# ❌ ERROR: --no-verify flag detected!
# 🚫 BLOCKED OPERATION: git commit/push --no-verify
```

---

## 📚 Referencias

- **Git Workflow:** `.kiro/steering/60-git-workflow.md`
- **Development Workflow:** `.kiro/steering/62-development-workflow.md`
- **Husky Documentation:** https://typicode.github.io/husky/

---

## ✅ Beneficios de los Safety Hooks

1. **Previene errores costosos:** Bloquea comandos destructivos antes de que causen daño
2. **Mantiene historial limpio:** Evita merge commits innecesarios
3. **Protege el trabajo del equipo:** Previene sobrescritura accidental
4. **Fuerza buenas prácticas:** Obliga a usar comandos seguros
5. **Educación continua:** Mensajes de error enseñan el comando correcto

---

**Last Updated:** January 12, 2026  
**Status:** Active ✅
