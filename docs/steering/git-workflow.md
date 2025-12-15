# Git y GitHub Workflow

Este documento define el flujo de trabajo con Git y GitHub para el proyecto.

## Estructura de Ramas

### Ramas Principales

```
main        → Código estable (producción)
develop     → Integración de features
```

### Ramas de Trabajo

```
feature/*   → Nuevas funcionalidades
fix/*       → Corrección de bugs
refactor/*  → Refactorizaciones
docs/*      → Documentación
test/*      → Tests
```

### Ejemplos de Nombres de Ramas

```bash
✅ Correcto:
feature/user-authentication
feature/booking-flow
fix/appointment-validation
refactor/repository-pattern
docs/api-documentation
test/appointment-concurrency

❌ Incorrecto:
feature-user-authentication
UserAuthentication
fix_bug
refactor
```

## Configuración Inicial

### 1. Clonar Repositorio

```bash
git clone https://github.com/cryptoganster/bookings-software.git
cd bookings-software
```

### 2. Configurar Usuario

```bash
git config user.name "Tu Nombre"
git config user.email "tu@email.com"
```

### 3. Crear Rama de Desarrollo

```bash
git checkout -b develop
git push -u origin develop
```

### 4. Configurar .gitignore

```bash
# Crear .gitignore con contenido apropiado
# Ver sección "Archivos a Ignorar" más abajo
```

## Flujo de Trabajo por Task

### 1. Antes de Empezar una Task

```bash
# Asegurarse de estar en develop actualizado
git checkout develop
git pull origin develop

# Crear rama para la task
git checkout -b feature/nombre-descriptivo
```

### 2. Trabajar en el Código

```bash
# Editar archivos normalmente
# src/booking/domain/aggregates/appointment.ts
# src/booking/app/commands/create-appointment/handler.ts

# Ver cambios realizados
git status
git diff

# Ver cambios de un archivo específico
git diff src/booking/domain/aggregates/appointment.ts
```

### 3. Preparar Cambios (Staging)

```bash
# Agregar todos los cambios
git add .

# Agregar archivos específicos
git add src/booking/domain/aggregates/appointment.ts
git add src/booking/app/commands/create-appointment/

# Agregar interactivamente (recomendado)
git add -p
```

### 4. Guardar Cambios (Commit)

```bash
# Commit con mensaje descriptivo
git commit -m "feat: implement Appointment aggregate with versioning"

# Commit con mensaje detallado
git commit -m "feat: implement Appointment aggregate

- Add VersionedAggregateRoot base class
- Implement create, cancel, and modify methods
- Add domain events (AppointmentCreated, AppointmentCancelled)
- Include version increment on state changes

Validates: Requirements 3.1, 2.2"
```

### 5. Subir Cambios al Cloud

```bash
# Primera vez (crear rama remota)
git push -u origin feature/nombre-descriptivo

# Siguientes veces
git push
```

## Convenciones de Mensajes de Commit

### Formato

```
<tipo>: <descripción corta>

[cuerpo opcional]

[footer opcional]
```

### Tipos de Commit

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `feat` | Nueva funcionalidad | `feat: add appointment cancellation` |
| `fix` | Corrección de bug | `fix: resolve concurrency issue in capacity` |
| `refactor` | Refactorización sin cambiar comportamiento | `refactor: extract mapper to separate class` |
| `test` | Agregar o modificar tests | `test: add property tests for appointment` |
| `docs` | Documentación | `docs: update API documentation` |
| `style` | Formato, punto y coma, etc. | `style: format code with prettier` |
| `perf` | Mejora de performance | `perf: optimize query with index` |
| `chore` | Tareas de mantenimiento | `chore: update dependencies` |
| `build` | Cambios en build o dependencias | `build: add fast-check dependency` |
| `ci` | Cambios en CI/CD | `ci: add GitHub Actions workflow` |

### Ejemplos de Buenos Commits

```bash
✅ Correcto:
git commit -m "feat: implement CreateAppointmentHandler with retry logic"
git commit -m "fix: handle ConcurrencyException in cancel appointment"
git commit -m "refactor: extract appointment mapper to separate file"
git commit -m "test: add concurrency tests for appointment creation"
git commit -m "docs: add architecture decision record for CQRS"

❌ Incorrecto:
git commit -m "changes"
git commit -m "fix bug"
git commit -m "update"
git commit -m "WIP"
git commit -m "asdfasdf"
```

### Commits con Scope (Opcional)

```bash
git commit -m "feat(booking): implement appointment aggregate"
git commit -m "fix(messaging): resolve webhook signature validation"
git commit -m "test(booking): add property tests for optimistic locking"
```

