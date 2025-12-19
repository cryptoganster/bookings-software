#!/usr/bin/env bash

# Secret scanning script for pre-commit hook
# Detects common secret patterns in staged files

set -e

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$STAGED_FILES" ]; then
  echo "✓ No staged files to scan"
  exit 0
fi

# Files to exclude from scanning
should_exclude() {
  local file=$1
  
  # Check .secretsignore if it exists
  if [ -f ".secretsignore" ]; then
    while IFS= read -r pattern; do
      # Skip empty lines and comments
      [[ -z "$pattern" || "$pattern" =~ ^# ]] && continue
      # Check if file matches pattern
      if [[ "$file" == $pattern || "$file" == *"$pattern"* ]]; then
        return 0
      fi
    done < ".secretsignore"
  fi
  
  # Default exclusions
  case "$file" in
    pnpm-lock.yaml|package-lock.json|*.min.js|*.min.css) return 0 ;;
    dist/*|build/*|coverage/*|.next/*|node_modules/*) return 0 ;;
    *) return 1 ;;
  esac
}

# Scan files
SECRETS_FOUND=0

echo "🔍 Scanning staged files for secrets..."

for file in $STAGED_FILES; do
  # Skip if file should be excluded
  if should_exclude "$file"; then
    continue
  fi
  
  # Skip if file doesn't exist (deleted files)
  if [ ! -f "$file" ]; then
    continue
  fi
  
  # Check for AWS Access Keys
  if grep -qE "AKIA[0-9A-Z]{16}" "$file" 2>/dev/null; then
    echo "✗ Potential AWS Access Key detected in $file"
    SECRETS_FOUND=$((SECRETS_FOUND + 1))
  fi
  
  # Check for AWS Secret Keys
  if grep -qE "aws_secret_access_key" "$file" 2>/dev/null; then
    echo "✗ Potential AWS Secret Key detected in $file"
    SECRETS_FOUND=$((SECRETS_FOUND + 1))
  fi
  
  # Check for Generic API Keys
  if grep -qE "api[_-]?key.*['\"][0-9a-zA-Z]{32,}['\"]" "$file" 2>/dev/null; then
    echo "✗ Potential API Key detected in $file"
    SECRETS_FOUND=$((SECRETS_FOUND + 1))
  fi
  
  # Check for Private Keys
  if grep -qE "BEGIN.*PRIVATE KEY" "$file" 2>/dev/null; then
    echo "✗ Potential Private Key detected in $file"
    SECRETS_FOUND=$((SECRETS_FOUND + 1))
  fi
  
  # Check for GitHub Tokens
  if grep -qE "gh[pousr]_[0-9a-zA-Z]{36}" "$file" 2>/dev/null; then
    echo "✗ Potential GitHub Token detected in $file"
    SECRETS_FOUND=$((SECRETS_FOUND + 1))
  fi
  
  # Check for Slack Tokens
  if grep -qE "xox[baprs]-" "$file" 2>/dev/null; then
    echo "✗ Potential Slack Token detected in $file"
    SECRETS_FOUND=$((SECRETS_FOUND + 1))
  fi
  
  # Check for Stripe Keys
  if grep -qE "sk_live_" "$file" 2>/dev/null; then
    echo "✗ Potential Stripe Key detected in $file"
    SECRETS_FOUND=$((SECRETS_FOUND + 1))
  fi
  
  # Check for JWT Tokens (long ones)
  if grep -qE "eyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}" "$file" 2>/dev/null; then
    echo "✗ Potential JWT Token detected in $file"
    SECRETS_FOUND=$((SECRETS_FOUND + 1))
  fi
  
  # Check for Passwords in URLs
  if grep -qE "://[^/\s:@]{3,20}:[^/\s:@]{3,20}@" "$file" 2>/dev/null; then
    echo "✗ Potential Password in URL detected in $file"
    SECRETS_FOUND=$((SECRETS_FOUND + 1))
  fi
done

if [ $SECRETS_FOUND -gt 0 ]; then
  echo ""
  echo "❌ Secret scanning failed!"
  echo "$SECRETS_FOUND potential secret(s) detected"
  echo ""
  echo "To fix:"
  echo "  1. Remove the secrets from the files"
  echo "  2. Use environment variables instead"
  echo "  3. Add false positives to .secretsignore"
  echo ""
  echo "To bypass (NOT RECOMMENDED):"
  echo "  git commit --no-verify"
  exit 1
fi

echo "✓ No secrets detected"
exit 0
