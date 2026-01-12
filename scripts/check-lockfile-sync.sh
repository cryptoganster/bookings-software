#!/usr/bin/env bash

# Script to check if pnpm-lock.yaml is in sync with package.json files
# Usage: bash scripts/check-lockfile-sync.sh

set -e

echo "🔍 Checking pnpm-lock.yaml synchronization..."
echo ""

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
  echo "❌ ERROR: pnpm is not installed"
  echo ""
  echo "Install pnpm:"
  echo "  npm install -g pnpm@10"
  echo ""
  exit 1
fi

# Check if pnpm-lock.yaml exists
if [ ! -f "pnpm-lock.yaml" ]; then
  echo "❌ ERROR: pnpm-lock.yaml not found"
  echo ""
  echo "Run: pnpm install"
  echo ""
  exit 1
fi

# Try to install with frozen lockfile
echo "Validating lockfile..."
if pnpm install --lockfile-only --frozen-lockfile &>/dev/null; then
  echo ""
  echo "✅ SUCCESS: pnpm-lock.yaml is in sync with all package.json files"
  echo ""
  exit 0
else
  echo ""
  echo "❌ ERROR: pnpm-lock.yaml is OUT OF SYNC"
  echo ""
  echo "This means one or more package.json files have been modified"
  echo "without updating the lockfile."
  echo ""
  echo "Common causes:"
  echo "  - Manual edits to package.json"
  echo "  - Dependabot PR that didn't update lockfile"
  echo "  - Merge conflict resolution"
  echo ""
  echo "✅ TO FIX:"
  echo "   1. Update the lockfile:"
  echo "      pnpm install"
  echo ""
  echo "   2. Verify the changes:"
  echo "      git diff pnpm-lock.yaml"
  echo ""
  echo "   3. Commit the updated lockfile:"
  echo "      git add pnpm-lock.yaml"
  echo "      git commit -m 'chore: update pnpm-lock.yaml'"
  echo ""
  echo "   4. Push the changes:"
  echo "      git push"
  echo ""
  
  # Show which package.json files might be affected
  echo "📋 Checking which workspaces might be affected..."
  echo ""
  
  # List all package.json files
  find . -name "package.json" -not -path "*/node_modules/*" -exec echo "  - {}" \;
  
  echo ""
  exit 1
fi