## Pull Requests (PR)

### 1. Crear Pull Request

En GitHub:

1. Ir a la página del repositorio
2. Click en "Pull requests" → "New pull request"
3. Configurar:
   - **base:** `develop`
   - **compare:** `feature/nombre-descriptivo`
4. Completar información:
   - **Título:** Descripción clara de los cambios
   - **Descripción:** Detalles, screenshots, referencias a issues
5. Click en "Create pull request"

### 2. Template de Pull Request

```markdown
## Descripción
Breve descripción de los cambios realizados.

## Tipo de Cambio
- [ ] Nueva funcionalidad (feature)
- [ ] Corrección de bug (fix)
- [ ] Refactorización (refactor)
- [ ] Documentación (docs)
- [ ] Tests

## Checklist
- [ ] El código compila sin errores
- [ ] Los tests pasan
- [ ] Se agregaron tests para los cambios
- [ ] La documentación fue actualizada
- [ ] El código sigue las convenciones del proyecto

## Requirements Validados
- Requirements 3.1: Implementación de Appointment Aggregate
- Requirements 2.2: Versioning en aggregates

## Screenshots (si aplica)
[Agregar screenshots si hay cambios visuales]

## Notas Adicionales
[Cualquier información adicional relevante]
```

### 3. Revisión de Código

**Como Autor:**
- Responder a comentarios
- Hacer cambios solicitados
- Pushear cambios adicionales a la misma rama

**Como Revisor:**
- Revisar código línea por línea
- Verificar que sigue convenciones
- Verificar que los tests pasan
- Aprobar o solicitar cambios

### 4. Merge del Pull Request

Una vez aprobado:

```bash
# En GitHub: Click en "Merge pull request"
# Opciones:
# - Merge commit (recomendado para features)
# - Squash and merge (para múltiples commits pequeños)
# - Rebase and merge (para mantener historia lineal)

# Después del merge, borrar la rama remota (opcional)
```

### 5. Actualizar Local Después del Merge

```bash
# Volver a develop
git checkout develop

# Actualizar con los cambios mergeados
git pull origin develop

# Borrar rama local (opcional)
git branch -d feature/nombre-descriptivo
```

## Sincronización Constante

### Regla de Oro

```bash
# Antes de empezar a trabajar
git pull origin develop

# Antes de hacer push
git pull --rebase origin develop
git push
```

### Actualizar Rama de Feature con Develop

```bash
# Opción 1: Merge (más simple)
git checkout feature/mi-feature
git merge develop

# Opción 2: Rebase (historia más limpia)
git checkout feature/mi-feature
git rebase develop
```

## Resolver Conflictos

### Cuando Ocurre un Conflicto

```bash
# Git avisa del conflicto
git pull origin develop
# Auto-merging src/booking/domain/aggregates/appointment.ts
# CONFLICT (content): Merge conflict in src/booking/domain/aggregates/appointment.ts
```

### Resolver Manualmente

```typescript
// Archivo con conflicto
<<<<<<< HEAD
// Tu código
const appointment = Appointment.create(...);
=======
// Código remoto
const appointment = new Appointment();
>>>>>>> develop
```

**Pasos:**

1. Abrir archivo con conflicto
2. Decidir qué código mantener
3. Eliminar marcadores (`<<<<<<<`, `=======`, `>>>>>>>`)
4. Guardar archivo
5. Agregar y commitear

```bash
git add src/booking/domain/aggregates/appointment.ts
git commit -m "fix: resolve merge conflict in appointment aggregate"
git push
```

### Herramientas para Resolver Conflictos

```bash
# Usar herramienta de merge visual
git mergetool

# Abortar merge si es necesario
git merge --abort

# Abortar rebase si es necesario
git rebase --abort
```

## Comandos Útiles

### Ver Estado

```bash
# Ver estado actual
git status

# Ver historial de commits
git log

# Ver historial resumido
git log --oneline

# Ver historial con gráfico
git log --oneline --graph --all

# Ver cambios de un commit específico
git show <commit-hash>
```

### Deshacer Cambios

```bash
# Descartar cambios en archivo (antes de add)
git checkout -- archivo.ts

# Descartar todos los cambios (antes de add)
git checkout -- .

# Quitar archivo del staging (después de add)
git reset HEAD archivo.ts

# Deshacer último commit (mantener cambios)
git reset --soft HEAD~1

# Deshacer último commit (descartar cambios)
git reset --hard HEAD~1

# Revertir commit específico (crear nuevo commit)
git revert <commit-hash>
```

