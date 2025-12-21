# Design Document - Husky Pre-Commit Hooks

## Overview

This document describes the architecture and implementation strategy for Husky pre-commit hooks in the monorepo. The system will enforce code quality standards at commit time, preventing low-quality code from entering the repository.

**Key Design Principles:**

- **Fail-Fast:** Catch issues early before they reach CI/CD
- **Developer-Friendly:** Clear error messages and quick fixes
- **Performance:** Checks run only on staged files, completing in < 10 seconds
- **Monorepo-Aware:** Different checks for different workspaces
- **Consistent:** Same configuration for all developers

## Architecture

### High-Level Flow

```
Developer runs: git commit
        ↓
Husky intercepts commit
        ↓
Pre-commit hook executes
        ↓
┌─────────────────────────────────────────┐
│ Sequential Checks (stop on first fail)  │
├─────────────────────────────────────────┤
│ 1. Lint-staged (ESLint on staged files) │
│ 2. Prettier (format check)              │
│ 3. TypeScript (type checking)           │
│ 4. Commit message validation            │
│ 5. Secret scanning                      │
│ 6. File size limits                     │
└─────────────────────────────────────────┘
        ↓
All checks pass?
        ├─ YES → Commit allowed ✅
        └─ NO  → Commit blocked ❌
                 Show error message
                 Developer fixes issues
                 Retry commit
```

### Components

#### 1. Husky Core

- **Purpose:** Git hooks manager
- **Location:** `.husky/` directory
- **Files:**
  - `.husky/pre-commit` - Main pre-commit hook script
  - `.husky/.gitignore` - Ignore hook files from Git
  - `.husky/_/husky.sh` - Husky runtime

#### 2. Lint-Staged

- **Purpose:** Run linters only on staged files
- **Configuration:** `.lintstagedrc.json` or `lint-staged` in `package.json`
- **Behavior:**
  - Detects changed files by workspace
  - Runs ESLint only on staged TypeScript/JavaScript files
  - Runs Prettier only on staged files
  - Runs TypeScript only on staged TypeScript files

#### 2.1. ESLint Custom Rule - Path Alias Enforcement

- **Purpose:** Enforce TypeScript path aliases in all internal imports
- **Implementation:** Custom ESLint rule in `eslint-local-rules.cjs`
- **Rule Name:** `local-rules/enforce-path-aliases`
- **Configuration:** Activated in `eslint.config.mjs`
- **Behavior:**
  - Detects relative imports (starting with `.` or `..`)
  - Validates that only permitted aliases are used
  - Provides autofix to convert relative imports to aliases
  - Reports error if non-permitted alias is used
- **Permitted Aliases:**
  - `@packages/shared-types` - Shared types package
  - `@shared/*` - Shared kernel (backend)
  - `@booking/*`, `@conversation/*`, `@auth/*`, `@availability/*`, `@offering/*`, `@customer/*` - Bounded Contexts
  - `@test-utils/*`, `@database/*`, `@config/*` - Utilities
- **Autofix:** Automatically converts relative imports to appropriate path aliases
- **Integration:** Runs as part of ESLint during lint-staged execution

#### 3. Commit Message Validation

- **Tool:** `commitlint` with `@commitlint/config-conventional`
- **Configuration:** `commitlint.config.js`
- **Format:** Conventional Commits (`<type>: <description>`)
- **Types:** feat, fix, refactor, test, docs, style, perf, chore

#### 4. Secret Scanning

- **Tool:** `detect-secrets` or `truffleHog` (lightweight version)
- **Configuration:** `.secretsignore` for false positives
- **Behavior:** Scans staged files for common secret patterns

#### 5. File Size Limits

- **Tool:** Custom script or `husky-pre-commit-hook`
- **Limit:** 5MB per file
- **Exceptions:** Binary files (images, videos) can be excluded

### Directory Structure

