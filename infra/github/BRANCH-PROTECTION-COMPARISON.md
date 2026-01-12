# Branch Protection Rules - Comparison

**Comparación entre configuración actual en GitHub y configuración en Terraform**

---

## 📊 Resumen Ejecutivo

| Aspecto                              | GitHub Actual            | Terraform Config             | Status            |
| ------------------------------------ | ------------------------ | ---------------------------- | ----------------- |
| **Required Status Checks**           | ✅ 10 checks             | ✅ 10 checks                 | ✅ Sincronizado   |
| **Strict Status Checks**             | ✅ Enabled               | ✅ Enabled (`strict = true`) | ✅ Sincronizado   |
| **Required Linear History**          | ✅ Enabled               | ❌ **FALTA**                 | ⚠️ Desincronizado |
| **Enforce Admins**                   | ✅ Enabled               | ✅ Enabled                   | ✅ Sincronizado   |
| **Allow Force Pushes**               | ✅ Disabled              | ✅ Disabled                  | ✅ Sincronizado   |
| **Allow Deletions**                  | ✅ Disabled              | ✅ Disabled                  | ✅ Sincronizado   |
| **Required Conversation Resolution** | ✅ Enabled               | ✅ Enabled                   | ✅ Sincronizado   |
| **Required PR Reviews**              | ✅ Enabled (0 approvals) | ✅ Enabled (0 approvals)     | ✅ Sincronizado   |
| **Dismiss Stale Reviews**            | ✅ Enabled               | ✅ Enabled                   | ✅ Sincronizado   |
| **Require Last Push Approval**       | ❌ Disabled              | ✅ Enabled                   | ⚠️ Desincronizado |

---

## 🔍 Configuración Actual en GitHub

### Branch: `master`

```json
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Test Frontend",
      "CI Pipeline Status",
      "Scan for Secrets",
      "TypeScript Type Check",
      "Test Backend",
      "Build Backend",
      "Check Code Formatting",
      "Security Audit Dependencies",
      "Lint Code",
      "Build Frontend"
    ]
  },
  "enforce_admins": {
    "enabled": true
  },
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "require_last_push_approval": false,
    "required_approving_review_count": 0
  },
  "required_linear_history": {
    "enabled": true
  },
  "allow_force_pushes": {
    "enabled": false
  },
  "allow_deletions": {
    "enabled": false
  },
  "required_conversation_resolution": {
    "enabled": true
  },
  "restrictions": null
}
```

---

## 📝 Configuración en Terraform

### Archivo: `infra/github/branch-protection.tf`

```hcl
resource "github_branch_protection" "protected_branches" {
  for_each = toset(var.protected_branches)

  repository_id = data.github_repository.repo.node_id
  pattern       = each.value

  # ✅ Requiere conversación resuelta
  require_conversation_resolution = true

  # ✅ Status checks requeridos
  required_status_checks {
    strict = true  # ✅ Branch debe estar actualizado

    contexts = [
      "CI Pipeline Status",
      "Test Backend",
      "Test Frontend",
      "Lint Code",
      "TypeScript Type Check",
      "Check Code Formatting",
      "Build Backend",
      "Build Frontend",
      "Security Audit Dependencies",
      "Scan for Secrets",
    ]
  }

  # ✅ PRs con aprobaciones (0 por defecto)
  dynamic "required_pull_request_reviews" {
    for_each = var.required_approvals > 0 ? [1] : []
    content {
      dismiss_stale_reviews           = true
      require_code_owner_reviews      = false
      required_approving_review_count = var.required_approvals
      require_last_push_approval      = true  # ⚠️ Solo si required_approvals > 0
    }
  }

  # ✅ Forzar reglas para admins
  enforce_admins = var.enforce_admins

  # ✅ No permitir force push
  allows_force_pushes = false

  # ✅ No permitir eliminar branch
  allows_deletions = false

  # ❌ FALTA: required_linear_history
}
```

### Variables: `infra/github/variables.tf`

```hcl
variable "protected_branches" {
  default = ["master", "develop"]
}

variable "required_approvals" {
  default = 0
}

variable "enforce_admins" {
  default = true
}
```

---

## ⚠️ Diferencias Encontradas

### 1. Required Linear History (CRÍTICO)

**GitHub Actual:**

```json
"required_linear_history": {
  "enabled": true
}
```

**Terraform:**

```hcl
# ❌ FALTA ESTA CONFIGURACIÓN
```

**Impacto:**

- Esta es la configuración MÁS IMPORTANTE para la estrategia de rebase
- Sin esto en Terraform, si se re-aplica la configuración, se perdería
- **CRÍTICO** para mantener historia lineal

**Solución:**

```hcl
# Agregar a branch-protection.tf
require_linear_history = true
```

---

### 2. Require Last Push Approval

**GitHub Actual:**

```json
"require_last_push_approval": false
```

**Terraform:**

```hcl
require_last_push_approval = true  # Solo si required_approvals > 0
```

**Impacto:**

- Terraform tiene `require_last_push_approval = true` pero solo se aplica si `required_approvals > 0`
- Como `required_approvals = 0`, el bloque `required_pull_request_reviews` no se crea
- Resultado: GitHub tiene esta opción en `false`