### Stash (Guardar Temporalmente)

```bash
# Guardar cambios temporalmente
git stash

# Ver lista de stashes
git stash list

# Aplicar último stash
git stash pop

# Aplicar stash específico
git stash apply stash@{0}

# Borrar stash
git stash drop stash@{0}
```

### Ramas

```bash
# Ver ramas locales
git branch

# Ver todas las ramas (locales y remotas)
git branch -a

# Crear rama
git branch feature/nueva-feature

# Cambiar a rama
git checkout feature/nueva-feature

# Crear y cambiar a rama (atajo)
git checkout -b feature/nueva-feature

# Borrar rama local
git branch -d feature/vieja-feature

# Borrar rama remota
git push origin --delete feature/vieja-feature

# Renombrar rama actual
git branch -m nuevo-nombre
```

## Archivos a Ignorar (.gitignore)

```bash
# .gitignore

# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build
dist/
build/
*.tsbuildinfo

# Environment
.env
.env.local
.env.*.local

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

# Coverage
coverage/
.nyc_output/

# Kiro (opcional - depende de tu preferencia)
.kiro/

# TypeORM
ormconfig.json

# Tests
test-results/
```

## Buenas Prácticas

### ✅ Hacer

- **Commits pequeños y frecuentes:** Facilita revisión y rollback
- **Mensajes descriptivos:** Explica QUÉ y POR QUÉ
- **Pull frecuente:** Evita conflictos grandes
- **Una task = una rama:** Mantiene cambios organizados
- **Usar Pull Requests:** Aunque trabajes solo, ayuda a revisar
- **Revisar antes de commit:** `git diff` antes de `git add`
- **Tests antes de push:** Asegura que todo funciona
- **Actualizar .gitignore:** No subir archivos innecesarios

### ❌ Evitar

- **Trabajar directo en main:** Siempre usar ramas
- **Commits gigantes:** Dificulta revisión
- **Mensajes vagos:** "fix", "update", "changes"
- **Subir archivos sensibles:** .env, credenciales
- **Forzar push:** `git push --force` (solo en casos extremos)
- **Ignorar conflictos:** Resolverlos correctamente
- **No hacer pull:** Trabajar con código desactualizado

## Flujo Completo Resumido

```bash
# 1. Clonar repositorio (solo primera vez)
git clone https://github.com/cryptoganster/bookings-software.git
cd bookings-software

# 2. Crear rama develop (solo primera vez)
git checkout -b develop
git push -u origin develop

# 3. Para cada task:
git checkout develop
git pull origin develop
git checkout -b feature/nombre-task

# 4. Trabajar
# ... editar archivos ...
git add .
git commit -m "feat: descripción clara"

# 5. Subir
git push -u origin feature/nombre-task

# 6. Crear Pull Request en GitHub
# base: develop
# compare: feature/nombre-task

# 7. Después del merge
git checkout develop
git pull origin develop
git branch -d feature/nombre-task
```

## Preparar Release a Producción

```bash
# Cuando develop está listo para producción
git checkout main
git pull origin main
git merge develop
git push origin main

# Crear tag de versión
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

## Recursos Adicionales

### Comandos de Ayuda

```bash
# Ayuda general
git help

# Ayuda de comando específico
git help commit
git help merge
git help rebase
```

### Alias Útiles (Opcional)

```bash
# Configurar alias
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.lg 'log --oneline --graph --all'

# Usar alias
git st
git co develop
git br
git ci -m "mensaje"
```

## Troubleshooting

### Problema: "Your branch is behind"

```bash
# Solución: Actualizar rama
git pull origin develop
```

### Problema: "Your branch is ahead"

```bash
# Solución: Subir cambios
git push origin feature/mi-feature
```

### Problema: "Merge conflict"

```bash
# Solución: Resolver conflictos manualmente
# 1. Abrir archivos con conflicto
# 2. Editar y resolver
# 3. git add archivo
# 4. git commit
```

### Problema: "Permission denied (publickey)"

```bash
# Solución: Configurar SSH key
# Ver: https://docs.github.com/en/authentication/connecting-to-github-with-ssh
```

### Problema: Commit en rama equivocada

```bash
# Solución: Mover commit a otra rama
git log  # Copiar hash del commit
git checkout rama-correcta
git cherry-pick <commit-hash>
git checkout rama-equivocada
git reset --hard HEAD~1
```

Estas prácticas aseguran un flujo de trabajo ordenado y colaborativo, facilitando el desarrollo en equipo y el mantenimiento del código.
