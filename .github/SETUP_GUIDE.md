# GitHub Repository Setup Guide

Guía paso a paso para configurar las características de seguridad y protección de ramas en GitHub.

## 📋 Checklist de Configuración

- [ ] 1. Branch Protection Rules
- [ ] 2. Dependabot
- [ ] 3. Secret Scanning
- [ ] 4. Code Scanning (CodeQL)
- [ ] 5. GitHub Secrets (si es necesario)

---

## 1. Configurar Branch Protection Rules

### Paso 1: Acceder a Branch Protection

1. Ve a tu repositorio en GitHub
2. Click en **Settings** (Configuración)
3. En el menú lateral, click en **Branches**
4. En "Branch protection rules", click en **Add rule** o **Add branch protection rule**

### Paso 2: Configurar la Regla para `main`

**Branch name pattern:** `main`

#### ✅ Configuraciones a Habilitar:

**Protect matching branches:**

- [x] **Require a pull request before merging**
  - [x] Require approvals: `0` (como eres solo dev, puedes dejarlo en 0)
  - [x] Dismiss stale pull request approvals when new commits are pushed
  - [ ] Require review from Code Owners (opcional, no necesario para solo dev)

- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging
  - **Status checks:** (Se agregarán automáticamente cuando crees los workflows)
    - `code-quality`
    - `security`
    - `test`
    - `build`

- [x] **Require conversation resolution before merging** (opcional pero recomendado)

- [x] **Require signed commits** (opcional, para mayor seguridad)

- [x] **Require linear history**

- [x] **Include administrators** (opcional, puedes dejarlo deshabilitado para bypass de emergencia)

#### ❌ Configuraciones a Deshabilitar:

- [ ] **Allow force pushes** - DEBE estar DESHABILITADO
- [ ] **Allow deletions** - DEBE estar DESHABILITADO

### Paso 3: Guardar

Click en **Create** o **Save changes**

### ✅ Verificación

Intenta hacer push directo a `main`:
```bash
git checkout main
git commit --allow-empty -m "test"
git push origin main
```

Deberías ver un error: `remote: error: GH006: Protected branch update failed`

---

## 2. Habilitar Dependabot

### Paso 1: Acceder a Dependabot

1. Ve a tu repositorio en GitHub
2. Click en **Settings** (Configuración)
3. En el menú lateral, click en **Code security and analysis**

### Paso 2: Habilitar Features

#### ✅ Habilitar:

- [x] **Dependabot alerts**
  - Click en **Enable** si no está habilitado
  - Detecta vulnerabilidades en dependencias

- [x] **Dependabot security updates**
  - Click en **Enable** si no está habilitado
  - Crea PRs automáticos para vulnerabilidades

### Paso 3: Configurar Dependabot (Opcional)

Puedes crear `.github/dependabot.yml` para configuración avanzada (lo haremos en Fase 4).

### ✅ Verificación

1. Ve a la pestaña **Security** de tu repo
2. Click en **Dependabot alerts**
3. Deberías ver "Dependabot is enabled"

---

## 3. Habilitar Secret Scanning

### Paso 1: Acceder a Secret Scanning

1. Ve a tu repositorio en GitHub
2. Click en **Settings** (Configuración)
3. En el menú lateral, click en **Code security and analysis**

### Paso 2: Habilitar Features

#### ✅ Habilitar:

- [x] **Secret scanning**
  - Click en **Enable** si no está habilitado
  - Escanea todo el historial del repositorio

- [x] **Push protection**
  - Click en **Enable** si no está habilitado
  - Previene que se commiteen secretos accidentalmente

### ✅ Verificación

1. Ve a la pestaña **Security** de tu repo
2. Click en **Secret scanning**
3. Deberías ver "Secret scanning is enabled"

### 🧪 Prueba (Opcional)

Intenta commitear un secreto de prueba:
```bash
echo "aws_access_key_id = AKIAIOSFODNN7EXAMPLE" > test-secret.txt
git add test-secret.txt
git commit -m "test secret"
```

