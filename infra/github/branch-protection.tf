# Branch Protection Rules
# Estas reglas aseguran que no se pueda hacer bypass de los checks de CI

resource "github_branch_protection" "protected_branches" {
  for_each = toset(var.protected_branches)

  repository_id = data.github_repository.repo.node_id
  pattern       = each.value

  # Requiere que la conversación esté resuelta
  require_conversation_resolution = true

  # Status checks requeridos del CI
  required_status_checks {
    strict = true # Requiere branch actualizado con base

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
      # NOTE: "Auto Merge & Rebase" is NOT required to avoid deadlock
      # (it needs to complete AFTER all other checks pass)
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

  # Forzar reglas incluso para admins
  enforce_admins = var.enforce_admins

  # No permitir force push
  allows_force_pushes = false

  # No permitir eliminar la branch
  allows_deletions = false
}

# Output para verificar configuración
output "protected_branches" {
  description = "Branches with protection rules applied"
  value       = [for branch in github_branch_protection.protected_branches : branch.pattern]
}
