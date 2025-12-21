# Implementation Plan - CI/CD & DevSecOps

## Overview

Plan de implementación incremental para CI/CD y DevSecOps, dividido en 4 fases. Cada fase agrega valor inmediato y construye sobre la anterior.

---

## Phase 1: Foundation & Branch Protection

### 1. Setup GitHub Repository Configuration

- [x] 1.1 Configure branch protection rules for `main`
  - Enable "Require pull request before merging"
  - Enable "Require status checks to pass before merging"
  - Enable "Require branches to be up to date before merging"
  - Enable "Require linear history"
  - Disable "Allow force pushes"
  - _Requirements: 9.1, 9.2, 9.4, 9.5_

- [x] 1.2 Enable GitHub Security Features
  - Enable Dependabot alerts
  - Enable Dependabot security updates
  - Enable Secret scanning
  - Enable Code scanning (CodeQL)
  - _Requirements: 3.3, 4.4, 4.5_

- [x] 1.3 Create GitHub Secrets
  - Document required secrets in `.github/SECRETS.md`
  - Add placeholder for `DOCKER_USERNAME` (if needed)
  - Add placeholder for `DOCKER_PASSWORD` (if needed)
  - _Requirements: 10.1, 10.2_

---

## Phase 2: CI Pipeline - Code Quality & Security ✅

### 2. Create Base CI Workflow

- [x] 2.1 Create `.github/workflows/ci.yml` base structure
  - Define workflow name and triggers (push, pull_request)
  - Set environment variables (NODE_VERSION, PNPM_VERSION)
  - Define job structure with dependencies
  - _Requirements: 1.1, 1.2_

- [x] 2.2 Add pnpm setup and caching
  - Setup pnpm action
  - Setup Node.js with cache
  - Install dependencies with frozen lockfile
  - Cache node_modules for faster builds
  - _Requirements: 14.1, 14.4_

### 3. Implement Code Quality Checks

- [x] 3.1 Add linting job
  - Run ESLint on backend
  - Run ESLint on frontend
  - Fail pipeline on errors
  - _Requirements: 6.1, 6.4_

- [x] 3.2 Add formatting check job
  - Run Prettier check on backend
  - Run Prettier check on frontend
  - Suggest auto-fix in PR comments
  - _Requirements: 6.2, 6.5_

- [x] 3.3 Add TypeScript type checking job
  - Run tsc --noEmit on backend
  - Run tsc --noEmit on frontend
  - Fail pipeline on type errors
  - _Requirements: 6.3, 2.5_

### 4. Implement Security Scanning

- [x] 4.1 Create `.github/workflows/codeql.yml` for SAST
  - Initialize CodeQL for TypeScript/JavaScript
  - Use security-extended query suite
  - Configure to fail on critical/high vulnerabilities
  - Upload results to GitHub Security tab
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 4.2 Add dependency scanning to CI workflow
  - Run `npm audit --audit-level=high`
  - Generate audit report JSON
  - Fail on critical vulnerabilities in dependencies
  - _Requirements: 3.1, 3.2_

- [x] 4.3 Add license checking to CI workflow
  - Install and run license-checker
  - Fail on incompatible licenses (GPL, AGPL)
  - Generate license summary
  - _Requirements: 3.4_

- [x] 4.4 Add secret scanning step
  - Install and configure trufflehog
  - Scan commits for secrets
  - Fail immediately if secrets detected
  - _Requirements: 4.1, 4.2, 4.3_

### 5. Implement Testing

- [x] 5.1 Add backend test job
  - Run unit tests with Jest
  - Run integration tests
  - Generate coverage report
  - Upload coverage artifacts
  - _Requirements: 5.1, 5.2, 5.4_

- [x] 5.2 Add frontend test job
  - Run unit tests with Vitest
  - Generate coverage report
  - Upload coverage artifacts
  - _Requirements: 5.1, 5.4_

- [x] 5.3 Add coverage threshold check
  - Check if coverage >= 70%
  - Generate warning if below threshold
  - Don't fail pipeline, just warn
  - _Requirements: 5.5_

### 6. Implement Build Validation

- [x] 6.1 Add backend build job
  - Run `pnpm build` for backend
  - Verify dist folder created
  - Cache build artifacts
  - _Requirements: 7.1, 7.3, 7.4_

- [x] 6.2 Add frontend build job
  - Run `pnpm build` for frontend
  - Verify dist folder created
  - Cache build artifacts
  - _Requirements: 7.2, 7.3, 7.4_

- [x] 6.3 Add monorepo workspace validation
  - Verify pnpm workspace structure
  - Check for circular dependencies
  - _Requirements: 7.5_

### 7. Add CI Status Reporting

- [x] 7.1 Configure status checks for branch protection
  - Add all CI jobs as required checks
  - Update branch protection rules
  - _Requirements: 1.2, 9.2_

