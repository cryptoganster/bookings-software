# GitHub Actions Workflows

This directory contains all CI/CD workflows for the project.

## Workflows Overview

### 1. CI Pipeline (`ci.yml`)

**Purpose:** Continuous Integration - validates code quality, security, and functionality

**Triggers:**
- Push to `main`, `develop`, `feature/**`, `fix/**`, `refactor/**`
- Pull requests to `main`, `develop`

**Jobs:**
1. **setup** - Install dependencies and cache
2. **lint** - ESLint on backend and frontend
3. **format** - Prettier format check
4. **typecheck** - TypeScript compilation check
5. **audit** - npm audit for vulnerabilities
6. **license-check** - Verify compatible licenses
7. **secret-scan** - TruffleHog secret scanning
8. **test-backend** - Jest tests with PostgreSQL
9. **test-frontend** - Vitest tests
10. **coverage-check** - Verify 70% coverage threshold
11. **build-backend** - Build backend application
12. **build-frontend** - Build frontend application
13. **validate-monorepo** - Validate pnpm workspace
14. **ci-status** - Final status check

**Duration:** ~8-12 minutes

**Required Secrets:** None (uses GitHub token)

**Status Checks:** All jobs must pass for PR merge

---

### 2. CodeQL Analysis (`codeql.yml`)

**Purpose:** Static Application Security Testing (SAST)

**Triggers:**
- Push to `main`, `develop`
- Pull requests to `main`, `develop`
- Schedule: Every Monday at 00:00 UTC

**Jobs:**
1. **analyze** - CodeQL security analysis

**Query Suite:** `security-extended`

**Languages:** JavaScript/TypeScript

**Fail Conditions:** Critical or High severity vulnerabilities

**Duration:** ~5-8 minutes

**Results:** Uploaded to GitHub Security tab

---

### 3. CD Pipeline (`cd.yml`)

**Purpose:** Continuous Deployment - build, scan, and deploy Docker images

**Triggers:**
- Push to `main` (auto-deploy to staging)
- Manual workflow dispatch (for production)

**Jobs:**
1. **build-docker** - Build and push Docker image to GHCR
2. **scan-image** - Trivy vulnerability scan
3. **deploy-staging** - Auto-deploy to staging (on main push)
4. **deploy-production** - Manual deploy to production (requires approval)
5. **rollback** - Auto-rollback on deployment failure

**Environments:**
- **staging**: Auto-deployed from main
- **production**: Manual approval required

**Image Registry:** GitHub Container Registry (ghcr.io)

**Image Tags:**
- `main-{sha}` - Branch + commit SHA
- `latest` - Latest main branch build
- `v{run_number}` - Release version

**Duration:** ~10-15 minutes

**Required Secrets:**
- `GITHUB_TOKEN` (auto-provided)

**Artifacts:**
- SBOM (Software Bill of Materials)
- Trivy scan results

---

### 4. Manual Rollback (`rollback.yml`)

**Purpose:** Rollback to a previous version in case of issues

**Triggers:**
- Manual workflow dispatch only

**Inputs:**
- `environment`: staging or production
- `version`: Commit SHA or tag to rollback to
- `reason`: Reason for rollback (required)

**Jobs:**
1. **validate-version** - Verify image exists in registry
2. **rollback** - Execute rollback and verify health
3. **notify-failure** - Create urgent issue if rollback fails

**Duration:** ~3-5 minutes

**Post-Rollback:**
- Creates GitHub issue for tracking
- Logs rollback details
- Verifies application health

---

## Environment Variables

### Global

```yaml
NODE_VERSION: '20'
PNPM_VERSION: '10'
REGISTRY: ghcr.io
IMAGE_NAME: ${{ github.repository }}/backend
```

### Per-Job

Set in workflow files as needed.

---

## Secrets Management

### Required Secrets

None currently required. All workflows use `GITHUB_TOKEN` which is automatically provided.

### Future Secrets (when deploying)

- `DEPLOY_SSH_KEY` - SSH key for deployment server
- `KUBECONFIG` - Kubernetes config (if using K8s)
- `SLACK_WEBHOOK` - Slack notifications (optional)

**How to add secrets:**
1. Go to repository Settings
2. Navigate to Secrets and variables > Actions
3. Click "New repository secret"
4. Add name and value
5. Click "Add secret"

---

## Branch Protection Rules

### Main Branch