```
.
├── .husky/
│   ├── _/
│   │   └── husky.sh              # Husky runtime
│   ├── pre-commit                # Main pre-commit hook
│   └── .gitignore
├── .lintstagedrc.json            # Lint-staged configuration
├── commitlint.config.js          # Commit message validation
├── .secretsignore                # Secret scanning exceptions
├── package.json                  # Dependencies + prepare script
└── .kiro/
    └── steering/
        └── husky-precommit.md    # Developer guide
```

## Components and Interfaces

### 1. Pre-Commit Hook Script

**File:** `.husky/pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run all checks in sequence
pnpm run pre-commit:check
```

### 2. Pre-Commit Check Script

**File:** `scripts/pre-commit-check.sh` (or npm script)

```bash
#!/bin/bash
set -e  # Exit on first error

echo "🔍 Running pre-commit checks..."

# 1. Lint-staged
echo "📝 Linting staged files..."
pnpm exec lint-staged

# 2. Commit message validation
echo "✍️  Validating commit message..."
pnpm exec commitlint --edit

# 3. Secret scanning
echo "🔐 Scanning for secrets..."
pnpm run pre-commit:secrets

# 4. File size limits
echo "📦 Checking file sizes..."
pnpm run pre-commit:filesize

echo "✅ All checks passed!"
```

### 3. Lint-Staged Configuration

**File:** `.lintstagedrc.json`

```json
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{js,jsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,yml,yaml}": ["prettier --write"],
  "apps/backend/src/**/*.ts": ["eslint --fix", "prettier --write"],
  "apps/frontend/src/**/*.{ts,tsx}": ["eslint --fix", "prettier --write"]
}
```

### 3.1. Custom ESLint Rule - Path Alias Enforcement

**File:** `apps/backend/eslint-local-rules.cjs`

**Implementation:**

```javascript
module.exports = {
  "enforce-path-aliases": {
    meta: {
      type: "problem",
      docs: {
        description:
          "Enforce TypeScript path aliases instead of relative imports",
        category: "Best Practices",
      },
      fixable: "code",
      schema: [],
    },
    create(context) {
      const allowedAliases = [
        "@packages/shared-types",
        "@shared",
        "@booking",
        "@conversation",
        "@auth",
        "@availability",
        "@offering",
        "@customer",
        "@test-utils",
        "@database",
        "@config",
      ];

      const aliasMap = {
        "src/shared": "@shared",
        "src/booking": "@booking",
        "src/conversation": "@conversation",
        "src/auth": "@auth",
        "src/availability": "@availability",
        "src/offering": "@offering",
        "src/customer": "@customer",
        "src/test-utils": "@test-utils",
        "src/database": "@database",
        "src/config": "@config",
      };

      return {
        ImportDeclaration(node) {
          const importPath = node.source.value;

          // Check for relative imports
          if (importPath.startsWith(".")) {
            // Determine correct alias
            const correctAlias = determineAlias(
              importPath,
              context.getFilename(),
            );

            context.report({
              node: node.source,
              message: `Use path alias instead of relative import. Should be: ${correctAlias}`,
              fix(fixer) {
                return fixer.replaceText(node.source, `'${correctAlias}'`);
              },
            });
          }

          // Check for non-permitted aliases
          if (importPath.startsWith("@")) {
            const aliasPrefix = importPath.split("/")[0];
            if (!allowedAliases.some((a) => importPath.startsWith(a))) {
              context.report({
                node: node.source,
                message: `Invalid path alias '${aliasPrefix}'. Allowed: ${allowedAliases.join(", ")}`,
              });
            }
          }
        },
      };
    },
  },
};
```

**Configuration in `eslint.config.mjs`:**

```javascript
export default [
  {
    files: ["src/**/*.ts"],
    rules: {
      "local-rules/enforce-path-aliases": "error",
    },
  },
];
```

**TypeScript Configuration (`tsconfig.json`):**

