# GitHub Configuration

Este directorio contiene la configuración de GitHub Actions, workflows de CI/CD, y documentación relacionada.

## 📁 Estructura

```
.github/
├── workflows/              # GitHub Actions workflows (Fase 2-3)
│   ├── ci.yml             # CI Pipeline (linting, testing, security)
│   ├── cd.yml             # CD Pipeline (deployment)
│   ├── codeql.yml         # CodeQL security scanning
│   └── dependabot.yml     # Dependabot configuration (Fase 4)
├── SETUP_GUIDE.md         # Guía de configuración inicial
├── SECRETS.md             # Documentación de secretos
└── README.md              # Este archivo
```

## 🚀 Quick Start

### 1. Configuración Inicial (Fase 1)

Sigue la guía paso a paso en [`SETUP_GUIDE.md`](./SETUP_GUIDE.md) para configurar:

- ✅ Branch protection rules
- ✅ Dependabot
- ✅ Secret scanning
- ✅ Code scanning (CodeQL)

**Tiempo estimado:** 15-20 minutos

### 2. CI/CD Workflows (Fase 2-3)

Los workflows se crearán automáticamente durante la implementación de las fases 2 y 3.

## 📋 Checklist de Configuración

### Fase 1: Foundation (Manual)
- [ ] Branch protection configurado en `main`
- [ ] Dependabot habilitado
- [ ] Secret scanning habilitado
- [ ] CodeQL habilitado

### Fase 2: CI Pipeline (Automático)
- [ ] Workflow `ci.yml` creado
- [ ] Linting configurado
- [ ] Testing configurado
- [ ] Security scanning configurado

### Fase 3: CD Pipeline (Automático)
- [ ] Workflow `cd.yml` creado
- [ ] Docker build configurado
- [ ] Deployment configurado
- [ ] Health checks configurados

### Fase 4: Optimization (Automático)
- [ ] Caching optimizado
- [ ] Dependabot configurado
- [ ] Documentación completa

## 🔒 Seguridad

### Secretos

Los secretos se gestionan en GitHub Settings → Secrets and variables → Actions.

Ver [`SECRETS.md`](./SECRETS.md) para documentación completa.

**⚠️ NUNCA commitees secretos en el código.**

### Branch Protection

La rama `main` está protegida y requiere:
- Pull Request antes de merge
- Status checks pasando
- Rama actualizada
- Historial lineal

### Security Scanning

Múltiples capas de seguridad:
- **SAST:** CodeQL analiza el código
- **SCA:** Dependabot escanea dependencias
- **Secrets:** GitHub Secret Scanning detecta credenciales
- **Containers:** Trivy escanea imágenes Docker (Fase 3)

## 📊 Workflows

### CI Workflow (`ci.yml`)

**Trigger:** Push a cualquier rama, Pull Request a main

**Jobs:**
1. **code-quality** - ESLint, Prettier, TypeScript
2. **security** - CodeQL, npm audit, secret scanning
3. **test** - Unit tests, integration tests, coverage
4. **build** - Compilar backend y frontend

**Duración estimada:** 8-10 minutos

### CD Workflow (`cd.yml`)

**Trigger:** Push a main (después de CI exitoso)

**Jobs:**
1. **docker-build** - Construir imagen Docker
2. **docker-scan** - Escanear vulnerabilidades
3. **deploy** - Deployment a producción
4. **health-check** - Verificar salud del servicio

**Duración estimada:** 5-7 minutos

### CodeQL Workflow (`codeql.yml`)

**Trigger:** Push a main, Pull Request, Schedule (semanal)

**Análisis:**
- Lenguajes: TypeScript, JavaScript
- Queries: security-extended
- Fail on: critical, high
- Warn on: medium, low

**Duración estimada:** 5-10 minutos

## 🎯 Métricas

### Success Criteria

- ✅ CI pipeline pasa en < 10 minutos
- ✅ 0 vulnerabilidades críticas
- ✅ Cobertura de tests > 70%
- ✅ 0 errores de linting
- ✅ Deployment exitoso en < 5 minutos

### Monitoring

- **GitHub Actions Insights:** Métricas de workflows
- **Security Tab:** Alertas de seguridad
- **Dependabot:** PRs automáticos de actualizaciones

## 🆘 Troubleshooting

### Workflow Failing

1. Revisa los logs en la pestaña **Actions**
2. Identifica el job que falló
3. Revisa el step específico con error
4. Busca el error en la documentación

### Security Alerts

1. Ve a **Security** → **Code scanning** o **Dependabot**
2. Revisa la alerta específica
3. Sigue las recomendaciones de remediación
4. Crea un PR con el fix

### Branch Protection Blocking

Si necesitas bypass de emergencia:
1. Ve a Settings → Branches
2. Temporalmente deshabilita "Include administrators"
3. Haz el push necesario
4. **IMPORTANTE:** Re-habilita la protección inmediatamente

## 📚 Documentación

- [`SETUP_GUIDE.md`](./SETUP_GUIDE.md) - Guía de configuración paso a paso
- [`SECRETS.md`](./SECRETS.md) - Gestión de secretos
- [Spec completo](../.kiro/specs/ci-cd-devsecops/) - Documentación técnica completa

## 🔗 Enlaces Útiles

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Security Features](https://docs.github.com/en/code-security)
- [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [Dependabot](https://docs.github.com/en/code-security/dependabot)
- [CodeQL](https://codeql.github.com/docs/)

## 💰 Costos

**TODO ES GRATIS** para repositorios privados:
- GitHub Actions: 2000 minutos/mes
- CodeQL: Ilimitado
- Dependabot: Ilimitado
- Secret Scanning: Ilimitado

Para un solo desarrollador, el free tier es más que suficiente.

## ⏭️ Próximos Pasos

1. **Ahora:** Completa la configuración manual (Fase 1)
2. **Siguiente:** Implementa workflows de CI (Fase 2)
3. **Después:** Implementa workflows de CD (Fase 3)
4. **Finalmente:** Optimiza y documenta (Fase 4)

---

**Última actualización:** Diciembre 2024
**Mantenedor:** @cryptoganster
