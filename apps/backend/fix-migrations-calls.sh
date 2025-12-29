#!/bin/bash

# Script to add ensureMigrationsRun() calls to test files
# This fixes the database test isolation issue

set -e

echo "🔧 Adding ensureMigrationsRun() calls to test files..."

# Array of files that need fixing (remaining 17 files)
FILES=(
  "src/account/infra/persistence/factories/__tests__/business-owner.factory.integration.spec.ts"
  "src/account/infra/persistence/repositories/__tests__/business-owner-read.repository.integration.spec.ts"
  "src/account/infra/persistence/repositories/__tests__/business-owner-write.repository.integration.spec.ts"
  "src/account/presentation/controllers/__tests__/business-owner-profile.e2e.spec.ts"
  "src/availability/domain/aggregates/__tests__/capacity-concurrency.spec.ts"
  "src/availability/infra/persistence/factories/__tests__/blockout-factory.integration.spec.ts"
  "src/availability/infra/persistence/factories/__tests__/schedule-factory.integration.spec.ts"
  "src/availability/infra/persistence/repositories/__tests__/blockout-repositories.integration.spec.ts"
  "src/availability/infra/persistence/repositories/__tests__/schedule-repositories.integration.spec.ts"
  "src/booking/app/queries/get-customer-appointments/__tests__/handler.pbt.spec.ts"
  "src/booking/infra/persistence/repositories/__tests__/appointment-read.repository.spec.ts"
  "src/booking/infra/persistence/repositories/__tests__/appointment-write.repository.spec.ts"
  "src/business/app/queries/get-business-by-whatsapp-phone/__tests__/handler.integration.spec.ts"
  "src/business/app/queries/get-business/__tests__/handler.integration.spec.ts"
  "src/business/app/queries/get-businesses-by-owner-id/__tests__/handler.integration.spec.ts"
  "src/business/infra/persistence/factories/__tests__/business.factory.integration.spec.ts"
  "src/business/infra/persistence/repositories/__tests__/business-read.repository.integration.spec.ts"
  "src/business/infra/persistence/repositories/__tests__/business-write.repository.integration.spec.ts"
  "src/customer/app/commands/identify-customer/__tests__/handler.concurrency.spec.ts"
  "src/customer/app/commands/identify-customer/__tests__/handler.integration.spec.ts"
  "src/customer/presentation/controllers/__tests__/customer.controller.integration.spec.ts"
  "src/offering/infra/persistence/repositories/__tests__/offering-read.spec.ts"
  "src/offering/infra/persistence/repositories/__tests__/offering-write.spec.ts"
)

# Function to calculate relative path depth
get_relative_path() {
  local file=$1
  local depth=$(echo "$file" | tr -cd '/' | wc -c)
  local relative_path=""
  
  for ((i=0; i<depth; i++)); do
    relative_path="../$relative_path"
  done
  
  echo "${relative_path}../../../test/test-setup"
}

# Function to add import if not present
add_import() {
  local file=$1
  local relative_path=$(get_relative_path "$file")
  
  # Check if import already exists
  if grep -q "ensureMigrationsRun" "$file"; then
    echo "  ⏭️  Import already exists in $file"
    return 0
  fi
  
  # Find the last import line
  local last_import_line=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
  
  if [ -z "$last_import_line" ]; then
    echo "  ⚠️  No imports found in $file"
    return 1
  fi
  
  # Add import after last import
  sed -i "${last_import_line}a\\import { ensureMigrationsRun } from '${relative_path}';" "$file"
  echo "  ✅ Added import to $file"
}

# Function to add ensureMigrationsRun() call in beforeAll
add_migrations_call() {
  local file=$1
  
  # Check if call already exists
  if grep -q "await ensureMigrationsRun()" "$file"; then
    echo "  ⏭️  Call already exists in $file"
    return 0
  fi
  
  # Find beforeAll line
  local beforeall_line=$(grep -n "beforeAll(async () => {" "$file" | head -1 | cut -d: -f1)
  
  if [ -z "$beforeall_line" ]; then
    echo "  ⚠️  No beforeAll found in $file"
    return 1
  fi
  
  # Add call after beforeAll opening brace
  sed -i "${beforeall_line}a\\    await ensureMigrationsRun();\n" "$file"
  echo "  ✅ Added ensureMigrationsRun() call to $file"
}

# Process each file
count=0
for file in "${FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "  ⚠️  File not found: $file"
    continue
  fi
  
  echo ""
  echo "📝 Processing: $file"
  
  # Add import
  add_import "$file"
  
  # Add call
  add_migrations_call "$file"
  
  ((count++))
done

echo ""
echo "✅ Processed $count files"
echo ""
echo "🧪 Next steps:"
echo "  1. Review changes: git diff"
echo "  2. Run tests: pnpm test"
echo "  3. Commit changes: git add . && git commit -m 'fix: add ensureMigrationsRun() to all test files'"