```json
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@packages/shared-types": ["../../packages/shared-types/src/index.ts"],
      "@shared/*": ["src/shared/*"],
      "@booking/*": ["src/booking/*"],
      "@conversation/*": ["src/conversation/*"],
      "@auth/*": ["src/auth/*"],
      "@availability/*": ["src/availability/*"],
      "@offering/*": ["src/offering/*"],
      "@customer/*": ["src/customer/*"],
      "@test-utils/*": ["src/test-utils/*"],
      "@database/*": ["src/database/*"],
      "@config/*": ["src/config/*"]
    }
  }
}
```

**Jest Configuration (`package.json`):**

```json
{
  "jest": {
    "moduleNameMapper": {
      "^@shared/(.*)$": "<rootDir>/shared/$1",
      "^@booking/(.*)$": "<rootDir>/booking/$1",
      "^@conversation/(.*)$": "<rootDir>/conversation/$1",
      "^@auth/(.*)$": "<rootDir>/auth/$1",
      "^@availability/(.*)$": "<rootDir>/availability/$1",
      "^@offering/(.*)$": "<rootDir>/offering/$1",
      "^@customer/(.*)$": "<rootDir>/customer/$1",
      "^@test-utils/(.*)$": "<rootDir>/test-utils/$1",
      "^@database/(.*)$": "<rootDir>/database/$1",
      "^@config/(.*)$": "<rootDir>/config/$1"
    }
  }
}
```

### 4. Commit Message Validation

**File:** `commitlint.config.js`

```javascript
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // New feature
        "fix", // Bug fix
        "refactor", // Code refactoring
        "test", // Tests
        "docs", // Documentation
        "style", // Code style (formatting)
        "perf", // Performance improvement
        "chore", // Maintenance
        "ci", // CI/CD changes
      ],
    ],
    "subject-case": [2, "never", ["start-case", "pascal-case", "upper-case"]],
    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],
    "type-case": [2, "always", "lowercase"],
    "type-empty": [2, "never"],
  },
};
```

### 5. Secret Scanning Script

**File:** `scripts/pre-commit-secrets.sh`

```bash
#!/bin/bash

# Get staged files
STAGED_FILES=$(git diff --cached --name-only)

# Patterns to detect
PATTERNS=(
  "AKIA[0-9A-Z]{16}"           # AWS Access Key
  "aws_secret_access_key"       # AWS Secret
  "private_key"                 # Private keys
  "password"                    # Passwords
  "api_key"                     # API keys
  "secret"                      # Generic secrets
)

# Check each file
for file in $STAGED_FILES; do
  for pattern in "${PATTERNS[@]}"; do
    if grep -q "$pattern" "$file" 2>/dev/null; then
      echo "⚠️  Potential secret detected in $file: $pattern"
      echo "Use --no-verify to bypass (not recommended)"
      exit 1
    fi
  done
done

exit 0
```

### 6. File Size Limit Script

**File:** `scripts/pre-commit-filesize.sh`

```bash
#!/bin/bash

MAX_SIZE=$((5 * 1024 * 1024))  # 5MB in bytes

# Get staged files
STAGED_FILES=$(git diff --cached --name-only)

for file in $STAGED_FILES; do
  if [ -f "$file" ]; then
    SIZE=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)

    if [ "$SIZE" -gt "$MAX_SIZE" ]; then
      echo "❌ File too large: $file ($(numfmt --to=iec $SIZE 2>/dev/null || echo $SIZE bytes))"
      echo "Maximum allowed: 5MB"
      exit 1
    fi
  fi
done

exit 0
```

## Data Models

### Husky Configuration

```typescript
interface HuskyConfig {
  hooks: {
    "pre-commit": string; // Path to pre-commit script
  };
}
```

### Lint-Staged Configuration

```typescript
interface LintStagedConfig {
  [filePattern: string]: string[]; // Pattern → commands to run
}
```

### Commit Message