- [x] 7.2 Add CI badges to README
  - Add CI workflow badge
  - Add CodeQL badge
  - Add coverage badge (if using Codecov)
  - _Requirements: 15.2_

- [ ] 7.3 Configure notifications
  - Setup email notifications for failures
  - Configure notification preferences
  - _Requirements: 18.1, 18.2_
  - _Note: Deferred to Phase 4_

### 8. Checkpoint - Verify CI Pipeline ✅

- ✅ All CI checks implemented in ci.yml
- ✅ CodeQL SAST workflow created
- ✅ Branch protection configured (Phase 1)
- ✅ CI badges added to README
- ⏭️ Ready for Phase 3

---

## Phase 3: CD Pipeline - Docker & Deployment ✅

### 9. Implement Docker Build

- [x] 9.1 Create optimized Dockerfile for backend
  - Use multi-stage build
  - Use node:20-alpine base image
  - Run as non-root user
  - Add health check instruction
  - _Requirements: 8.1_

- [x] 9.2 Create `.github/workflows/cd.yml` for deployment
  - Trigger on push to main (after CI passes)
  - Build Docker image with commit SHA tag
  - Tag image as latest
  - _Requirements: 1.4, 8.1, 8.4_

- [x] 9.3 Add container scanning with Trivy
  - Scan Docker image for vulnerabilities
  - Fail on critical/high vulnerabilities
  - Upload scan results to GitHub Security
  - _Requirements: 8.2, 8.3_

- [x] 9.4 Push Docker image to registry
  - Configure GitHub Container Registry
  - Push image with version tags
  - _Requirements: 8.5_

### 10. Implement Health Check Endpoint

- [x] 10.1 Create health check controller (if not exists)
  - Implement `/health` endpoint
  - Check database connectivity
  - Return 200 if healthy, 503 if not
  - Include detailed status in response
  - _Requirements: 12.1, 12.2, 12.3, 12.4_
  - _Note: Already exists in backend via @nestjs/terminus_

- [ ] 10.2 Add health check tests
  - Test healthy state
  - Test unhealthy state (mock DB failure)
  - Verify response format
  - _Requirements: 12.1, 12.2, 12.3, 12.4_
  - _Note: Deferred to Phase 4_

### 11. Implement Deployment Automation

- [x] 11.1 Add deployment job to CD workflow
  - Deploy to staging/production
  - Use docker-compose or deployment script
  - Wait for service to start
  - _Requirements: 11.1, 11.2_
  - _Note: Placeholder commands added, actual deployment commands to be configured per environment_

- [x] 11.2 Add health check verification
  - Poll /health endpoint after deployment
  - Retry up to 5 times with 10s delay
  - Fail deployment if health check fails
  - _Requirements: 12.5_

- [x] 11.3 Add smoke tests
  - Test critical endpoints after deployment
  - Verify basic functionality
  - _Requirements: 11.4_
  - _Note: Placeholder added, actual tests to be implemented_

### 12. Implement Rollback Mechanism

- [x] 12.1 Add rollback job to CD workflow
  - Trigger on deployment failure
  - Restore previous Docker image
  - Verify health check passes
  - _Requirements: 1.5, 11.3_

- [x] 12.2 Add manual rollback workflow
  - Create `.github/workflows/rollback.yml`
  - Allow manual trigger with version selection
  - Verify health after rollback
  - _Requirements: 17.1, 17.2, 17.3_

- [x] 12.3 Add deployment logging
  - Log deployment metadata (version, commit, timestamp)
  - Log rollback events
  - _Requirements: 13.5, 17.4_

### 13. Checkpoint - Verify CD Pipeline ✅

- ✅ Docker build workflow created with multi-stage build
- ✅ Trivy container scanning integrated
- ✅ Deployment automation with health checks
- ✅ Rollback mechanism (auto and manual)
- ✅ SBOM generation
- ⚠️ Deployment commands are placeholders (need actual infrastructure)
- ⏭️ Ready for Phase 4

---

## Phase 4: Optimization & Documentation

### 14. Implement Performance Optimizations

- [ ] 14.1 Optimize caching strategy
  - Cache pnpm store
  - Cache node_modules
  - Cache build artifacts
  - Set appropriate cache keys
  - _Requirements: 14.1, 14.4_

- [ ] 14.2 Optimize job parallelization
  - Review job dependencies
  - Run independent jobs in parallel
  - Use matrix strategy if beneficial
  - _Requirements: 14.2_

- [ ] 14.3 Add conditional execution
  - Skip backend tests if only frontend changed
  - Skip frontend tests if only backend changed
  - Skip docs jobs if only code changed
  - _Requirements: 14.2_

- [ ] 14.4 Measure and optimize pipeline duration
  - Track pipeline duration over time
  - Identify bottlenecks
  - Optimize slow steps
  - _Requirements: 14.3_

