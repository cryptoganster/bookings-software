# Requirements Document - CI/CD & DevSecOps

## Introduction

Sistema de CI/CD y DevSecOps para proyecto de reservas multi-tenant, optimizado para un solo desarrollador. El objetivo es automatizar seguridad, testing y deployment sin agregar fricción al desarrollo diario.

## Glossary

- **CI/CD**: Continuous Integration / Continuous Deployment
- **DevSecOps**: Integración de seguridad en el ciclo DevOps
- **SAST**: Static Application Security Testing (análisis estático de código)
- **SCA**: Software Composition Analysis (análisis de dependencias)
- **SBOM**: Software Bill of Materials (inventario de componentes)
- **GitHub Actions**: Plataforma de CI/CD de GitHub
- **Branch Protection**: Reglas que protegen ramas principales
- **Secret Scanning**: Detección de secretos en código
- **Dependabot**: Bot de GitHub para actualizar dependencias
- **CodeQL**: Motor de análisis de código de GitHub
- **Docker**: Plataforma de contenedores
- **Health Check**: Endpoint para verificar estado del servicio

## Requirements

### Requirement 1: Automatización de CI/CD

**User Story:** Como desarrollador único, quiero que el CI/CD se ejecute automáticamente en cada push, para detectar problemas sin intervención manual.

#### Acceptance Criteria

1. WHEN un desarrollador hace push a cualquier rama THEN el sistema SHALL ejecutar pipeline de CI automáticamente
2. WHEN un desarrollador crea un Pull Request THEN el sistema SHALL ejecutar validaciones completas antes de permitir merge
3. WHEN el pipeline de CI falla THEN el sistema SHALL notificar al desarrollador con detalles del error
4. WHEN se hace merge a main THEN el sistema SHALL ejecutar pipeline de deployment automáticamente
5. WHEN el deployment falla THEN el sistema SHALL mantener la versión anterior funcionando

### Requirement 2: Seguridad del Código (SAST)

**User Story:** Como desarrollador, quiero que el código se analice automáticamente en busca de vulnerabilidades, para prevenir problemas de seguridad.

#### Acceptance Criteria

1. WHEN se ejecuta el pipeline THEN el sistema SHALL ejecutar análisis estático con CodeQL
2. WHEN se detectan vulnerabilidades críticas THEN el sistema SHALL fallar el pipeline
3. WHEN se detectan vulnerabilidades medias/bajas THEN el sistema SHALL generar warnings sin bloquear
4. WHEN se completa el análisis THEN el sistema SHALL generar reporte de seguridad en GitHub Security tab
5. WHEN se usa TypeScript THEN el sistema SHALL validar tipos estrictamente

### Requirement 3: Análisis de Dependencias (SCA)

**User Story:** Como desarrollador, quiero que las dependencias se analicen automáticamente, para detectar vulnerabilidades conocidas.

#### Acceptance Criteria

1. WHEN se ejecuta el pipeline THEN el sistema SHALL escanear dependencias con npm audit
2. WHEN se detectan vulnerabilidades críticas en dependencias THEN el sistema SHALL fallar el pipeline
3. WHEN Dependabot detecta actualizaciones THEN el sistema SHALL crear PR automático
4. WHEN se actualiza package.json THEN el sistema SHALL verificar licencias de dependencias
5. WHEN se completa el análisis THEN el sistema SHALL generar SBOM (Software Bill of Materials)

### Requirement 4: Detección de Secretos

**User Story:** Como desarrollador, quiero que se detecten secretos accidentalmente commiteados, para prevenir exposición de credenciales.

#### Acceptance Criteria

1. WHEN se hace push THEN el sistema SHALL escanear commits en busca de secretos
2. WHEN se detecta un secreto THEN el sistema SHALL fallar el pipeline inmediatamente
3. WHEN se detecta un secreto THEN el sistema SHALL notificar al desarrollador con ubicación exacta
4. WHEN se usa GitHub Secret Scanning THEN el sistema SHALL escanear todo el historial
5. WHEN se detecta API key o token THEN el sistema SHALL alertar en GitHub Security

