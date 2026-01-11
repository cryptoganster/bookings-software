# Branch Protection Rules
# Estas reglas aseguran que no se pueda hacer bypass de los checks de CI

resource "github_branch_protection" "protected_branches" {
  for_each = toset(var.protected_branches)

  repository_id = data.github_repository.repo.node_id
  pattern       = each.value

  # Requiere PR para mergear
  require_conversation_resolution = true

  # Requiere que el branch esté actualizado antes de mergear
  requires_strict_status_checks = true

  # Status checks requeridos del CI
  required_status_checks {
    strict = true # Requiere branch actualizado con base

    contexts = [
      "CI Pipeline Status",      # Job final que valida todo
      "Test Backend",            # Tests de backend
      "Test Frontend",           # Tests de frontend
      "Lint Code",               # Linting
      "TypeScript Type Check",   # Type checking
      "Check Code Formatting",   # Formato de código
      "Build Backend",           # Build de backend
      "Build Frontend",          # Build de frontend
      "Security Audit Dependencies",
      "Scan for Secrets",
    ]
  }

  # Requiere PRs con aprobaciones (solo si required_approvals > 0)
  dynamic "required_pull_request_reviews" {
    for_each = var.required_approvals > 0 ? [1] : []
    content {
      dismiss_stale_reviews           = true
      require_code_owner_reviews      = false
      required_approving_review_count = var.required_approvals
      require_last_push_approval      = true
    }
  }

  # Restricciones de push directo
  restricts_pushes = false # Permitir push a la branch (pero requiere PR para mergear)

  # Forzar reglas incluso para admins
  enforce_admins = var.enforce_admins

  # No permitir force push
  allows_force_pushes = false

  # No permitir eliminar la branch
  allows_deletions = false

  # Requiere commits firmados (opcional, descomentar si usan GPG)
  # requires_commit_signatures = true

  # Requiere historial lineal (opcional, para squash merges)
  # required_linear_history = true
}

# Output para verificar configuración
output "protected_branches" {
  description = "Branches with protection rules applied"
  value       = [for branch in github_branch_protection.protected_branches : branch.pattern]
}
