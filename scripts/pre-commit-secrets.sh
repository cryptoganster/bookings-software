#!/bin/bash

# Secret scanning script for pre-commit hook
# Detects common secret patterns in staged files

set -e

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Secret patterns to detect
declare -A PATTERNS=(
  ["AWS Access Key"]="AKIA[0-9A-Z]{16}"
  ["AWS Secret Key"]="aws_secret_access_key.*['\"][0-9a-zA-Z/+]{40}['\"]"
  ["Generic API Key"]="api[_-]?key.*['\"][0-9a-zA-Z]{32,}['\"]"
  ["Generic Secret"]="secret.*['\"][0-9a-zA-Z]{32,}['\"]"
  ["Private Key"]="-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----"
  ["GitHub Token"]="gh[pousr]_[0-9a-zA-Z]{36}"
  ["Slack Token"]="xox[baprs]-[0-9a-zA-Z-]+"
  ["Stripe Key"]="sk_live_[0-9a-zA-Z]{24,}"
  ["JWT Token"]="eyJ[A-Za-z0-9-_=]+\.eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]+"
  ["Password in URL"]="[a-zA-Z]{3,10}://[^/\\s:@]{3,20}:[^/\\s:@]{3,20}@.{1,100}"
)

# Files to exclude from scanning
EXCLUDE_PATTERNS=(
  "pnpm-lock.yaml"
  "package-lock.json"
  "*.min.js"
  "*.min.css"
  "dist/"
  "build/"
  "coverage/"
  ".next/"
  "node_modules/"
)

# Load .secretsignore if it exists
if [ -f ".secretsignore" ]; then
  while IFS= read -r line; do
    # Skip empty lines and comments
    [[ -z "$line" || "$line" =~ ^# ]] && continue
    EXCLUDE_PATTERNS+=("$line")
  done < ".secretsignore"
fi

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$STAGED_FILES" ]; then
  echo -e "${GREEN}✓${NC} No staged files to scan"
  exit 0
fi

# Function to check if file should be excluded
should_exclude() {
  local file=$1
  for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    if [[ "$file" == $pattern ]]; then
      return 0
    fi
  done
  return 1
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
  
  # Scan file for each pattern
  for pattern_name in "${!PATTERNS[@]}"; do
    pattern="${PATTERNS[$pattern_name]}"
    
    # Use grep with Perl regex for better pattern matching
    if grep -qP "$pattern" "$file" 2>/dev/null; then
      echo -e "${RED}✗${NC} Potential secret detected in ${YELLOW}$file${NC}"
      echo -e "  Pattern: ${YELLOW}$pattern_name${NC}"
      echo -e "  Regex: $pattern"
      echo ""
      SECRETS_FOUND=$((SECRETS_FOUND + 1))
    fi
  done
done

if [ $SECRETS_FOUND -gt 0 ]; then
  echo -e "${RED}❌ Secret scanning failed!${NC}"
  echo -e "${YELLOW}$SECRETS_FOUND potential secret(s) detected${NC}"
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

echo -e "${GREEN}✓${NC} No secrets detected"
exit 0
