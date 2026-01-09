---
inclusion: fileMatch
fileMatchPattern: ".git/**/*,**/*.md"
---

# Git & GitHub Workflow

**Git workflow with Pull Requests and branch protection**

> **Cross-References:**
>
> - [61-monorepo-commands.md](./61-monorepo-commands.md) - PNPM commands
> - [62-development-workflow.md](./62-development-workflow.md) - Development workflow

---

# Git y GitHub Workflow - Con PRs y Rulesets

Flujo de trabajo limpio con Pull Requests obligatorios y rulesets de GitHub.

## Filosofía

**MÁXIMA LIMPIEZA Y TRAZABILIDAD:** Solo `master` en remoto, `feature/*` branches locales y remotas, **PRs obligatorios**, rulesets bloquean pushes directos a master, CI valida todo antes de merge.

## Estructura de Ramas

| Ubicación           | Ramas                                                  | Propósito                                                    |
| ------------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| **Remoto (GitHub)** | `master`                                               | Única rama principal, código estable, protegida por rulesets |
| **Remoto (GitHub)** | `feature/*`, `fix/*`, `refactor/*`, `docs/*`, `test/*` | Ramas de trabajo, temporales                                 |
| **Local**           | `master`                                               | Rama principal (trackea origin/master)                       |
| **Local**           | `feature/*`, `fix/*`, `refactor/*`, `docs/*`, `test/*` | Ramas de trabajo, temporales                                 |

**Ejemplos:** `feature/bc-offering`, `fix/appointment-validation`, `refactor/repository-pattern`

## Rulesets Activos en GitHub

**Branch Protection Rules:**

- ✅ **Bloquea push directo a `master`** - Todos los cambios deben ir por PR
- ✅ **Bloquea creación de branches `dev`, `develop`, `development`** - Evita confusión
- ✅ **Requiere PR review** (opcional, pero recomendado)
- ✅ **Requiere que CI pase** antes de mergear
- ✅ **Requiere que branch esté actualizado** con master antes de mergear

## Setup Inicial (Una vez)

```bash
# 1. Clonar
git clone https://github.com/cryptoganster/bookings-software.git
cd bookings-software

# 2. Configurar usuario
git config user.name "Tu Nombre"
git config user.email "tu@email.com"

# 3. Verificar que estás en master
git branch -vv
# Debe mostrar: master tracking origin/master
```

## Workflow Diario

| Paso                 | Comando                                                           | Descripción                                 |
| -------------------- | ----------------------------------------------------------------- | ------------------------------------------- |
| **1. Sincronizar**   | `git checkout master && git pull origin master`                   | Traer cambios remotos a local               |
| **2. Crear feature** | `git checkout -b feature/nombre-descriptivo`                      | Crear rama de trabajo                       |
| **3. Trabajar**      | `git add . && git commit -m "feat: descripción"`                  | Commitear cambios con mensajes descriptivos |
| **4. Push a remoto** | `git push origin feature/nombre-descriptivo`                      | Subir rama a GitHub                         |
| **5. Crear PR**      | Desde GitHub UI o `gh pr create --base master`                    | Crear Pull Request                          |
| **6. CI corre**      | Automático                                                        | Lint, tests, build, format                  |
| **7. Mergear**       | Desde GitHub UI o `gh pr merge`                                   | Mergear PR a master (si CI pasa)            |
| **8. Limpiar local** | `git checkout master && git pull && git branch -d feature/nombre` | Actualizar local y eliminar rama            |

## Convenciones de Commit

**Formato:** `<tipo>: <descripción corta>` o `<tipo>(scope): <descripción>`

| Tipo       | Uso                 | Ejemplo                                      |
| ---------- | ------------------- | -------------------------------------------- |
| `feat`     | Nueva funcionalidad | `feat: add appointment cancellation`         |
| `fix`      | Corrección de bug   | `fix: resolve concurrency issue`             |
| `refactor` | Refactorización     | `refactor: extract mapper to separate class` |
| `test`     | Tests               | `test: add property tests for appointment`   |
| `docs`     | Documentación       | `docs: update API documentation`             |
| `style`    | Formato             | `style: format code with prettier`           |
| `perf`     | Performance         | `perf: optimize query with index`            |
| `chore`    | Mantenimiento       | `chore: update dependencies`                 |

**✅ Buenos:** `feat(booking): implement appointment aggregate`, `fix: handle ConcurrencyException`  
**❌ Malos:** `changes`, `fix bug`, `update`, `WIP`

## Checklist Pre-Push

Antes de hacer `git push origin feature/nombre`:

```bash
# 1. Verificar que estás en la rama correcta
git branch

# 2. Validar código localmente
pnpm typecheck
pnpm lint
pnpm format
pnpm test

# 3. Si todo pasa, hacer push
git push origin feature/nombre-descriptivo
```

**Regla:** Si hay errores/warnings, NO hagas push. Corregir primero.

## Ventajas del Workflow con PRs

✅ **Historial limpio** - Todos los cambios pasan por PR  
✅ **Trazabilidad completa** - Cada cambio tiene descripción y commits  
✅ **CI valida todo** - Lint, tests, build, format antes de merge  
✅ **Fácil revertir** - Revertir un PR es un click  
✅ **Documentación viva** - PRs sirven como documentación de cambios  
✅ **Previene errores** - Rulesets bloquean pushes accidentales a master

## Sincronización & Conflictos

**Actualizar feature branch con cambios de master:**

```bash
git checkout feature/mi-feature
git fetch origin
git merge origin/master  # O: git rebase origin/master (historia más limpia)
```