### Requirement 5: Testing Automatizado

**User Story:** Como desarrollador, quiero que los tests se ejecuten automáticamente, para garantizar calidad sin esfuerzo manual.

#### Acceptance Criteria

1. WHEN se ejecuta el pipeline THEN el sistema SHALL ejecutar todos los tests unitarios
2. WHEN se ejecuta el pipeline THEN el sistema SHALL ejecutar tests de integración
3. WHEN los tests fallan THEN el sistema SHALL fallar el pipeline con detalles
4. WHEN se completan los tests THEN el sistema SHALL generar reporte de cobertura
5. WHEN la cobertura es menor a 70% THEN el sistema SHALL generar warning

### Requirement 6: Linting y Formateo

**User Story:** Como desarrollador, quiero que el código se valide automáticamente, para mantener consistencia sin esfuerzo manual.

#### Acceptance Criteria

1. WHEN se ejecuta el pipeline THEN el sistema SHALL ejecutar ESLint
2. WHEN se ejecuta el pipeline THEN el sistema SHALL ejecutar Prettier check
3. WHEN se ejecuta el pipeline THEN el sistema SHALL ejecutar TypeScript type checking
4. WHEN hay errores de linting THEN el sistema SHALL fallar el pipeline
5. WHEN hay errores de formato THEN el sistema SHALL sugerir auto-fix

### Requirement 7: Build y Validación

**User Story:** Como desarrollador, quiero que el build se valide automáticamente, para detectar errores de compilación temprano.

#### Acceptance Criteria

1. WHEN se ejecuta el pipeline THEN el sistema SHALL compilar backend TypeScript
2. WHEN se ejecuta el pipeline THEN el sistema SHALL compilar frontend Vite
3. WHEN el build falla THEN el sistema SHALL fallar el pipeline con errores específicos
4. WHEN el build es exitoso THEN el sistema SHALL cachear node_modules para acelerar
5. WHEN se usa monorepo THEN el sistema SHALL validar workspaces de pnpm

### Requirement 8: Docker y Contenedores

**User Story:** Como desarrollador, quiero que las imágenes Docker se construyan y escaneen automáticamente, para deployment seguro.

#### Acceptance Criteria

1. WHEN se hace merge a main THEN el sistema SHALL construir imagen Docker del backend
2. WHEN se construye imagen THEN el sistema SHALL escanear vulnerabilidades con Trivy
3. WHEN se detectan vulnerabilidades críticas en imagen THEN el sistema SHALL fallar el deployment
4. WHEN la imagen es segura THEN el sistema SHALL tagear con versión semántica
5. WHEN se completa el build THEN el sistema SHALL pushear imagen a GitHub Container Registry

### Requirement 9: Branch Protection

**User Story:** Como desarrollador, quiero que la rama main esté protegida, para prevenir merges accidentales sin validación.

#### Acceptance Criteria

1. WHEN se intenta push directo a main THEN el sistema SHALL rechazar el push
2. WHEN se crea PR a main THEN el sistema SHALL requerir que pasen todos los checks
3. WHEN se crea PR a main THEN el sistema SHALL requerir revisión de código (opcional para solo dev)
4. WHEN se hace merge a main THEN el sistema SHALL requerir que la rama esté actualizada
5. WHEN se hace merge a main THEN el sistema SHALL usar squash merge por defecto

### Requirement 10: Gestión de Secretos

**User Story:** Como desarrollador, quiero gestionar secretos de forma segura, para evitar exposición en código o logs.

#### Acceptance Criteria

