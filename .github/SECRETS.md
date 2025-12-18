# GitHub Secrets Configuration

Este documento describe los secretos necesarios para el CI/CD pipeline.

## Secretos Requeridos

### Para CI/CD Básico

Actualmente **NO se requieren secretos** para el pipeline básico de CI. Todas las operaciones de testing, linting y build funcionan sin credenciales adicionales.

### Para Deployment (Fase 3 - Opcional)

Si decides implementar deployment automatizado con Docker, necesitarás:

#### `DOCKER_USERNAME` (Opcional)
- **Descripción:** Usuario de Docker Hub o GitHub Container Registry
- **Cuándo se necesita:** Solo si vas a pushear imágenes Docker a un registry
- **Cómo obtenerlo:** 
  - Docker Hub: Tu username de https://hub.docker.com
  - GitHub Container Registry: Tu username de GitHub (gratis, recomendado)

#### `DOCKER_PASSWORD` (Opcional)
- **Descripción:** Token de acceso para Docker registry
- **Cuándo se necesita:** Solo si vas a pushear imágenes Docker
- **Cómo obtenerlo:**
  - Docker Hub: Settings → Security → New Access Token
  - GitHub Container Registry: Settings → Developer settings → Personal access tokens → Generate new token (classic)
    - Scopes necesarios: `write:packages`, `read:packages`, `delete:packages`

## Cómo Agregar Secretos en GitHub

1. Ve a tu repositorio en GitHub
2. Click en **Settings** (Configuración)
3. En el menú lateral, click en **Secrets and variables** → **Actions**
4. Click en **New repository secret**
5. Ingresa el nombre del secreto (ej: `DOCKER_USERNAME`)
6. Ingresa el valor del secreto
7. Click en **Add secret**

## Secretos para Desarrollo Local

Para desarrollo local, **NO uses los secretos de GitHub**. En su lugar:

1. Copia `.env.example` a `.env` en cada app
2. Completa los valores necesarios
3. **NUNCA** commitees archivos `.env` (ya están en `.gitignore`)

## Verificación de Secretos

Para verificar que los secretos están configurados correctamente:

```bash
# Los secretos NO son visibles en logs por seguridad
# GitHub automáticamente enmascara los valores en los logs del workflow
```

## Rotación de Secretos

**Recomendación:** Rotar secretos cada 90 días

1. Genera nuevo token/password
2. Actualiza el secreto en GitHub Settings
3. El próximo workflow usará el nuevo valor automáticamente
4. Revoca el token/password anterior

## Troubleshooting

### Error: "Secret not found"
- Verifica que el nombre del secreto coincida exactamente (case-sensitive)
- Verifica que el secreto esté en el nivel correcto (repository, environment, organization)

### Error: "Bad credentials"
- El token/password puede haber expirado
- Genera un nuevo token y actualiza el secreto

### Los secretos no se actualizan
- Los secretos se cargan al inicio del workflow
- Necesitas re-ejecutar el workflow después de actualizar un secreto

## Seguridad

⚠️ **IMPORTANTE:**
- **NUNCA** commitees secretos en el código
- **NUNCA** logees secretos (GitHub los enmascara automáticamente)
- **NUNCA** compartas secretos por email/chat
- Usa secretos de GitHub Actions para CI/CD
- Usa variables de entorno (`.env`) para desarrollo local
- Revisa regularmente los secretos y elimina los que no uses

## Referencias

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Docker Hub Access Tokens](https://docs.docker.com/docker-hub/access-tokens/)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