**Resolver conflictos:**

1. Abrir archivo con conflicto
2. Decidir qué código mantener (eliminar marcadores `<<<<<<<`, `=======`, `>>>>>>>`)
3. `git add archivo.ts && git commit -m "fix: resolve merge conflict"`
4. `git push origin feature/mi-feature`

**Herramientas:** `git mergetool`, `git merge --abort`, `git rebase --abort`

## Comandos Útiles

| Categoría       | Comando                                                                                            | Descripción                                 |
| --------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **Estado**      | `git status`, `git log --oneline`, `git branch -vv`                                                | Ver estado, historial, tracking             |
| **Sincronizar** | `git fetch origin`, `git pull origin master`                                                       | Traer cambios remotos                       |
| **Deshacer**    | `git checkout -- .`, `git reset HEAD archivo`, `git reset --soft HEAD~1`, `git revert <hash>`      | Descartar cambios, unstage, deshacer commit |
| **Stash**       | `git stash`, `git stash pop`, `git stash list`                                                     | Guardar temporalmente, aplicar, listar      |
| **Ramas**       | `git branch`, `git checkout -b feature/nueva`, `git branch -d vieja`, `git branch -m nuevo-nombre` | Ver, crear, borrar, renombrar               |
| **PRs (CLI)**   | `gh pr create --base master`, `gh pr merge`, `gh pr view`                                          | Crear, mergear, ver PRs desde terminal      |

## Gestión de Branches

**Remotas:** Solo `origin/master` + `origin/feature/*` (temporales)  
**Locales:** `master` (permanente) + `feature/*` (temporales)  
**Limpiar locales:** `git branch -d feature/vieja` después de mergear

## .gitignore Esencial

```
node_modules/, dist/, build/, *.tsbuildinfo, .env*, .vscode/, .idea/, .DS_Store, logs/, coverage/, test-results/
```

## Buenas Prácticas

**✅ Hacer:**

- Commits pequeños y atómicos
- Mensajes descriptivos siguiendo convenciones
- Sincronizar con master antes de empezar feature
- Revisar cambios con `git diff` antes de commit
- Validar localmente antes de push
- Crear PRs descriptivos con contexto
- Mergear desde GitHub UI (preserva historial)

**❌ Evitar:**

- Commits gigantes con múltiples cambios
- Mensajes vagos (`fix`, `update`, `changes`)
- Subir archivos `.env` o secretos
- `git push --force` (bloquea rulesets)
- Push sin validar localmente
- Mergear sin que CI pase
- Dejar branches remotas huérfanas

## Flujo Completo Paso a Paso

```bash
# SETUP (una vez)
git clone https://github.com/cryptoganster/bookings-software.git
cd bookings-software
git config user.name "Tu Nombre"
git config user.email "tu@email.com"

# DIARIO - Inicio de sesión de trabajo
git checkout master
git pull origin master  # Traer cambios remotos

# Crear feature branch
git checkout -b feature/bc-offering

# Trabajar
git add .
git commit -m "feat(offering): implement offering aggregate"
git add .
git commit -m "feat(offering): add offering repository"

# Validar antes de push
pnpm typecheck
pnpm lint
pnpm format
pnpm test

# Push a remoto
git push origin feature/bc-offering

# Crear PR desde GitHub UI
# https://github.com/cryptoganster/bookings-software/pull/new/feature/bc-offering
# O desde CLI:
gh pr create --base master --title "feat: implement offering BC" --body "Descripción del PR"

# Esperar a que CI pase
# Mergear desde GitHub UI (o CLI: gh pr merge)

# Limpiar local
git checkout master
git pull origin master
git branch -d feature/bc-offering
```

**Resultado esperado:** Historial limpio con merge commits que preservan la historia de features

## Versionado

```bash
# Crear tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tag a remoto
git push origin v1.0.0

# Ver tags
git tag -l
```

## Alias Útiles

```bash
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.lg 'log --oneline --graph --all'
git config --global alias.sync 'fetch origin && merge origin/master'
git config --global alias.feature 'checkout -b'
```

## Troubleshooting

| Problema                             | Solución                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------- |
| **Push bloqueado a master**          | Es normal (ruleset activo). Crear PR desde feature branch                                         |
| **No puedo crear branch `develop`**  | Es normal (ruleset bloquea). Usar `feature/*` en su lugar                                         |
| **Branch local behind**              | `git fetch origin && git merge origin/master`                                                     |
| **Merge conflict**                   | Abrir archivo, resolver, `git add archivo && git commit`                                          |
| **Permission denied**                | Configurar SSH key: `ssh-keygen -t ed25519`                                                       |
| **Commit en rama equivocada**        | `git cherry-pick <hash>` en rama correcta, `git reset --hard HEAD~1` en equivocada                |
| **Quiero descartar cambios locales** | `git checkout -- .` (cuidado, es irreversible)                                                    |
| **Quiero ver qué cambió**            | `git diff` (unstaged), `git diff --cached` (staged)                                               |
| **Quiero revertir un commit**        | `git revert <hash>` (crea nuevo commit), o `git reset --soft HEAD~1` (deshace sin perder cambios) |

## Rulesets Configurados

**En `master`:**

- ✅ Bloquea push directo
- ✅ Requiere PR
- ✅ Requiere que CI pase
- ✅ Requiere que branch esté actualizado

**Nombres de branches bloqueados:**

- ❌ `dev`
- ❌ `develop`
- ❌ `development`

**Razón:** Evitar confusión, mantener una única rama principal (`master`)

---

**Last Updated:** January 9, 2026  
**Status:** Active
