variable "github_owner" {
  description = "GitHub organization or user name"
  type        = string
  default     = "cryptoganster"
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "bookings-software"
}

variable "protected_branches" {
  description = "List of branches to protect"
  type        = list(string)
  default     = ["master", "develop"]
}

variable "required_approvals" {
  description = "Number of required PR approvals (0 for solo dev)"
  type        = number
  default     = 0
}

variable "enforce_admins" {
  description = "Enforce rules for admins too"
  type        = bool
  default     = true
}
