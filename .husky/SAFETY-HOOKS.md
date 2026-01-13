# Git Safety Hooks

Este proyecto incluye hooks de seguridad que **bloquean comandos peligrosos** para proteger el historial de Git y la calidad del código.

## 🆕 **Nueva Funcionalidad: Auto-Rebase Interactivo**

Los hooks ahora incluyen:

- ✅ **Verificación obligatoria de cambios sin commit** - No permite push con cambios sin commitear
- ✅ **Auto-rebase interactivo** - Ofrece hacer rebase automáticamente cuando tu branch está desactualizado
- ✅ **Protección contra pérdida de trabajo** - Obliga a commitear antes de cualquier operación de rebase
- ✅ **Auto-rebase en GitHub** - Los PRs se rebasean automáticamente cuando master cambia

## 🛡️ Comandos Bloqueados

### 0. **Cambios sin commit** (Nuevo - Protección contra pérdida de trabajo)

**Hooks:** `pre-checkout`, `pre-rebase`, `pre-push-safety`

**Por qué está bloqueado:**

- Previene pérdida accidental de trabajo durante operaciones de Git
- Asegura que todo el trabajo esté en el historial de Git
- Evita que cambios importantes se pierdan
- **Ahora detecta archivos untracked (nuevos archivos sin agregar a Git)** ✨

**Qué detecta:**

1. **Archivos tracked modificados** - Archivos que Git ya conoce y fueron modificados
2. **Archivos untracked** - Archivos nuevos que nunca se agregaron a Git (excepto los ignorados en `.gitignore`)

**Qué hace el hook:**

```bash
# Verifica cambios en archivos tracked
git diff-index --quiet HEAD --

# Verifica archivos untracked (nuevos)
git ls-files --others --exclude-standard

# Si hay cambios, bloquea la operación y muestra:
❌ ERROR: Uncommitted changes detected!

� BLOCKED: Cannot checkout/rebase with uncommitted changes

You have uncommitted changes in tracked files.
You have untracked files that are not committed.

📋 Current changes:
 M apps/backend/src/file.ts          # Tracked file modified
?? apps/frontend/src/new-file.tsx    # Untracked file (NEW!)

✅ OPTIONS:
   1. Commit your changes:
      git add .
      git commit -m 'feat: your description'

   2. Stash your changes temporarily (includes untracked):
      git stash --include-untracked
      # ... perform operation ...
      git stash pop

   3. Discard your changes (⚠️ IRREVERSIBLE):
      git checkout -- .  # Discard tracked changes
      git clean -fd      # Remove untracked files
```

**Características:**

- ✅ Detecta cambios staged y unstaged
- ✅ **Detecta archivos untracked (nuevos archivos)** ✨
- ✅ Respeta `.gitignore` (no detecta archivos ignorados)
- ✅ **NO permite descartar cambios** - obliga a commitear o stash
- ✅ Aplica en `git checkout`, `git rebase`, y `git push`

**Ejemplo de archivo untracked detectado:**

```bash
# Creas un archivo nuevo sin agregarlo a Git
echo "console.log('test')" > apps/frontend/src/test.ts

# Intentas cambiar de rama
git checkout master

# Output:
❌ ERROR: Uncommitted changes detected!
🚫 BLOCKED: Cannot checkout to another branch with uncommitted changes

You have untracked files that are not committed.

Current changes:
?? apps/frontend/src/test.ts

✅ OPTIONS:
   1. Commit your changes:
      git add .
      git commit -m 'feat: add test file'
```

---

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

| Hook                         | Archivo                             | Propósito                                                           |
| ---------------------------- | ----------------------------------- | ------------------------------------------------------------------- |
| `pre-commit`                 | `.husky/pre-commit`                 | Valida código antes de commit                                       |
| `pre-commit-branch-check`    | `.husky/pre-commit-branch-check`    | Bloquea commits directos en master                                  |
| `pre-push`                   | `.husky/pre-push`                   | Ejecuta tests antes de push                                         |
| `pre-push-safety`            | `.husky/pre-push-safety`            | Bloquea `git push --force` y verifica rebase                        |
| `pre-merge-commit`           | `.husky/pre-merge-commit`           | Bloquea `git pull origin master`                                    |
| `check-destructive-commands` | `.husky/check-destructive-commands` | Bloquea `rm -rf` y `git clean -fd`                                  |
| `pre-checkout`               | `.husky/pre-checkout`               | Bloquea checkout con cambios sin commitear (tracked + untracked) ✨ |
| `pre-rebase`                 | `.husky/pre-rebase`                 | Bloquea rebase con cambios sin commitear (tracked + untracked) ✨   |
| `post-checkout`              | `.husky/post-checkout`              | Advierte si master está desincronizado                              |
| `commit-msg`                 | `.husky/commit-msg`                 | Valida formato de mensajes (Conventional)                           |

✨ = Actualizado para detectar archivos untracked

---

## 🛡️ Shell Wrapper (Protección Adicional)

**Archivo:** `scripts/safe-shell-wrapper.sh`

### ¿Qué protege?

El shell wrapper intercepta comandos destructivos **antes** de que se ejecuten, incluso fuera de Git hooks:

- ✅ `git restore` - Pide confirmación antes de descartar cambios
- ✅ `git checkout --` - Pide confirmación (sintaxis antigua)
- ✅ `git clean -fd` - Pide confirmación antes de borrar archivos
- ✅ `rm -rf` - Pide confirmación en archivos del proyecto

