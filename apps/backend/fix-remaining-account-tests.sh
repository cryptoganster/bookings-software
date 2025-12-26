#!/bin/bash

# Script para agregar createTestUser import a todos los archivos de account que lo necesiten

files=(
  "src/account/infra/persistence/repositories/__tests__/business-owner-write.repository.integration.spec.ts"
  "src/account/infra/persistence/repositories/__tests__/business-owner-read.repository.integration.spec.ts"
  "src/account/app/commands/suspend-subscription/__tests__/handler.integration.spec.ts"
  "src/account/app/commands/complete-onboarding/__tests__/handler.integration.spec.ts"
  "src/account/app/commands/upgrade-subscription/__tests__/handler.integration.spec.ts"
  "src/account/app/commands/restore-subscription/__tests__/handler.integration.spec.ts"
  "src/account/app/queries/get-business-owner/__tests__/handler.integration.spec.ts"
  "src/account/app/queries/get-business-owner-by-user-id/__tests__/handler.integration.spec.ts"
  "src/account/app/commands/upgrade-subscription/__tests__/handler.concurrency.spec.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    # Check if import already exists
    if ! grep -q "createTestUser" "$file"; then
      # Add import after the last import statement
      sed -i.bak "/^import.*from.*$/a\\
import { createTestUser } from '@test-utils/e2e-helpers';
" "$file" && rm "${file}.bak"
      echo "✓ Added import to $file"
    else
      echo "- Import already exists in $file"
    fi
  fi
done

echo ""
echo "✓ Imports added to all files"
