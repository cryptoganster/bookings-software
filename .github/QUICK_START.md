# CI/CD Quick Start Guide

Quick reference for using the CI/CD pipelines.

---

## For Developers

### Before Pushing Code

```bash
# Run checks locally
pnpm lint              # Check code style
pnpm format:check      # Check formatting
pnpm typecheck         # Check TypeScript
pnpm test              # Run tests

# Fix issues
pnpm lint:fix          # Auto-fix lint issues
pnpm format            # Auto-format code
```

### Creating a Pull Request

1. **Push your branch**
   ```bash
   git push origin feature/my-feature
   ```

2. **CI runs automatically**
   - Linting, formatting, type checking
   - Security scans (CodeQL, audit, secrets)
   - Tests (backend + frontend)
   - Build validation

3. **Check CI status**
   - Go to PR page on GitHub
   - See status checks at bottom
   - Click "Details" to see logs

4. **Fix failures**
   - Read error messages in logs
   - Fix issues locally
   - Push again (CI re-runs automatically)

### Merging to Main

- ✅ All CI checks must pass
- ✅ PR must be approved (if required)
- ✅ Branch must be up to date
- ❌ Cannot force push to main

---

## For Maintainers

### Deploying to Staging

**Automatic on merge to main:**

1. Merge PR to main
2. CD pipeline runs automatically
3. Docker image built and scanned
4. Deployed to staging
5. Health checks verify deployment

**Monitor deployment:**
- Go to Actions tab
- Click on "CD Pipeline - Deployment"
- Watch deployment progress

### Deploying to Production

**Manual approval required:**

1. Go to Actions tab
2. Click "CD Pipeline - Deployment"
3. Click "Run workflow"
4. Select "production" environment
5. Click "Run workflow"
6. Approve deployment when prompted
7. Monitor deployment progress

### Rolling Back

**If deployment fails:**
- Automatic rollback triggers
- Previous version restored
- Issue created for tracking

**Manual rollback:**

1. Go to Actions tab
2. Click "Manual Rollback"
3. Click "Run workflow"
4. Fill in:
   - Environment (staging/production)
   - Version (commit SHA or tag)
   - Reason for rollback
5. Click "Run workflow"
6. Monitor rollback progress

---

## Common Scenarios

### Scenario 1: CI Fails on Linting

```bash
# See what's wrong
pnpm lint

# Auto-fix
pnpm lint:fix

# Commit and push
git add .
git commit -m "fix: lint errors"
git push
```

### Scenario 2: Tests Fail

```bash
# Run tests locally
pnpm test

# Run specific test
pnpm test -- path/to/test.spec.ts

# Fix test or code
# Commit and push
```

### Scenario 3: Security Vulnerability Found

1. Check Security tab on GitHub
2. Review vulnerability details
3. Update dependency:
   ```bash
   pnpm update package-name
   ```
4. Test locally
5. Commit and push

### Scenario 4: Deployment Failed

1. Check deployment logs
2. Identify issue
3. Fix in code
4. Create PR
5. Merge to main
6. Or rollback if urgent:
   ```
   Actions → Manual Rollback → Run workflow
   ```

### Scenario 5: Need to Rollback Production

1. Go to Actions → Manual Rollback
2. Select "production"
3. Enter previous working commit SHA
4. Enter reason (e.g., "Critical bug in payment flow")
5. Run workflow
6. Verify rollback successful
7. Fix issue and redeploy

---

## Workflow Status

### CI Pipeline Status

Check: https://github.com/cryptoganster/bookings-software/actions/workflows/ci.yml

**Jobs:**
- ✅ Lint
- ✅ Format
- ✅ TypeCheck
- ✅ Security Audit
- ✅ License Check
- ✅ Secret Scan
- ✅ Backend Tests
- ✅ Frontend Tests
- ✅ Backend Build
- ✅ Frontend Build

### CD Pipeline Status

Check: https://github.com/cryptoganster/bookings-software/actions/workflows/cd.yml

**Jobs:**
- ✅ Build Docker
- ✅ Scan Image
- ✅ Deploy Staging
- ⏸️ Deploy Production (manual)

---

## Troubleshooting

### "CI is taking too long"

Normal duration: 8-12 minutes

If longer:
- Check if jobs are queued
- Check GitHub Actions status
- Check runner availability

### "Docker build failed"

1. Check Dockerfile syntax
2. Test build locally:
   ```bash
   docker build -f apps/backend/Dockerfile -t test .
   ```
3. Check base image availability
4. Check disk space

### "Health check failed"

1. Check if service started
2. Check logs for errors
3. Verify health endpoint works:
   ```bash
   curl http://localhost:3000/health
   ```
4. Check database connectivity

### "Rollback failed"

1. Verify image exists in registry
2. Check deployment configuration
3. May need manual intervention
4. Contact on-call engineer

---

## Useful Commands

### Local Testing

```bash
# Test CI locally with act
act push

# Test specific job
act push -j lint

# Test Docker build
docker build -f apps/backend/Dockerfile -t backend:test .
docker run -p 3000:3000 backend:test
```

### Check Status

```bash
# Check CI status
gh run list --workflow=ci.yml

# Check CD status
gh run list --workflow=cd.yml

# View logs
gh run view <run-id> --log
```

### Docker Commands

```bash
# List images
docker images

# Pull image
docker pull ghcr.io/cryptoganster/bookings-software/backend:latest

# Run image
docker run -p 3000:3000 ghcr.io/cryptoganster/bookings-software/backend:latest

# Check health
curl http://localhost:3000/health
```

---

## Getting Help

1. **Check documentation**: `.github/workflows/README.md`
2. **Check logs**: Actions tab → Click workflow → View logs
3. **Search issues**: Check if someone had same problem
4. **Create issue**: Use `ci/cd` label
5. **Ask team**: Slack #devops channel

---

## Best Practices

### ✅ Do

- Run checks locally before pushing
- Write descriptive commit messages
- Keep PRs small and focused
- Review CI logs if pipeline fails
- Update tests when changing code
- Fix security vulnerabilities promptly

### ❌ Don't

- Force push to main
- Merge with failing CI
- Ignore security alerts
- Skip tests
- Deploy without testing
- Rollback without documenting reason

---

## Quick Links

- [CI Workflow](.github/workflows/ci.yml)
- [CD Workflow](.github/workflows/cd.yml)
- [CodeQL Workflow](.github/workflows/codeql.yml)
- [Rollback Workflow](.github/workflows/rollback.yml)
- [Full Documentation](.github/workflows/README.md)
- [Actions Tab](https://github.com/cryptoganster/bookings-software/actions)
- [Security Tab](https://github.com/cryptoganster/bookings-software/security)

---

**Last Updated:** December 18, 2024
