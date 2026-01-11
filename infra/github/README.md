# GitHub Infrastructure con Terraform

Configuración de branch protection rules y otras configuraciones de GitHub usando Terraform.

## Requisitos

- [Terraform](https://www.terraform.io/downloads) >= 1.0
- GitHub Personal Access Token con permisos `repo` y `admin:repo_hook`

## Setup

1. **Crear token de GitHub:**
   - Ve a GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Genera un token con permisos: `repo`, `admin:repo_hook`

2. **Configurar variables de entorno:**

   ```bash
   export GITHUB_TOKEN="ghp_xxxxxxxxxxxx"
   ```

3. **Copiar y configurar variables:**

   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Editar terraform.tfvars con tus valores
   ```

4. **Inicializar Terraform:**

   ```bash
   cd infra/github
   terraform init
   ```

5. **Revisar cambios:**

   ```bash
   terraform plan
   ```

6. **Aplicar cambios:**
   ```bash
   terraform apply
   ```

## Estructura

```
infra/github/
├── main.tf                    # Provider y configuración base
├── variables.tf               # Variables de entrada
├── branch-protection.tf       # Reglas de protección de branches
├── terraform.tfvars.example   # Ejemplo de variables
└── README.md                  # Esta documentación
```

## Branch Protection Rules

Las siguientes reglas se aplican a las branches protegidas (`master`, `develop`):

- ✅ Requiere Pull Request para mergear
- ✅ Requiere al menos 1 aprobación
- ✅ Descarta aprobaciones obsoletas cuando hay nuevos commits
- ✅ Requiere que la branch esté actualizada con base
- ✅ Requiere que pasen todos los status checks de CI
- ✅ No permite force push
- ✅ No permite eliminar la branch
- ✅ Aplica reglas incluso para admins

### Status Checks Requeridos

- `CI Pipeline Status` - Validación final del pipeline
- `Test Backend` - Tests de backend
- `Test Frontend` - Tests de frontend
- `Lint Code` - Linting
- `TypeScript Type Check` - Verificación de tipos
- `Check Code Formatting` - Formato de código
- `Build Backend` - Build de backend
- `Build Frontend` - Build de frontend
- `Security Audit Dependencies` - Auditoría de seguridad
- `Scan for Secrets` - Escaneo de secretos

## Troubleshooting

### Error: Resource not accessible by integration

Asegúrate de que el token tiene permisos `admin:repo_hook` y `repo`.

### Error: Branch protection rule already exists

Elimina la regla manualmente en GitHub o importa el recurso:

```bash
terraform import 'github_branch_protection.protected_branches["master"]' <repo_id>:master
```

### Ver estado actual

```bash
terraform show
```

## Seguridad

- **NUNCA** commitear `terraform.tfvars` con tokens o datos sensibles
- Usar variables de entorno para el token de GitHub
- Considerar usar un backend remoto (S3, Terraform Cloud) para el state
