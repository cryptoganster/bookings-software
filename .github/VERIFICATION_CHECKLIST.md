# Verification Checklist - Phase 1

Lista de verificación para confirmar que la Fase 1 está completamente configurada.

## ✅ Checklist de Verificación

### 1. Branch Protection Rules

- [ ] **Configuración aplicada**
  - Ve a: Settings → Branches → Branch protection rules
  - Debe existir una regla para `main`

- [ ] **Require pull request before merging** ✓
  - Intenta hacer push directo a main
  - Debe fallar con error: "Protected branch update failed"

- [ ] **Require status checks** ✓
  - La opción debe estar habilitada
  - Status checks se agregarán automáticamente en Fase 2

- [ ] **Require branches to be up to date** ✓
  - La opción debe estar habilitada

- [ ] **Require linear history** ✓
  - La opción debe estar habilitada

- [ ] **Allow force pushes** ✗
  - Debe estar DESHABILITADO

**Comando de prueba:**
```bash
git checkout main
git commit --allow-empty -m "test: verify branch protection"
git push origin main
```

**Resultado esperado:** Error de push bloqueado

---

### 2. Dependabot

- [ ] **Dependabot alerts habilitado**
  - Ve a: Settings → Code security and analysis
  - "Dependabot alerts" debe mostrar "Enabled"

- [ ] **Dependabot security updates habilitado**
  - Ve a: Settings → Code security and analysis
  - "Dependabot security updates" debe mostrar "Enabled"

- [ ] **Verificación en Security tab**
  - Ve a: Security → Dependabot alerts
  - Debe mostrar "Dependabot is enabled"
  - Puede mostrar alertas si hay vulnerabilidades (esto es bueno!)

**Verificación visual:**
1. Ve a la pestaña **Security**
2. Click en **Dependabot alerts**
3. Deberías ver el dashboard de Dependabot

---

### 3. Secret Scanning

- [ ] **Secret scanning habilitado**
  - Ve a: Settings → Code security and analysis
  - "Secret scanning" debe mostrar "Enabled"

- [ ] **Push protection habilitado**
  - Ve a: Settings → Code security and analysis
  - "Push protection" debe mostrar "Enabled"

- [ ] **Verificación en Security tab**
  - Ve a: Security → Secret scanning
  - Debe mostrar "Secret scanning is enabled"

**Prueba opcional (⚠️ con cuidado):**
```bash
# Crear archivo con secreto de prueba
echo "aws_access_key_id = AKIAIOSFODNN7EXAMPLE" > test-secret.txt
git add test-secret.txt
git commit -m "test: verify secret scanning"
git push
```

**Resultado esperado:** Warning bloqueando el push

**⚠️ IMPORTANTE:** Si haces la prueba, elimina el archivo:
```bash
git reset HEAD~1
rm test-secret.txt
```

---

### 4. Code Scanning (CodeQL)

- [ ] **CodeQL workflow existe**
  - Verifica que existe: `.github/workflows/codeql.yml`
  - O verifica en: Actions → Workflows → CodeQL

- [ ] **CodeQL ejecutándose**
  - Ve a: Actions
  - Debe haber un workflow "CodeQL" ejecutándose o completado

- [ ] **Resultados disponibles**
  - Ve a: Security → Code scanning
  - Debe mostrar resultados del análisis
  - Puede tomar 5-10 minutos la primera vez

**Verificación:**
1. Ve a la pestaña **Actions**
2. Busca el workflow "CodeQL"
3. Verifica que haya ejecutado exitosamente

---

### 5. GitHub Secrets (Opcional)

Solo necesario si vas a hacer deployment automatizado.

- [ ] **Documentación creada**
  - Existe: `.github/SECRETS.md`
  - Contiene instrucciones claras

- [ ] **Secretos configurados (si es necesario)**
  - Ve a: Settings → Secrets and variables → Actions
  - Deben estar listados (valores ocultos)

**Secretos opcionales:**
- `DOCKER_USERNAME` (solo para deployment)
- `DOCKER_PASSWORD` (solo para deployment)

---

## 🎯 Verificación Completa

### Comando de Verificación Rápida