- ✅ Require pull request before merging
- ✅ Require status checks to pass:
  - `lint`
  - `format`
  - `typecheck`
  - `audit`
  - `license-check`
  - `secret-scan`
  - `test-backend`
  - `test-frontend`
  - `build-backend`
  - `build-frontend`
  - `CodeQL`
- ✅ Require branches to be up to date
- ✅ Require linear history
- ❌ Allow force pushes (disabled)
- ❌ Allow deletions (disabled)

---

## Workflow Dependencies

```
CI Pipeline (ci.yml)
    ↓
CodeQL (codeql.yml) - Runs in parallel
    ↓
CD Pipeline (cd.yml) - Only on main
    ↓
Manual Rollback (rollback.yml) - If needed
```

---

## Local Testing

### Test CI Workflow Locally

Install `act` (GitHub Actions local runner):

```bash
# macOS
brew install act

# Linux
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
```

Run workflows:

```bash
# Run entire CI pipeline
act push

# Run specific job
act push -j lint

# Run with secrets
act push -s GITHUB_TOKEN=your_token
```

### Test Docker Build Locally

```bash
# Build image
docker build -f apps/backend/Dockerfile -t backend:test .

# Run container
docker run -p 3000:3000 backend:test

# Test health check
curl http://localhost:3000/health
```

---

## Troubleshooting

### CI Pipeline Fails

1. **Check job logs** in GitHub Actions tab
2. **Run locally** with `act` to reproduce
3. **Verify dependencies** are up to date
4. **Check for breaking changes** in dependencies

### CodeQL Fails

1. **Review security alerts** in Security tab
2. **Check query results** in workflow logs
3. **Fix vulnerabilities** or suppress false positives
4. **Re-run workflow** after fixes

### Docker Build Fails

1. **Check Dockerfile syntax**
2. **Verify base image** is available
3. **Test build locally** with Docker
4. **Check disk space** on runner

### Deployment Fails

1. **Check deployment logs**
2. **Verify health check** endpoint
3. **Check environment variables**
4. **Rollback** if necessary

### Rollback Fails

1. **Verify image exists** in registry
2. **Check deployment configuration**
3. **Manual intervention** may be required
4. **Contact on-call engineer**

---

## Monitoring & Alerts

### GitHub Actions Insights

View workflow metrics:
1. Go to repository Actions tab
2. Click on workflow name
3. View run history and duration

### Security Alerts

View security findings:
1. Go to repository Security tab
2. Check Code scanning alerts
3. Check Dependabot alerts
4. Check Secret scanning alerts

### Notifications

Configure notifications:
1. Go to repository Settings
2. Navigate to Notifications
3. Configure email/Slack webhooks

---

## Best Practices

### For Developers

1. ✅ Run `pnpm lint` before pushing
2. ✅ Run `pnpm test` before pushing
3. ✅ Keep PRs small and focused
4. ✅ Write descriptive commit messages
5. ✅ Update tests when changing code
6. ✅ Review CI logs if pipeline fails

### For Maintainers

1. ✅ Review security alerts weekly
2. ✅ Update dependencies regularly
3. ✅ Monitor workflow duration
4. ✅ Optimize slow jobs
5. ✅ Keep workflows DRY (Don't Repeat Yourself)
6. ✅ Document workflow changes

---

## Workflow Optimization

### Caching Strategy

- **pnpm cache**: Speeds up dependency installation
- **node_modules cache**: Reused across jobs
- **Docker layer cache**: Speeds up image builds
- **Build artifacts cache**: Reused in deployment

### Parallelization

Jobs run in parallel when possible:
- lint, format, typecheck run in parallel
- test-backend and test-frontend run in parallel
- build-backend and build-frontend run in parallel

### Conditional Execution

Future optimization: Skip jobs based on changed files
- Skip backend tests if only frontend changed
- Skip frontend tests if only backend changed

---

## Maintenance

### Weekly Tasks

- [ ] Review security alerts
- [ ] Check workflow duration trends
- [ ] Update dependencies if needed

### Monthly Tasks

- [ ] Review and optimize workflows
- [ ] Update documentation
- [ ] Clean up old workflow runs

### Quarterly Tasks

- [ ] Review and update security policies
- [ ] Audit secrets and permissions
- [ ] Update base images and actions

---

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [CodeQL Documentation](https://codeql.github.com/docs/)
- [Trivy Documentation](https://aquasecurity.github.io/trivy/)
- [act - Local GitHub Actions](https://github.com/nektos/act)

---

## Support

For questions or issues with workflows:
1. Check this documentation
2. Review workflow logs
3. Search GitHub Issues
4. Create new issue with `ci/cd` label
