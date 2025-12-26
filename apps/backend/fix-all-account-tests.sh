#!/bin/bash

# Script to add createTestUser calls before BusinessOwnerModel saves in all account integration tests

echo "Fixing account integration tests..."

# Array of files that need fixing
files=(
  "src/account/app/commands/suspend-subscription/__tests__/handler.integration.spec.ts"
  "src/account/app/queries/get-business-owner-by-user-id/__tests__/handler.integration.spec.ts"
  "src/account/infra/persistence/factories/__tests__/business-owner.factory.integration.spec.ts"
  "src/account/app/commands/complete-onboarding/__tests__/handler.integration.spec.ts"
  "src/account/app/commands/upgrade-subscription/__tests__/handler.integration.spec.ts"
  "src/account/app/queries/get-business-owner/__tests__/handler.integration.spec.ts"
  "src/account/app/commands/restore-subscription/__tests__/handler.integration.spec.ts"
  "src/account/infra/persistence/repositories/__tests__/business-owner-read.repository.integration.spec.ts"
  "src/account/infra/persistence/repositories/__tests__/business-owner-write.repository.integration.spec.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    # Add import if not present
    if ! grep -q "createTestUser" "$file"; then
      # Find the last import line and add our import after it
      sed -i '' '/^import.*from/a\
import { createTestUser } from '\''@test-utils/e2e-helpers'\'';
' "$file" 2>/dev/null || sed -i '/^import.*from/a\import { createTestUser } from '\''@test-utils/e2e-helpers'\'';' "$file"
    fi
    
    echo "  ✓ Added import to $file"
  else
    echo "  ✗ File not found: $file"
  fi
done

echo ""
echo "✓ All files processed"
echo ""
echo "Note: You still need to manually add 'await createTestUser(dataSource, userId)' calls"
echo "before each 'await repository.save(businessOwnerModel)' line."
echo ""
echo "Run the tests to see which specific lines need the createTestUser calls."