1. WHEN se necesita un secreto en CI THEN el sistema SHALL usar GitHub Secrets
2. WHEN se ejecuta pipeline THEN el sistema SHALL enmascarar secretos en logs
3. WHEN se usa .env THEN el sistema SHALL validar que .env no esté en git
4. WHEN se documenta configuración THEN el sistema SHALL usar .env.example sin valores reales
5. WHEN se rota un secreto THEN el sistema SHALL permitir actualización sin redeploy

### Requirement 11: Deployment Automatizado

**User Story:** Como desarrollador, quiero que el deployment sea automático después de merge a main, para reducir pasos manuales.

#### Acceptance Criteria

1. WHEN se hace merge a main THEN el sistema SHALL ejecutar deployment automáticamente
2. WHEN se ejecuta deployment THEN el sistema SHALL usar estrategia blue-green o rolling
3. WHEN el deployment falla THEN el sistema SHALL hacer rollback automático
4. WHEN se completa deployment THEN el sistema SHALL ejecutar smoke tests
5. WHEN se completa deployment THEN el sistema SHALL notificar éxito/fallo

### Requirement 12: Health Checks y Monitoring

**User Story:** Como desarrollador, quiero que el servicio tenga health checks, para detectar problemas en producción.

#### Acceptance Criteria

1. WHEN el servicio está corriendo THEN el sistema SHALL exponer endpoint /health
2. WHEN se consulta /health THEN el sistema SHALL verificar conexión a base de datos
3. WHEN se consulta /health THEN el sistema SHALL retornar status 200 si todo está bien
4. WHEN hay un problema THEN el sistema SHALL retornar status 503 con detalles
5. WHEN se hace deployment THEN el sistema SHALL verificar health antes de completar

### Requirement 13: Logging y Auditoría

**User Story:** Como desarrollador, quiero que los pipelines generen logs estructurados, para debugging y auditoría.

#### Acceptance Criteria

1. WHEN se ejecuta pipeline THEN el sistema SHALL generar logs estructurados en JSON
2. WHEN se ejecuta pipeline THEN el sistema SHALL incluir timestamps en todos los logs
3. WHEN falla un step THEN el sistema SHALL incluir stack trace completo
4. WHEN se completa pipeline THEN el sistema SHALL archivar logs por 90 días
5. WHEN se ejecuta deployment THEN el sistema SHALL registrar quién y cuándo

### Requirement 14: Performance y Optimización

**User Story:** Como desarrollador, quiero que los pipelines sean rápidos, para no perder tiempo esperando.

#### Acceptance Criteria

1. WHEN se ejecuta pipeline THEN el sistema SHALL cachear node_modules
2. WHEN se ejecuta pipeline THEN el sistema SHALL ejecutar jobs en paralelo cuando sea posible
3. WHEN se ejecuta pipeline THEN el sistema SHALL completar en menos de 10 minutos
4. WHEN se usa cache THEN el sistema SHALL invalidar cache cuando cambia package-lock.json
5. WHEN se ejecuta pipeline frecuentemente THEN el sistema SHALL usar runners eficientes

### Requirement 15: Documentación y Transparencia

**User Story:** Como desarrollador, quiero que el CI/CD esté documentado, para entender y modificar fácilmente.

#### Acceptance Criteria

1. WHEN se configura CI/CD THEN el sistema SHALL incluir README con explicación de workflows
2. WHEN se configura CI/CD THEN el sistema SHALL incluir badges de status en README principal
3. WHEN se ejecuta pipeline THEN el sistema SHALL mostrar progreso en tiempo real
4. WHEN falla pipeline THEN el sistema SHALL incluir links a documentación de errores comunes
5. WHEN se actualiza workflow THEN el sistema SHALL documentar cambios en commit message

### Requirement 16: Compliance y Gobernanza

**User Story:** Como desarrollador, quiero que el proyecto cumpla con estándares básicos, para facilitar auditorías futuras.

#### Acceptance Criteria