```typescript
interface CommitMessage {
  type:
    | "feat"
    | "fix"
    | "refactor"
    | "test"
    | "docs"
    | "style"
    | "perf"
    | "chore"
    | "ci";
  scope?: string;
  description: string;
  body?: string;
  footer?: string;
}

// Example: "feat(booking): implement appointment cancellation"
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Pre-Commit Hook Execution

**For any** staged files, when a developer attempts to commit, the pre-commit hook should execute before the commit is finalized.

**Validates: Requirements 1.1, 1.2**

### Property 2: Lint-Staged File Filtering

**For any** set of staged files, lint-staged should only run linters on files matching the configured patterns (e.g., only TypeScript files for ESLint).

**Validates: Requirements 2.1, 2.2**

### Property 2.1: Path Alias Enforcement

**For any** internal import in staged TypeScript files, if it uses a relative path (starting with `.` or `..`), the ESLint rule should detect it and suggest the appropriate path alias.

**For any** internal import using a non-permitted path alias, the ESLint rule should report an error.

**Validates: Requirements 2.1.1, 2.1.2, 2.1.4**

### Property 3: Commit Blocking on Lint Failure

**For any** staged files with linting errors, the pre-commit hook should block the commit and display the errors.

**Validates: Requirements 2.2, 2.3**

### Property 4: Commit Message Format Validation

**For any** commit message, if it does not follow the conventional commits format, the commit should be blocked.

**Validates: Requirements 5.1, 5.2**

### Property 5: Secret Detection

**For any** staged files containing patterns matching known secret formats, the pre-commit hook should detect and block the commit.

**Validates: Requirements 6.1, 6.2**

### Property 6: File Size Enforcement

**For any** staged file larger than 5MB, the pre-commit hook should block the commit.

**Validates: Requirements 7.1, 7.2**

### Property 7: Monorepo Workspace Isolation

**For any** set of staged files from a single workspace, only checks relevant to that workspace should run.

**Validates: Requirements 8.1, 8.2, 8.3**

### Property 8: Hook Bypass Mechanism

**For any** commit with `--no-verify` flag, all pre-commit hooks should be skipped.

**Validates: Requirements 11.1, 11.2**

### Property 9: Consistent Configuration Across Developers

**For any** developer cloning the repository and running `pnpm install`, the same Husky hooks should be installed.

**Validates: Requirements 12.1, 12.2**

### Property 10: Performance Threshold

**For any** typical commit with staged files, the pre-commit hook should complete in less than 10 seconds.

**Validates: Requirements 9.1**

## Error Handling

### Lint Errors

```
❌ ESLint Error in apps/backend/src/booking/domain/aggregates/appointment.ts:42
   Unexpected var, use let or const instead

Fix: Run `pnpm lint:fix` to auto-fix, or edit manually
```

### Path Alias Errors

```
❌ ESLint Error in apps/backend/src/customer/app/commands/identify-customer/handler.ts:5
   Use path alias instead of relative import
   Import: '../../../domain/aggregates/customer'
   Should be: '@customer/domain/aggregates/customer'

Fix: Run `pnpm lint:fix` to auto-fix, or edit manually

