#!/bin/bash

# Script para migrar tests a createIntegrationTestDataSource()
# Este script reemplaza el patrón de DataSource aislado por el helper compartido

set -e

echo "🔧 Migrando tests a createIntegrationTestDataSource()..."

# Lista de archivos a migrar
files=(
  "src/account/app/commands/upgrade-subscription/__tests__/handler.concurrency.spec.ts"
  "src/account/app/commands/complete-onboarding/__tests__/handler.integration.spec.ts"
  "src/account/app/commands/upgrade-subscription/__tests__/handler.integration.spec.ts"
  "src/account/app/commands/restore-subscription/__tests__/handler.integration.spec.ts"
  "src/account/app/queries/get-business-owner-by-user-id/__tests__/handler.integration.spec.ts"
  "src/account/app/queries/get-business-owner/__tests__/handler.integration.spec.ts"
  "src/account/app/commands/suspend-subscription/__tests__/handler.integration.spec.ts"
  "src/account/app/commands/create-business-owner/__tests__/handler.integration.spec.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "📝 Procesando: $file"
    
    # 1. Agregar import del helper si no existe
    if ! grep -q "createIntegrationTestDataSource" "$file"; then
      # Buscar la línea de imports de typeorm y agregar después
      sed -i '' "/import.*DataSource.*from 'typeorm'/a\\
import { createIntegrationTestDataSource, cleanDatabase } from '@test-utils/integration-test-helper';
" "$file"
    fi
    
    echo "  ✅ Import agregado"
  else
    echo "  ⚠️  Archivo no encontrado: $file"
  fi
done

echo ""
echo "✅ Imports agregados a todos los archivos"
echo ""
echo "⚠️  NOTA: Los archivos necesitan edición manual para:"
echo "   1. Reemplazar useFactory con useValue"
echo "   2. Crear dataSource con createIntegrationTestDataSource()"
echo "   3. Reemplazar repository.clear() con cleanDatabase()"
echo ""
echo "📖 Ver template en TEST_FAILURES_ANALYSIS.md"