1. WHEN se genera SBOM THEN el sistema SHALL incluir todas las dependencias con versiones
2. WHEN se ejecuta pipeline THEN el sistema SHALL verificar licencias de dependencias
3. WHEN se detecta licencia incompatible THEN el sistema SHALL generar warning
4. WHEN se hace release THEN el sistema SHALL generar changelog automático
5. WHEN se hace release THEN el sistema SHALL tagear con versión semántica

### Requirement 17: Rollback y Recovery

**User Story:** Como desarrollador, quiero poder hacer rollback fácilmente, para recuperarme de deployments problemáticos.

#### Acceptance Criteria

1. WHEN se detecta problema en producción THEN el sistema SHALL permitir rollback con un click
2. WHEN se hace rollback THEN el sistema SHALL restaurar versión anterior en menos de 5 minutos
3. WHEN se hace rollback THEN el sistema SHALL notificar al desarrollador
4. WHEN se hace rollback THEN el sistema SHALL mantener logs de la versión problemática
5. WHEN se completa rollback THEN el sistema SHALL ejecutar health checks

### Requirement 18: Notificaciones

**User Story:** Como desarrollador, quiero recibir notificaciones relevantes, para estar informado sin spam.

#### Acceptance Criteria

1. WHEN falla pipeline THEN el sistema SHALL notificar por email
2. WHEN se completa deployment THEN el sistema SHALL notificar por email
3. WHEN se detecta vulnerabilidad crítica THEN el sistema SHALL notificar inmediatamente
4. WHEN se crea PR THEN el sistema SHALL notificar de checks pendientes
5. WHEN se configura notificaciones THEN el sistema SHALL permitir personalizar preferencias

---

## Priorización para Solo Dev

### Must Have (MVP)

- Requirement 1: CI/CD Automatizado ⭐
- Requirement 2: SAST (CodeQL) ⭐
- Requirement 3: SCA (npm audit + Dependabot) ⭐
- Requirement 4: Secret Scanning ⭐
- Requirement 5: Testing Automatizado ⭐
- Requirement 6: Linting y Formateo ⭐
- Requirement 7: Build Validation ⭐
- Requirement 9: Branch Protection ⭐

### Should Have (Post-MVP)

- Requirement 8: Docker Scanning
- Requirement 10: Gestión de Secretos
- Requirement 11: Deployment Automatizado
- Requirement 12: Health Checks

### Nice to Have (Futuro)

- Requirement 13: Logging Avanzado
- Requirement 14: Optimización Performance
- Requirement 15: Documentación Extendida
- Requirement 16: Compliance
- Requirement 17: Rollback Automatizado
- Requirement 18: Notificaciones Personalizadas

---

## Notas de Implementación

### Herramientas Gratuitas para Solo Dev

- **GitHub Actions**: CI/CD (2000 minutos/mes gratis)
- **CodeQL**: SAST (gratis para repos públicos/privados)
- **Dependabot**: SCA (gratis, integrado en GitHub)
- **GitHub Secret Scanning**: Detección de secretos (gratis)
- **Trivy**: Escaneo de contenedores (open source)
- **ESLint + Prettier**: Linting (open source)
- **Jest + Vitest**: Testing (open source)

### Filosofía: Shift Left pero Pragmático

- Detectar problemas temprano (en PR, no en producción)
- No bloquear desarrollo con checks excesivos
- Automatizar todo lo repetitivo
- Feedback rápido (< 10 min por pipeline)
- Fallar rápido en problemas críticos
- Warnings para problemas menores

### Estrategia de Seguridad

1. **Prevención**: Secret scanning, SAST, SCA
2. **Detección**: CodeQL, Dependabot alerts
3. **Respuesta**: Fallar pipeline en críticos, warnings en menores
4. **Mejora**: Dependabot PRs automáticos

### Flujo de Trabajo

```
develop (local) → feature/* → PR → CI checks → main → deployment
                                    ↓
                            SAST + SCA + Tests + Lint
```