Deberías ver un warning bloqueando el push.

**⚠️ IMPORTANTE:** No olvides eliminar el archivo de prueba:
```bash
git reset HEAD~1
rm test-secret.txt
```

---

## 4. Habilitar Code Scanning (CodeQL)

### Opción A: Habilitar desde UI (Más Fácil)

1. Ve a tu repositorio en GitHub
2. Click en la pestaña **Security**
3. Click en **Set up code scanning**
4. En "CodeQL analysis", click en **Set up this workflow**
5. GitHub creará automáticamente `.github/workflows/codeql.yml`
6. Revisa el archivo y haz commit

### Opción B: Crear Workflow Manualmente (Más Control)

Lo haremos en la Fase 2 del plan de implementación.

### ✅ Verificación

1. Ve a la pestaña **Actions** de tu repo
2. Deberías ver el workflow "CodeQL" ejecutándose
3. Espera a que termine (puede tomar 5-10 minutos la primera vez)
4. Ve a **Security** → **Code scanning**
5. Deberías ver los resultados del análisis

---

## 5. Configurar GitHub Secrets (Opcional)

Solo necesario si vas a hacer deployment automatizado.

### Paso 1: Acceder a Secrets

1. Ve a tu repositorio en GitHub
2. Click en **Settings** (Configuración)
3. En el menú lateral, click en **Secrets and variables** → **Actions**

### Paso 2: Agregar Secretos

Para cada secreto necesario (ver `.github/SECRETS.md`):

1. Click en **New repository secret**
2. **Name:** Nombre del secreto (ej: `DOCKER_USERNAME`)
3. **Secret:** Valor del secreto
4. Click en **Add secret**

### ✅ Verificación

Los secretos aparecerán listados (pero sus valores estarán ocultos por seguridad).

---

## 🎯 Configuración Completa

Una vez completados todos los pasos, tu repositorio tendrá:

✅ Branch protection en `main` (no push directo)
✅ Dependabot habilitado (alertas + PRs automáticos)
✅ Secret scanning habilitado (detección + prevención)
✅ Code scanning habilitado (análisis de seguridad)
✅ Secrets configurados (si es necesario)

---

## 📊 Verificación Final

### 1. Branch Protection
```bash
# Esto debe fallar:
git push origin main
# Error esperado: "Protected branch update failed"
```

### 2. Dependabot
- Ve a **Security** → **Dependabot alerts**
- Debe mostrar "Dependabot is enabled"

### 3. Secret Scanning
- Ve a **Security** → **Secret scanning**
- Debe mostrar "Secret scanning is enabled"

### 4. Code Scanning
- Ve a **Security** → **Code scanning**
- Debe mostrar resultados del análisis

---

## 🆘 Troubleshooting

### "I don't see the Settings tab"
- Necesitas permisos de admin en el repositorio
- Si es un fork, necesitas hacerlo en tu propio repo

### "Branch protection rules not working"
- Verifica que el pattern sea exactamente `main`
- Verifica que hayas guardado los cambios
- Puede tomar unos segundos en aplicarse

### "Dependabot not creating PRs"
- Verifica que esté habilitado en Settings
- Puede tomar hasta 24 horas en escanear por primera vez
- Verifica que tengas dependencias con vulnerabilidades conocidas

### "CodeQL workflow failing"
- Verifica que el workflow tenga permisos correctos
- Verifica que el lenguaje esté configurado correctamente (typescript, javascript)
- Revisa los logs del workflow para más detalles

---

## 📚 Referencias

- [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [Dependabot](https://docs.github.com/en/code-security/dependabot)
- [Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Code Scanning](https://docs.github.com/en/code-security/code-scanning)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

## ⏭️ Próximos Pasos

Una vez completada esta configuración, estarás listo para:

1. **Fase 2:** Crear workflows de CI (linting, testing, security scanning)
2. **Fase 3:** Crear workflows de CD (Docker, deployment)
3. **Fase 4:** Optimizaciones y documentación

**Tiempo estimado para esta configuración:** 15-20 minutos
