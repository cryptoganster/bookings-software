#!/bin/bash

# Fix all E2E test files to use UserRole enum instead of string literals

# Files to fix
FILES=(
  "src/account/app/__tests__/registration-flow.e2e.spec.ts"
  "src/account/app/__tests__/onboarding-flow.e2e.spec.ts"
  "src/account/app/__tests__/business-creation-limits.e2e.spec.ts"
  "src/account/app/__tests__/subscription-suspension-flow.e2e.spec.ts"
)

for file in "${FILES[@]}"; do
  echo "Fixing $file..."
  
  # Add UserRole import if not present
  if ! grep -q "import { UserRole }" "$file"; then
    # Find the line with RegisterCommand import and add UserRole import after it
    sed -i '' "/import { RegisterCommand }/a\\
import { UserRole } from '@auth/domain/vo/user-role';
" "$file"
  fi
  
  # Replace string literals with enum values
  # Handle both single-quoted and double-quoted strings
  sed -i '' "s/'BUSINESS_OWNER'/UserRole.BUSINESS_OWNER/g" "$file"
  sed -i '' 's/"BUSINESS_OWNER"/UserRole.BUSINESS_OWNER/g' "$file"
  sed -i '' "s/'CUSTOMER'/UserRole.CUSTOMER/g" "$file"
  sed -i '' 's/"CUSTOMER"/UserRole.CUSTOMER/g' "$file"
  
  echo "Fixed $file"
done

echo "All files fixed!"
