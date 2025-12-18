# GitHub Actions Workflows

This directory contains all CI/CD workflows for the Bookings Software project.

## 📋 Table of Contents

- [Workflows Overview](#workflows-overview)
- [CI Pipeline](#ci-pipeline)
- [CodeQL Security Analysis](#codeql-security-analysis)
- [Required Secrets](#required-secrets)
- [Trigger Conditions](#trigger-conditions)
- [Status Checks](#status-checks)
- [Troubleshooting](#troubleshooting)

---

## Workflows Overview

| Workflow | Purpose | Trigger | Duration |
|----------|---------|---------|----------|
| **CI Pipeline** | Code quality, security, tests, builds | Push, PR | ~8-12 min |
| **CodeQL** | Static security analysis (SAST) | Push, PR, Schedule | ~5-8 min |

---

## CI Pipeline

**File:** `ci.yml`

### Purpose
Comprehensive continuous integration pipeline that validates code quality, security, and functionality.

### Jobs

#### 1. Setup & Install Dependencies
- Installs pnpm and Node.js
- Installs all dependencies with frozen lockfile
- Caches node_modules for subsequent jobs

#### 2. Lint Code
- Runs ESLint on backend and frontend
- Fails on any linting errors
- **Requirements:** 6.1, 6.4

#### 3. Check Code Formatting
- Runs Prettier check on backend and frontend
- Fails if code is not properly formatted
- **Requirements:** 6.2, 6.5

#### 4. TypeScript Type Check
- Runs `tsc --noEmit` on backend and frontend
- Fails on any type errors
- **Requirements:** 6.3, 2.5

#### 5. Security Audit Dependencies
- Runs `pnpm audit` to check for vulnerabilities
- Fails on critical or high severity vulnerabilities
- Generates audit report artifact
- **Requirements:** 3.1, 3.2

#### 6. Check Dependency Licenses
- Scans all dependencies for licenses
- Fails on incompatible licenses (GPL, AGPL)
- Generates license report artifact
- **Requirements:** 3.4

#### 7. Scan for Secrets
- Uses TruffleHog to scan for exposed secrets
- Scans entire git history
- Fails immediately if secrets detected
- **Requirements:** 4.1, 4.2, 4.3

#### 8. Test Backend
- Runs Jest tests with coverage
- Uses PostgreSQL service container
- Uploads coverage artifacts
- **Requirements:** 5.1, 5.2, 5.4

#### 9. Test Frontend
- Runs Vitest tests with coverage
- Uploads coverage artifacts
- **Requirements:** 5.1, 5.4

#### 10. Check Test Coverage
- Downloads coverage from backend and frontend
- Checks if coverage >= 70%
- Warns if below threshold (doesn't fail)
- **Requirements:** 5.5

#### 11. Build Backend
- Runs `pnpm build` for backend
- Verifies dist folder created
- Caches build artifacts
- **Requirements:** 7.1, 7.3, 7.4

#### 12. Build Frontend
- Runs `pnpm build` for frontend
- Verifies dist folder created
- Caches build artifacts
- **Requirements:** 7.2, 7.3, 7.4

#### 13. Validate Monorepo Structure
- Validates pnpm workspace structure
- Checks for circular dependencies
- **Requirements:** 7.5

#### 14. CI Status
- Final job that checks all previous jobs
- Fails if any job failed
- Provides clear status message

### Artifacts Generated

| Artifact | Description | Retention |
|----------|-------------|-----------|
| `audit-report` | npm audit results (JSON) | 30 days |
| `license-report` | License scan results (JSON) | 30 days |
| `secret-scan-report` | TruffleHog results (JSON) | 30 days |
| `backend-coverage` | Backend test coverage | 30 days |
| `frontend-coverage` | Frontend test coverage | 30 days |

### Environment Variables

```yaml
NODE_VERSION: '20'
PNPM_VERSION: '8'
```

### Trigger Conditions

```yaml
on:
  push:
    branches: [main, develop, feature/**, fix/**, refactor/**]
  pull_request:
    branches: [main, develop]
```

---

## CodeQL Security Analysis

**File:** `codeql.yml`

### Purpose
Static Application Security Testing (SAST) using GitHub's CodeQL engine.

### Features
- Analyzes JavaScript/TypeScript code for security vulnerabilities
- Uses `security-extended` query suite for comprehensive analysis
- Fails on critical or high severity issues
- Uploads results to GitHub Security tab
- Runs on schedule (weekly) for continuous monitoring

### Query Suite
- **security-extended**: Comprehensive security analysis including:
  - SQL injection
  - XSS vulnerabilities
  - Command injection
  - Path traversal
  - Insecure cryptography
  - Authentication issues
  - Authorization bypasses

### Trigger Conditions

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 0 * * 1'  # Every Monday at 00:00 UTC
```

### Permissions Required

```yaml
permissions:
  actions: read
  contents: read
  security-events: write
```

---

## Required Secrets

Currently, no secrets are required for CI workflows. All tools used are free and don't require authentication.

**Future secrets (for CD pipeline):**
- `DOCKER_USERNAME` - Docker Hub username
- `DOCKER_PASSWORD` - Docker Hub password or token

See [SECRETS.md](../SECRETS.md) for detailed documentation.

---

## Status Checks

The following status checks are required to pass before merging to `main`:

### Required Checks
- ✅ Lint Code
- ✅ Check Code Formatting
- ✅ TypeScript Type Check
- ✅ Security Audit Dependencies
- ✅ Check Dependency Licenses
- ✅ Scan for Secrets
- ✅ Test Backend
- ✅ Test Frontend
- ✅ Build Backend
- ✅ Build Frontend
- ✅ Validate Monorepo Structure
- ✅ CodeQL Analysis

### Optional Checks
- ⚠️ Check Test Coverage (warns but doesn't fail)

---

## Troubleshooting

### Common Issues

#### 1. "pnpm: command not found"
**Cause:** pnpm not installed or not in PATH  
**Solution:** The workflow installs pnpm automatically. If running locally, install with:
```bash
npm install -g pnpm@8
```

#### 2. "Frozen lockfile error"
**Cause:** pnpm-lock.yaml is out of sync with package.json  
**Solution:** Run locally:
```bash
pnpm install
git add pnpm-lock.yaml
git commit -m "chore: update lockfile"
```

#### 3. "Critical vulnerabilities found"
**Cause:** Dependencies have known security issues  
**Solution:** 
```bash
# Check vulnerabilities
pnpm audit

# Update vulnerable packages
pnpm update

# If no fix available, check Dependabot PRs
```

#### 4. "Secrets detected"
**Cause:** TruffleHog found potential secrets in code  
**Solution:**
1. Review the secret scan report artifact
2. Remove the secret from code
3. Rotate the compromised secret
4. Add to `.gitignore` if it's a local config file
5. Use environment variables instead

#### 5. "Type check failed"
**Cause:** TypeScript compilation errors  
**Solution:**
```bash
# Check types locally
pnpm typecheck:backend
pnpm typecheck:frontend

# Fix errors and commit
```

#### 6. "Tests failed"
**Cause:** Unit or integration tests failing  
**Solution:**
```bash
# Run tests locally
pnpm test:backend
pnpm test:frontend

# Fix failing tests and commit
```

#### 7. "Build failed"
**Cause:** Build process errors  
**Solution:**
```bash
# Build locally to see errors
pnpm build:backend
pnpm build:frontend

# Fix build errors and commit
```

#### 8. "License check failed"
**Cause:** Dependency with incompatible license (GPL/AGPL)  
**Solution:**
1. Review license-report artifact
2. Find alternative package with compatible license
3. Or get legal approval for the license

#### 9. "CodeQL analysis failed"
**Cause:** Critical or high severity security issues found  
**Solution:**
1. Go to Security tab → Code scanning alerts
2. Review each alert
3. Fix the vulnerability
4. Re-run the workflow

#### 10. "Coverage below threshold"
**Cause:** Test coverage < 70%  
**Solution:**
```bash
# Check coverage locally
pnpm test:backend:coverage
pnpm test:frontend:coverage

# Add more tests to increase coverage
```

### Debugging Workflows Locally

Use [act](https://github.com/nektos/act) to run workflows locally:

```bash
# Install act
brew install act  # macOS
# or
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run CI workflow
act push

# Run specific job
act push -j lint

# Run with secrets
act push --secret-file .secrets
```

### Viewing Workflow Logs

1. Go to **Actions** tab in GitHub
2. Click on the workflow run
3. Click on the failed job
4. Expand the failed step to see logs

### Re-running Failed Workflows

1. Go to **Actions** tab
2. Click on the failed workflow run
3. Click **Re-run jobs** → **Re-run failed jobs**

---

## Performance Optimization

### Caching Strategy

The workflows use aggressive caching to speed up execution:

1. **pnpm cache**: Caches pnpm store
2. **node_modules cache**: Caches installed dependencies
3. **Build artifacts cache**: Caches compiled output

### Parallelization

Jobs run in parallel where possible:
- Lint, format, typecheck run in parallel
- Backend and frontend tests run in parallel
- Backend and frontend builds run in parallel

### Conditional Execution

Future optimization: Skip jobs based on changed files
- Skip backend tests if only frontend changed
- Skip frontend tests if only backend changed

---

## Metrics

Track these metrics over time:
- **Success Rate**: % of successful workflow runs
- **Average Duration**: Time to complete full pipeline
- **Failure Rate by Stage**: Which jobs fail most often
- **Coverage Trend**: Test coverage over time

---

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [CodeQL Documentation](https://codeql.github.com/docs/)
- [pnpm Documentation](https://pnpm.io/)
- [TruffleHog Documentation](https://github.com/trufflesecurity/trufflehog)

---

## Support

For issues with workflows:
1. Check this troubleshooting guide
2. Review workflow logs in GitHub Actions
3. Check [SETUP_GUIDE.md](../SETUP_GUIDE.md) for configuration
4. Open an issue in the repository
