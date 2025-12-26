#!/bin/bash

# Script to add createUser helper to all integration tests that need it

# Helper function to add to files
add_helper_function() {
  local file=$1
  
  # Check if file already has the helper
  if grep -q "async function createUser" "$file"; then
    echo "✓ $file already has helper"
    return
  fi
  
  # Find the line with "beforeEach(async () => {"
  if grep -q "beforeEach(async () => {" "$file"; then
    # Add helper after the beforeEach block
    sed -i '' '/beforeEach(async () => {/,/^  });/a\
\
  /**\
   * Helper to create a user in the database\
   */\
  async function createUser(userId: string): Promise<void> {\
    await dataSource.query(\
      `INSERT INTO users (id, email, password, name, roles, is_active, email_verified, created_at)\
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())\
       ON CONFLICT (id) DO NOTHING`,\
      [\
        userId,\
        `user-${userId}@test.com`,\
        '"'"'hashed_password'"'"',\
        '"'"'Test User'"'"',\
        ['"'"'BUSINESS_OWNER'"'"'],\
        true,\
        true,\
      ],\
    );\
  }
' "$file"
    echo "✓ Added helper to $file"
  else
    echo "✗ Could not find beforeEach in $file"
  fi
}

# Find all integration test files in account and business
find apps/backend/src/account -name "*.integration.spec.ts" -type f | while read file; do
  add_helper_function "$file"
done

find apps/backend/src/business -name "*.integration.spec.ts" -type f | while read file; do
  add_helper_function "$file"
done

echo "Done!"