```bash
# 1. Verificar que estás en la rama correcta
git branch --show-current

# 2. Verificar archivos de configuración creados
ls -la .github/

# Deberías ver:
# - README.md
# - SECRETS.md
# - SETUP_GUIDE.md
# - VERIFICATION_CHECKLIST.md
```

### Verificación en GitHub UI

1. **Settings Tab**
   - [ ] Branches: Regla para `main` configurada
   - [ ] Code security: Todas las features habilitadas
   - [ ] Secrets: Documentados (y configurados si es necesario)

2. **Security Tab**
   - [ ] Dependabot: Habilitado
   - [ ] Secret scanning: Habilitado
   - [ ] Code scanning: Resultados disponibles

3. **Actions Tab**
   - [ ] CodeQL workflow visible
   - [ ] Workflow ejecutado al menos una vez

---

## 📊 Resultados Esperados

### ✅ Todo Correcto

Si todos los checks están marcados:
- ✅ Branch protection funcionando
- ✅ Dependabot monitoreando dependencias
- ✅ Secret scanning activo
- ✅ CodeQL analizando código
- ✅ Documentación completa

**Estás listo para Fase 2!**

### ⚠️ Algunos Checks Fallan

Si algunos checks no pasan:
1. Revisa la sección específica en `SETUP_GUIDE.md`
2. Verifica que tengas permisos de admin en el repo
3. Espera unos minutos (algunas features tardan en activarse)
4. Revisa la sección de Troubleshooting

---

## 🆘 Troubleshooting

### Branch Protection No Funciona

**Síntoma:** Puedes hacer push directo a main

**Solución:**
1. Ve a Settings → Branches
2. Verifica que la regla existe para `main` (exactamente)
3. Verifica que "Require a pull request" esté habilitado
4. Espera 1-2 minutos y prueba de nuevo

### Dependabot No Muestra Alertas

**Síntoma:** Security tab vacío

**Solución:**
1. Espera 24 horas (primera ejecución puede tardar)
2. Verifica que esté habilitado en Settings
3. Si no hay vulnerabilidades, no habrá alertas (¡esto es bueno!)

### CodeQL No Ejecuta

**Síntoma:** No aparece en Actions

**Solución:**
1. Verifica que el workflow existe en `.github/workflows/codeql.yml`
2. Si no existe, créalo desde Security → Set up code scanning
3. Haz un push para triggerearlo
4. Revisa los logs si falla

### Secret Scanning No Detecta

**Síntoma:** Push con secreto no se bloquea

**Solución:**
1. Verifica que "Push protection" esté habilitado
2. Usa un secreto de prueba conocido (AWS key, GitHub token)
3. Puede tomar unos minutos en activarse

---

## 📝 Notas

### Tiempo de Activación

Algunas features pueden tardar en activarse:
- Branch protection: Inmediato
- Dependabot: Hasta 24 horas para primer escaneo
- Secret scanning: 5-10 minutos
- CodeQL: 5-10 minutos para primer análisis

### Permisos Necesarios

Necesitas permisos de **admin** en el repositorio para:
- Configurar branch protection
- Habilitar security features
- Agregar secretos

### Costos

**TODO ES GRATIS:**
- Branch protection: ✅ Gratis
- Dependabot: ✅ Gratis
- Secret scanning: ✅ Gratis
- CodeQL: ✅ Gratis
- GitHub Actions: ✅ 2000 min/mes gratis

---

## ⏭️ Próximos Pasos

Una vez que todos los checks estén ✅:

1. **Commitea los cambios:**
   ```bash
   git add .github/
   git commit -m "docs(ci-cd): add Phase 1 configuration guides"
   git push origin feature/ci-cd-dev-sec-ops
   ```

2. **Crea un PR:**
   - Esto triggereará CodeQL por primera vez
   - Verifica que los checks pasen

3. **Procede a Fase 2:**
   - Crear workflows de CI
   - Implementar linting, testing, security scanning

---

**Última actualización:** Diciembre 2024
**Fase:** 1 - Foundation & Branch Protection
**Estado:** ✅ Documentación completa, configuración manual pendiente