### Instalación (Opcional pero Recomendado)

Agrega esto a tu `~/.zshrc` o `~/.bashrc`:

```bash
# Safe shell wrapper para bookings-bot
source /path/to/bookings-bot/scripts/safe-shell-wrapper.sh
```

Luego recarga tu shell:

```bash
source ~/.zshrc  # o source ~/.bashrc
```

### Ejemplo de Uso

```bash
# Intentas descartar cambios
$ git restore apps/backend/src/file.ts

⚠️  WARNING: Potentially destructive operation!
Command: git restore apps/backend/src/file.ts

This will permanently discard uncommitted changes in tracked files.

✅ Safe alternatives:
   1. Use 'git stash' to save changes temporarily
   2. Use 'git stash save "description"' with a description
   3. Use 'git diff <file>' to review changes first
   4. Use 'git commit' to save changes permanently

Are you sure you want to proceed? (y/N):
```

### Comandos Protegidos

| Comando                  | Protección                | Alternativa Sugerida                            |
| ------------------------ | ------------------------- | ----------------------------------------------- |
| `git restore <file>`     | Siempre pide confirmación | `git stash`, `git commit`                       |
| `git checkout -- <file>` | Siempre pide confirmación | `git stash`, `git commit`                       |
| `git clean -fd`          | Siempre pide confirmación | `git clean -n`, `git stash --include-untracked` |
| `rm -rf <project-file>`  | Pide confirmación         | Borrar archivos específicos sin `-rf`           |

### Ventajas del Shell Wrapper

1. **Protección universal** - Funciona en cualquier directorio del proyecto
2. **No depende de Git hooks** - Protege incluso comandos manuales
3. **Educativo** - Muestra alternativas seguras cada vez
4. **Opcional** - No interfiere si no lo instalas

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

## 🤖 Auto-Rebase (Nuevo)

### Pre-Push Auto-Rebase Interactivo

**Hook:** `pre-push-safety`

Cuando tu branch está desactualizado, el hook ofrece hacer auto-rebase:

```bash
git push origin feature/my-branch

# Output:
❌ Branch is not rebased on latest origin/master!

Current state:
  Your branch base: abc1234
  Latest master:    def5678
  Commits behind:   3

🤖 AUTO-REBASE AVAILABLE

I can automatically rebase your branch on origin/master.

⚠️  IMPORTANT:
  - Your working directory is clean (verified above)
  - If conflicts occur, you'll need to resolve them
  - After rebase, you'll need to force-push

Do you want to auto-rebase now? (y/N):
```

**Si respondes "y" (yes):**

```bash
🔄 Starting auto-rebase...

✅ Rebase successful!

📝 NEXT STEPS:
   Your branch has been rebased on origin/master.
   Now you need to push with force-with-lease:

   git push --force-with-lease origin feature/my-branch
```

**Si hay conflictos:**

```bash
❌ Rebase failed with conflicts!

🔧 CONFLICT RESOLUTION STEPS:
   1. Open conflicted files and resolve conflicts
   2. Stage resolved files: git add <files>
   3. Continue rebase: git rebase --continue
   4. If you want to abort: git rebase --abort

After resolving conflicts, push with:
   git push --force-with-lease origin feature/my-branch
```

**Si respondes "n" (no):**

```bash
🚫 BLOCKED: Manual rebase required

✅ MANUAL REBASE STEPS:
   1. git rebase origin/master
   2. # Resolve conflicts if any
   3. git push --force-with-lease origin feature/my-branch
```

---

### GitHub Auto-Rebase (PRs)

**Workflow:** `.github/workflows/auto-rebase-pr.yml`

Los PRs se rebasean automáticamente cuando:

1. **Master recibe nuevos commits** - Todos los PRs abiertos se rebasean automáticamente
2. **Comentas `/rebase` en un PR** - Ese PR específico se rebasea inmediatamente
3. **Trigger manual** - Puedes ejecutar el workflow manualmente desde GitHub Actions

**Características:**

- ✅ Solo rebasea PRs que no son draft
- ✅ Detecta conflictos y notifica en el PR
- ✅ Ejecuta CI automáticamente después del rebase
- ✅ Comenta en el PR con el resultado
- ✅ Proporciona instrucciones para pull local

**Ejemplo de comentario automático:**

````markdown
🤖 **Auto-rebase successful!**

This PR has been automatically rebased on the latest `master` branch.

- Commits behind: 3
- CI checks will run automatically

If you have local changes, pull the rebased branch:

```bash
git fetch origin
git reset --hard origin/feature/my-branch
```
````

````

**Si hay conflictos:**

```markdown
⚠️ **Auto-rebase failed**: Conflicts detected.

Please rebase manually:
```bash
git fetch origin
git rebase origin/master
# Resolve conflicts
git add <resolved-files>
git rebase --continue
git push --force-with-lease origin feature/my-branch
````

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
6. **🆕 Protege contra pérdida de trabajo:** Obliga a commitear antes de operaciones peligrosas
7. **🆕 Auto-rebase seguro:** Ofrece rebase automático solo cuando es seguro hacerlo
8. **🆕 Sincronización automática de PRs:** Mantiene PRs actualizados con master automáticamente

---

**Last Updated:** January 12, 2026
**Status:** Active ✅
```
