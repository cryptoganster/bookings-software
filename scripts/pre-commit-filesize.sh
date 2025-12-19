#!/usr/bin/env bash

# File size limit check script for pre-commit hook
# Prevents committing files larger than 5MB

set -e

# Maximum file size in bytes (5MB = 5 * 1024 * 1024)
MAX_SIZE=5242880

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$STAGED_FILES" ]; then
  echo "✓ No staged files to check"
  exit 0
fi

# Files to exclude from size checking
should_exclude() {
  local file=$1
  case "$file" in
    pnpm-lock.yaml|package-lock.json|yarn.lock) return 0 ;;
    *.min.js|*.min.css) return 0 ;;
    dist/*|build/*|.next/*|node_modules/*) return 0 ;;
    *) return 1 ;;
  esac
}

# Check file sizes
LARGE_FILES_FOUND=0

echo "📏 Checking file sizes..."

for file in $STAGED_FILES; do
  # Skip if file should be excluded
  if should_exclude "$file"; then
    continue
  fi
  
  # Skip if file doesn't exist (deleted files)
  if [ ! -f "$file" ]; then
    continue
  fi
  
  # Get file size in bytes
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    FILE_SIZE=$(stat -f%z "$file" 2>/dev/null || echo 0)
  else
    # Linux
    FILE_SIZE=$(stat -c%s "$file" 2>/dev/null || echo 0)
  fi
  
  # Check if file exceeds limit
  if [ "$FILE_SIZE" -gt "$MAX_SIZE" ]; then
    # Convert to MB for display
    SIZE_MB=$(echo "scale=2; $FILE_SIZE / 1024 / 1024" | bc)
    echo "✗ File too large: $file ($SIZE_MB MB)"
    LARGE_FILES_FOUND=$((LARGE_FILES_FOUND + 1))
  fi
done

if [ $LARGE_FILES_FOUND -gt 0 ]; then
  echo ""
  echo "❌ File size check failed!"
  echo "$LARGE_FILES_FOUND file(s) exceed 5MB limit"
  echo ""
  echo "To fix:"
  echo "  1. Remove large files from commit"
  echo "  2. Use Git LFS for large binary files"
  echo "  3. Add to .gitignore if build artifacts"
  echo ""
  echo "To use Git LFS:"
  echo "  git lfs track \"*.bin\""
  echo "  git add .gitattributes"
  echo ""
  echo "To bypass (NOT RECOMMENDED):"
  echo "  git commit --no-verify"
  exit 1
fi

echo "✓ All files within size limit"
exit 0