❌ ESLint Error in apps/backend/src/booking/app/commands/create-appointment/handler.ts:8
   Invalid path alias '@utils/something'
   Allowed aliases: @packages/shared-types, @shared/*, @booking/*, @conversation/*, @auth/*, @availability/*, @offering/*, @customer/*, @test-utils/*, @database/*, @config/*

Fix: Use one of the permitted aliases
```

### Type Errors

```
❌ TypeScript Error in apps/frontend/src/features/auth/login/ui/LoginForm.tsx:15
   Property 'email' does not exist on type 'LoginFormData'

Fix: Check your types and fix the error manually
```

### Commit Message Error

```
❌ Commit message validation failed
   Current: "fix bug in appointment"
   Expected format: "<type>: <description>"
   Example: "fix(booking): resolve appointment cancellation issue"

Types: feat, fix, refactor, test, docs, style, perf, chore, ci
```

### Secret Detected

```
❌ Potential secret detected in .env.local
   Pattern: "AKIA[0-9A-Z]{16}" (AWS Access Key)

Action: Remove the secret and try again
Warning: Use --no-verify only in emergencies
```

### File Too Large

```
❌ File too large: apps/backend/dist/main.js (12.5MB)
   Maximum allowed: 5MB

Solution: Use Git LFS for large files or remove from staging
```

## Testing Strategy

### Unit Tests

- Test individual check scripts (lint, format, type check)
- Test commit message validation regex
- Test file size calculation
- Test secret pattern detection

### Integration Tests

- Test full pre-commit hook flow with various file combinations
- Test monorepo workspace detection
- Test hook bypass with `--no-verify`
- Test error messages and formatting

### Property-Based Tests

- **Property 1:** For any valid staged files, hook executes
- **Property 2:** For any file pattern, lint-staged filters correctly
- **Property 3:** For any lint error, commit is blocked
- **Property 4:** For any invalid commit message, validation fails
- **Property 5:** For any secret pattern, detection succeeds
- **Property 6:** For any file > 5MB, size check fails
- **Property 7:** For any workspace, only relevant checks run
- **Property 8:** For any `--no-verify` commit, hooks are skipped
- **Property 9:** For any developer setup, hooks are consistent
- **Property 10:** For any typical commit, hook completes < 10s

### Test Framework

- **Unit/Integration:** Jest (backend), Vitest (frontend)
- **Property-Based:** fast-check
- **E2E:** Git command simulation with temporary repos

## Deployment Strategy

### Phase 1: Installation

1. Add dependencies to `package.json`
2. Create `.husky` directory and scripts
3. Create configuration files (`.lintstagedrc.json`, `commitlint.config.js`)
4. Add `prepare` script to `package.json`

### Phase 2: Testing

1. Test on local machine with various scenarios
2. Test with team members
3. Verify no false positives
4. Document common issues

### Phase 3: Rollout

1. Commit all Husky files to Git
2. Announce to team
3. Provide documentation and troubleshooting guide
4. Monitor for issues

### Phase 4: Monitoring

1. Track hook bypass usage (`--no-verify`)
2. Monitor for common failures
3. Adjust thresholds if needed
4. Gather feedback from team

## Performance Considerations

### Optimization Strategies

1. **Lint-staged:** Only lint changed files, not entire codebase
2. **Parallel Execution:** Run independent checks in parallel (future)
3. **Caching:** Cache ESLint and TypeScript results
4. **Incremental Checks:** Skip checks for unchanged files

### Performance Targets

- Typical commit: < 5 seconds
- Large commit: < 10 seconds
- Maximum: 15 seconds (before timeout)

### Monitoring

- Log execution time for each check
- Alert if any check exceeds threshold
- Provide metrics dashboard (future)

## Security Considerations

### Secret Scanning

- Use pattern-based detection for common secrets
- Maintain `.secretsignore` for false positives
- Document how to add new patterns
- Never log actual secrets

### Bypass Mechanism

- `--no-verify` flag available but discouraged
- CI/CD still validates code before merge
- Document when bypass is acceptable
- Track bypass usage for audit

### File Integrity

- Verify hook scripts haven't been tampered with
- Use checksums for critical scripts
- Require code review for hook changes

## Maintenance and Updates

### Regular Tasks

- Update dependencies monthly
- Review and update secret patterns quarterly
- Monitor for new ESLint/Prettier rules
- Gather team feedback

### Version Management

- Pin dependency versions in `package.json`
- Document breaking changes
- Provide migration guide for major updates
- Test updates before rolling out

### Documentation

- Keep `.kiro/steering/husky-precommit.md` updated
- Document all configuration options
- Provide troubleshooting guide
- Include examples for common scenarios
