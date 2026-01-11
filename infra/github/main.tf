terraform {
  required_version = ">= 1.0"

  required_providers {
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }

  # Descomentar para usar backend remoto (recomendado para equipos)
  # backend "s3" {
  #   bucket = "your-terraform-state-bucket"
  #   key    = "github/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "github" {
  owner = var.github_owner
  # Token se configura via GITHUB_TOKEN env var
}

# Data source para obtener info del repositorio
data "github_repository" "repo" {
  full_name = "${var.github_owner}/${var.github_repo}"
}
