#!/bin/bash

# Script para procesar PRs de Dependabot
# Uso: ./scripts/process-dependabot-prs.sh

set -e

echo "🔍 Buscando PRs de Dependabot..."

# Obtener lista de PRs
prs=$(gh pr list --author "dependabot[bot]" --state open --json number,title,headRefName --jq '.[] | "\(.number)|\(.title)|\(.headRefName)"')

if [ -z "$prs" ]; then
  echo "✅ No hay PRs de Dependabot abiertos"
  exit 0
fi

echo "📋 PRs encontrados:"
echo "$prs" | while IFS='|' read -r number title branch; do
  echo "  - PR #$number: $title"
done

echo ""
echo "🚀 Procesando PRs..."

echo "$prs" | while IFS='|' read -r number title branch; do
  echo ""
  echo "📦 Procesando PR #$number: $title"
  
  # Verificar tipo de update
  if echo "$title" | grep -q "patch\|minor"; then
    echo "  ✓ Update patch/minor detectado"
    echo "  → Habilitando auto-merge..."
    
    if gh pr merge --auto --squash "$number" 2>/dev/null; then
      echo "  ✅ Auto-merge habilitado para PR #$number"
    else
      echo "  ⚠️  No se pudo habilitar auto-merge (puede que ya esté habilitado o haya conflictos)"
    fi
  else
    echo "  ⚠️  Update major detectado - requiere revisión manual"
    gh pr comment "$number" --body "⚠️ Este es un **major version update**. Por favor revisa manualmente antes de mergear."
  fi
done

echo ""
echo "✅ Proceso completado"
echo ""
echo "📊 Estado actual:"
gh pr list --author "dependabot[bot]" --state open
