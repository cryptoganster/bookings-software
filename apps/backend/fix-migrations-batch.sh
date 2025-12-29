#!/bin/bash

# Batch fix script to add ensureMigrationsRun() calls to test files
# This script adds the import and call to all files that are missing it

# Array of files that need fixing (relative paths from apps/backend/)
files=(
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

echo "🔧 Fixing ${#files[@]} test files..."
echo ""

fixed_count=0
skipped_count=0

for file in "${files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "⚠️  File not found: $file"
    continue
  fi
  
  # Check if file already has ensureMigrationsRun import
  if grep -q "ensureMigrationsRun" "$file"; then
    echo "⏭️  Skipped (already has import): $file"
    ((skipped_count++))
    continue
  fi
  
  # Calculate path depth (number of ../ needed)
  depth=$(echo "$file" | tr -cd '/' | wc -c)
  depth=$((depth - 1))  # Subtract 1 because we're in src/
  
  # Build relative path
  rel_path=""
  for ((i=0; i<depth; i++)); do
    rel_path="../$rel_path"
  done
  rel_path="${rel_path}../test/test-setup"
  
  # Create backup
  cp "$file" "$file.bak"
  
  # Add import after last import statement
  awk -v import_line="import { ensureMigrationsRun } from '$rel_path';" '
    /^import / { last_import = NR }
    { lines[NR] = $0 }
    END {
      for (i = 1; i <= NR; i++) {
        print lines[i]
        if (i == last_import) {
          print import_line
        }
      }
    }
  ' "$file.bak" > "$file.tmp"
  
  # Add call in beforeAll
  awk '
    /beforeAll\(async \(\) => \{/ {
      print $0
      print "    await ensureMigrationsRun();"
      print ""
      next
    }
    { print }
  ' "$file.tmp" > "$file"
  
  # Clean up
  rm "$file.tmp" "$file.bak"
  
  echo "✅ Fixed: $file"
  ((fixed_count++))
done

echo ""
echo "📊 Summary:"
echo "  ✅ Fixed: $fixed_count files"
echo "  ⏭️  Skipped: $skipped_count files"
echo "  📝 Total: ${#files[@]} files"
echo ""
echo "🎉 Done! Run tests to verify:"
echo "   pnpm test \"src/database\" \"src/availability\" \"src/customer\" \"src/business\" \"src/account\" \"src/booking\" \"src/offering\""