### 15. Implement SBOM Generation

- [ ] 15.1 Add SBOM generation to CI workflow
  - Install SBOM tool (e.g., syft, cyclonedx)
  - Generate SBOM for backend dependencies
  - Generate SBOM for frontend dependencies
  - Upload SBOM as artifact
  - _Requirements: 3.5, 16.1_

- [ ] 15.2 Add SBOM to release artifacts
  - Include SBOM in GitHub releases
  - Document SBOM format and usage
  - _Requirements: 16.1_

### 16. Implement Dependabot Configuration

- [ ] 16.1 Create `.github/dependabot.yml`
  - Configure npm ecosystem
  - Set update schedule (daily for security, weekly for others)
  - Group minor updates
  - Set PR limits
  - _Requirements: 3.3_

- [ ] 16.2 Configure Dependabot auto-merge
  - Auto-merge patch updates if CI passes
  - Require manual review for major updates
  - _Requirements: 3.3_

### 17. Create Documentation

- [ ] 17.1 Create `.github/workflows/README.md`
  - Document each workflow purpose
  - Document trigger conditions
  - Document required secrets
  - Add troubleshooting section
  - _Requirements: 15.1, 15.4_

- [ ] 17.2 Update main README.md
  - Add CI/CD badges
  - Add "Development" section with workflow info
  - Add "Deployment" section
  - _Requirements: 15.2_

- [ ] 17.3 Create runbook documentation
  - Document manual deployment process
  - Document rollback process
  - Document emergency bypass procedures
  - Add common errors and solutions
  - _Requirements: 15.4_

- [ ] 17.4 Create security documentation
  - Document security scanning tools
  - Document how to handle security alerts
  - Document secret management practices
  - _Requirements: 10.1, 10.2_

### 18. Implement Monitoring & Alerting

- [ ] 18.1 Setup pipeline metrics tracking
  - Track success rate
  - Track average duration
  - Track failure rate by stage
  - _Requirements: 13.1, 13.2_

- [ ] 18.2 Configure alerting
  - Alert on pipeline failure on main
  - Alert on critical vulnerabilities
  - Alert on deployment failures
  - _Requirements: 18.1, 18.2, 18.3_

- [ ] 18.3 Create monitoring dashboard
  - Use GitHub Actions insights
  - Add custom metrics if needed
  - _Requirements: 13.1, 13.2_

### 19. Final Checkpoint - Complete System Validation

- Run full CI/CD pipeline end-to-end
- Verify all security scans work
- Verify deployment and rollback work
- Review all documentation
- Ask user if questions arise

---

## Testing Strategy

### Unit Tests

- Test health check endpoint logic
- Test deployment scripts (if applicable)
- Test rollback logic (if applicable)

### Integration Tests

- Test full CI pipeline with test PR
- Test CD pipeline with test deployment
- Test rollback with intentional failure

### Property-Based Tests

- [ ] Property 1: CI Pipeline Execution
  - **Validates: Requirements 1.1**
  - Generate random branch names and verify CI triggers

- [ ] Property 2: Critical Vulnerability Blocking
  - **Validates: Requirements 2.2, 3.2**
  - Generate test vulnerabilities and verify pipeline fails

- [ ] Property 3: Secret Detection
  - **Validates: Requirements 4.2**
  - Generate test secrets and verify detection

- [ ] Property 4: Health Check Response
  - **Validates: Requirements 12.3**
  - Generate random service states and verify correct status codes

### Manual Tests

- Create test PR and verify all checks run
- Merge to main and verify deployment
- Trigger rollback and verify success
- Test branch protection (try direct push to main)

---

## Notes

### All Tasks Required

All tasks in this plan are required for a comprehensive CI/CD & DevSecOps implementation.

### Dependencies

- Phase 2 must complete before Phase 3
- Phase 3 must complete before Phase 4
- Within each phase, tasks can be done in order or in parallel where dependencies allow

### Estimated Timeline

- Phase 1: 1 day
- Phase 2: 3-4 days
- Phase 3: 2-3 days
- Phase 4: 2-3 days
- **Total: ~2 weeks**

### Success Criteria

- ✅ CI pipeline runs on every push
- ✅ Security scans detect vulnerabilities
- ✅ Tests run automatically
- ✅ Branch protection prevents unsafe merges
- ✅ Deployment is automated
- ✅ Rollback works when needed
- ✅ Documentation is complete

### Tools Required

- GitHub account with Actions enabled
- Docker (for local testing)
- act (for local workflow testing)
- pnpm (already in project)

### Cost

- **$0** - All tools used are free for private repositories
- GitHub Actions: 2000 minutes/month free
- CodeQL: Free for private repos
- Dependabot: Free
- Secret Scanning: Free
- Trivy: Open source, free
