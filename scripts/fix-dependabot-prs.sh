#!/bin/bash

# Script para forzar que Dependabot PRs usen el workflow actualizado
# Uso: ./scripts/fix-dependabot-prs.sh

set -e

echo "🔍 Buscando PRs de Dependabot..."

# Obtener lista de PRs
prs=$(gh pr list --author "dependabot[bot]" --state open --json number,title --jq '.[] | "\(.number)|\(.title)"')

if [ -z "$prs" ]; then
  echo "✅ No hay PRs de Dependabot abiertos"
  exit 0
fi

echo "📋 PRs encontrados:"
echo "$prs" | while IFS='|' read -r number title; do
  echo "  - PR #$number: $title"
done

echo ""
read -p "¿Quieres que Dependabot rebase todos estos PRs? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Operación cancelada"
  exit 0
fi

echo ""
echo "🚀 Solicitando rebase a Dependabot..."

echo "$prs" | while IFS='|' read -r number title; do
  echo ""
  echo "📦 Procesando PR #$number: $title"
  
  if gh pr comment "$number" --body "@dependabot rebase" 2>/dev/null; then
    echo "  ✅ Rebase solicitado para PR #$number"
    echo "  ⏳ Dependabot actualizará el PR en unos momentos..."
  else
    echo "  ⚠️  No se pudo solicitar rebase para PR #$number"
  fi
  
  # Pequeña pausa para no saturar la API
  sleep 2
done

echo ""
echo "✅ Proceso completado"
echo ""
echo "📊 Los PRs se actualizarán automáticamente en unos minutos"
echo "   Puedes verificar el estado con: gh pr list --author 'dependabot[bot]' --state open"