**Estado:**

- ✅ Correcto para desarrollo solo
- ⚠️ Si se cambia `required_approvals` a 1+, se activará automáticamente

---

### 3. Protected Branches

**Terraform:**

```hcl
variable "protected_branches" {
  default = ["master", "develop"]
}
```

**GitHub Actual:**

- Solo `master` tiene protección visible
- No se encontró protección en `develop`

**Recomendación:**

- Si no usas `develop`, removerlo de la lista
- Actualizar a: `default = ["master"]`

---

## ✅ Configuración Recomendada para Terraform

### Actualización de `branch-protection.tf`

```hcl
resource "github_branch_protection" "protected_branches" {
  for_each = toset(var.protected_branches)

  repository_id = data.github_repository.repo.node_id
  pattern       = each.value

  # ✅ Requiere conversación resuelta
  require_conversation_resolution = true

  # ✅ NUEVO: Requiere historia lineal (CRÍTICO para rebase strategy)
  require_linear_history = true

  # ✅ Status checks requeridos
  required_status_checks {
    strict = true

    contexts = [
      "CI Pipeline Status",
      "Test Backend",
      "Test Frontend",
      "Lint Code",
      "TypeScript Type Check",
      "Check Code Formatting",
      "Build Backend",
      "Build Frontend",
      "Security Audit Dependencies",
      "Scan for Secrets",
    ]
  }

  # ✅ PRs con aprobaciones
  dynamic "required_pull_request_reviews" {
    for_each = var.required_approvals > 0 ? [1] : []
    content {
      dismiss_stale_reviews           = true
      require_code_owner_reviews      = false
      required_approving_review_count = var.required_approvals
      require_last_push_approval      = true
    }
  }

  # ✅ Forzar reglas para admins
  enforce_admins = var.enforce_admins

  # ✅ No permitir force push
  allows_force_pushes = false

  # ✅ No permitir eliminar branch
  allows_deletions = false
}
```

### Actualización de `variables.tf`

```hcl
variable "protected_branches" {
  description = "List of branches to protect"
  type        = list(string)
  default     = ["master"]  # Removido "develop" si no se usa
}
```

---

## 🚀 Configuraciones Adicionales Recomendadas

### 1. Block Branch Creation (Opcional)

Para bloquear creación de branches confusas como `dev`, `develop`, `development`:

```hcl
# Nuevo recurso en branch-protection.tf
resource "github_repository_ruleset" "block_confusing_branches" {
  name        = "block-confusing-branch-names"
  repository  = var.github_repo
  target      = "branch"
  enforcement = "active"

  conditions {
    ref_name {
      include = ["~ALL"]
      exclude = []
    }
  }

  rules {
    creation = true

    branch_name_pattern {
      operator = "regex"
      pattern  = "^(dev|develop|development|staging|stage)$"
      negate   = true
    }
  }
}
```

**Nota:** Esto requiere GitHub Enterprise o GitHub Team plan.

---

### 2. Require Signed Commits (Opcional)

```hcl
# Agregar a branch-protection.tf
require_signed_commits = true
```

**Beneficio:** Mayor seguridad, verifica identidad del committer

---

## 📋 Checklist de Actualización

- [ ] Agregar `require_linear_history = true` a `branch-protection.tf`
- [ ] Actualizar `protected_branches` a `["master"]` si no usas `develop`
- [ ] Ejecutar `terraform plan` para ver cambios
- [ ] Ejecutar `terraform apply` para aplicar cambios
- [ ] Verificar en GitHub que `required_linear_history` sigue activo
- [ ] Considerar agregar ruleset para bloquear branches confusas (opcional)
- [ ] Considerar agregar `require_signed_commits` (opcional)

---

## 🧪 Comandos para Verificar

### Ver configuración actual en GitHub

```bash
gh api repos/cryptoganster/bookings-software/branches/master/protection \
  --jq '{
    required_linear_history,
    required_status_checks: .required_status_checks.strict,
    enforce_admins: .enforce_admins.enabled,
    allow_force_pushes: .allow_force_pushes.enabled
  }'
```

### Aplicar cambios de Terraform

```bash
cd infra/github
terraform plan
terraform apply
```

### Verificar después de aplicar

```bash
gh api repos/cryptoganster/bookings-software/branches/master/protection \
  --jq '.required_linear_history'
```

---

## 🎯 Conclusión

**Estado Actual:** ⚠️ Mayormente sincronizado con 1 diferencia crítica

**Diferencia Crítica:**

- ❌ `require_linear_history` falta en Terraform

**Acción Requerida:**

1. Agregar `require_linear_history = true` a `branch-protection.tf`
2. Aplicar cambios con `terraform apply`
3. Verificar que la configuración se mantiene

**Prioridad:** 🔴 Alta - Esta configuración es CRÍTICA para la estrategia de rebase

---

**Fecha de Análisis:** January 12, 2026  
**Status:** ⚠️ Requiere Actualización  
**Prioridad:** 🔴 Alta
