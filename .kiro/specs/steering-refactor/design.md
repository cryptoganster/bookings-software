# Steering Files Refactorization - Design Document

**Version:** 1.0  
**Date:** January 8, 2026  
**Status:** Draft

---

## 1. Executive Summary

This document provides the detailed design for refactoring 20 existing steering files into a new numbered structure (01-62) that eliminates duplication, enforces single responsibility per file, and provides clear backend/frontend separation.

### Key Findings from Analysis

**Total Files Analyzed:** 20 existing steering files  
**Duplicate Content Identified:** ~35% of content appears in multiple files  
**Primary Overlaps:**

- Architecture concepts (Clean Architecture, DDD, CQRS) repeated across 5 files
- NestJS patterns duplicated in 3 files
- Testing conventions split between backend and frontend
- Import/naming conventions have significant overlap

### Refactoring Goals

1. **Single Responsibility:** Each file has ONE clear, specific purpose
2. **No Duplication:** Content appears in exactly ONE file
3. **Cross-References:** Use links instead of copying content
4. **Backend/Frontend Separation:** Clear sections or separate files when needed
5. **Context-Driven:** All content verified against actual codebase

---

## 2. Content Responsibility Matrix

This matrix shows which existing files contribute to each new file and identifies unique vs duplicate content.

### 2.1 Product & Architecture (01-04)

#### 01-product-requirements.md (from PRD.md)

**Primary Responsibility:** Complete product requirements and business context  
**Content Sources:**

- PRD.md (100% - entire file)
  **Unique Content:**
- User flows and scenarios
- Business rules and constraints
- MVP scope and phases
- Integration requirements
  **Duplicate Content to Remove:** None (this is the source)
  **Cross-References to Add:**
- Link to 02-bounded-contexts.md for BC details
- Link to 03-identity-architecture.md for User/Customer/BusinessOwner
- Link to 04-system-architecture.md for technical architecture

#### 02-bounded-contexts.md (from bounded-contexts.md)

**Primary Responsibility:** Bounded Context definitions and boundaries  
**Content Sources:**

- bounded-contexts.md (90% - BC definitions, communication)
- PRD.md (10% - BC list overlap)
  **Unique Content:**
- Detailed BC responsibilities
- Aggregate lists per BC
- Communication patterns between BCs
- Ubiquitous language per BC
  **Duplicate Content to Remove:**
- BC list from PRD.md (keep only summary, link to this file)
  **Cross-References to Add:**
- Link to 01-product-requirements.md for business context
- Link to 11-ddd-tactical-patterns.md for aggregate implementation details

#### 03-identity-architecture.md (from user-customer-businessowner-architecture.md)

**Primary Responsibility:** User, Customer, BusinessOwner identity architecture  
**Content Sources:**

- user-customer-businessowner-architecture.md (100% - entire file)
  **Unique Content:**
- Three identity concepts (User, Customer, BusinessOwner)
- Separation of concerns rationale
- Customer types (anonymous vs registered)
- Marketplace vision
  **Duplicate Content to Remove:** None (this is the source)
  **Cross-References to Add:**
- Link to 02-bounded-contexts.md for Auth, Account, Customer BCs
- Link to 11-ddd-tactical-patterns.md for aggregate patterns

#### 04-system-architecture.md (from architecture.md)

**Primary Responsibility:** High-level system architecture and principles  
**Content Sources:**

- architecture.md (80% - architecture principles, layers)
- PRD.md (10% - architecture section overlap)
- cqrs.md (5% - CQRS overview overlap)
- ddd-patterns.md (5% - DDD overview overlap)
  **Unique Content:**
- Clean Architecture layers
- Architectural principles (DDD, CQRS, Event-Driven)
- Design patterns applied
- Concurrency strategy overview
- Scalability and security
  **Duplicate Content to Remove:**
- CQRS details from architecture.md (keep only overview, link to 10-cqrs-pattern.md)
- DDD details from architecture.md (keep only overview, link to 11-ddd-tactical-patterns.md)
- Architecture section from PRD.md (replace with link to this file)
  **Cross-References to Add:**
- Link to 10-cqrs-pattern.md for CQRS details
- Link to 11-ddd-tactical-patterns.md for DDD details
- Link to 13-architecture-boundaries.md for dependency rules

### 2.2 Architecture Patterns (10-13)

#### 10-cqrs-pattern.md (from cqrs.md)

**Primary Responsibility:** CQRS pattern implementation with NestJS  
**Content Sources:**

- cqrs.md (95% - CQRS implementation)
- architecture.md (5% - CQRS overview overlap)
  **Unique Content:**
- Command/Query separation
- Write Model vs Read Model
- CommandBus, QueryBus, EventBus usage
- Domain Services for CQRS strict
- Factories for aggregate loading
  **Duplicate Content to Remove:**
- CQRS overview from architecture.md (replace with link)
  **Cross-References to Add:**
- Link to 04-system-architecture.md for architectural context
- Link to 11-ddd-tactical-patterns.md for aggregates and repositories
- Link to 20-nestjs-implementation.md for NestJS-specific patterns

#### 11-ddd-tactical-patterns.md (from ddd-patterns.md)

**Primary Responsibility:** DDD tactical patterns (Aggregates, VOs, Events, etc.)  
**Content Sources:**

- ddd-patterns.md (90% - DDD patterns)
- architecture.md (5% - DDD overview overlap)
- factory-pattern.md (5% - Factory pattern overlap)
  **Unique Content:**
- Aggregate implementation
- Value Objects
- Domain Events
- Entities
- Domain Services (Uniqueness Checkers, Limit Checkers, Existence Checkers)
- Repositories (interfaces)
- Specifications
  **Duplicate Content to Remove:**
- DDD overview from architecture.md (replace with link)
- Factory pattern basics from ddd-patterns.md (link to 12-factory-pattern.md)
  **Cross-References to Add:**
- Link to 04-system-architecture.md for architectural context
- Link to 10-cqrs-pattern.md for CQRS integration
- Link to 12-factory-pattern.md for Factory details

#### 12-factory-pattern.md (from factory-pattern.md)

**Primary Responsibility:** Factory pattern for CQRS strict (aggregate loading)  
**Content Sources:**

- factory-pattern.md (100% - entire file)
  **Unique Content:**
- Factory vs Read Repository vs Write Repository
- IAppointmentFactory interface and implementation
- Aggregate.fromPersistence() pattern
- Factory usage in Command Handlers
  **Duplicate Content to Remove:** None (this is the source)
  **Cross-References to Add:**
- Link to 10-cqrs-pattern.md for CQRS context
- Link to 11-ddd-tactical-patterns.md for aggregate patterns

#### 13-architecture-boundaries.md (from architecture-boundaries.md)

**Primary Responsibility:** Dependency rules and architectural boundaries  
**Content Sources:**

- architecture-boundaries.md (100% - entire file)
  **Unique Content:**
- Layer dependency rules (Shared → Domain → App → Infra → Presentation)
- Cross-BC dependency rules
- ESLint boundaries validation
- Violation examples and correct patterns
  **Duplicate Content to Remove:** None (this is the source)
  **Cross-References to Add:**
- Link to 04-system-architecture.md for layer definitions
- Link to 02-bounded-contexts.md for BC boundaries
- Link to 32-eslint-configuration.md for ESLint setup

### 2.3 NestJS Implementation (20-21)

#### 20-nestjs-implementation.md (from nestjs-patterns.md)

**Primary Responsibility:** NestJS-specific implementation patterns  
**Content Sources:**

- nestjs-patterns.md (90% - NestJS patterns)
- clean-code.md (10% - NestJS best practices overlap)
  **Unique Content:**
- Module structure and DI
- Controllers (thin, delegation to CQRS)
- DTOs with class-validator
- Guards, Filters, Interceptors
- CQRS integration (@CommandHandler, @QueryHandler, @EventsHandler, @Saga)
- Logging with Pino
- Configuration with @nestjs/config
- TypeORM setup
  **Duplicate Content to Remove:**
- NestJS best practices from clean-code.md (consolidate here)
  **Cross-References to Add:**
- Link to 10-cqrs-pattern.md for CQRS concepts
- Link to 21-clean-code-principles.md for general clean code
- Link to 50-backend-stack.md for dependencies

#### 21-clean-code-principles.md (from clean-code.md)

**Primary Responsibility:** Clean code and SOLID principles (language-agnostic)  
**Content Sources:**

- clean-code.md (85% - SOLID, clean code practices)
- nestjs-patterns.md (10% - best practices overlap)
- naming-conventions.md (5% - naming overlap)
  **Unique Content:**
- SOLID principles with examples
- Clean code practices (functions, comments, errors)
- TypeScript best practices
- Testing best practices
- Code review checklist
- Anti-patterns
  **Duplicate Content to Remove:**
- NestJS-specific practices (move to 20-nestjs-implementation.md)
- Naming conventions details (link to 30-naming-conventions.md)
  **Cross-References to Add:**
- Link to 30-naming-conventions.md for naming details
- Link to 20-nestjs-implementation.md for NestJS specifics
- Link to 40-backend-testing.md for testing details

### 2.4 Code Organization (30-32)

#### 30-naming-conventions.md (from naming-conventions.md)

**Primary Responsibility:** Naming conventions for files, folders, and code  
**Content Sources:**

- naming-conventions.md (95% - naming conventions)
- clean-code.md (5% - naming overlap)
  **Unique Content:**
- File naming (kebab-case)
- Folder naming (kebab-case)
- Code naming (PascalCase, camelCase, UPPER_SNAKE_CASE)
- ORM and database naming (snake_case)
- Avoiding redundancy in names
- NestJS exceptions (.module.ts, .controller.ts, .guard.ts)
- Commands/Queries structure (SRP)
- Interfaces (I prefix)
- Comments in Spanish
  **Duplicate Content to Remove:**
- Naming best practices from clean-code.md (consolidate here)
  **Cross-References to Add:**
- Link to 21-clean-code-principles.md for general principles
- Link to 31-import-conventions.md for import organization

#### 31-import-conventions.md (from import-conventions.md)

**Primary Responsibility:** Import conventions and path aliases  
**Content Sources:**

- import-conventions.md (100% - entire file)
  **Unique Content:**
- Path alias prefixes (@packages/_, @shared/_, @app/\*, etc.)
- Import rules (prefer aliases, separate by origin, type imports)
- TypeScript configuration for aliases
- Vite configuration for aliases
- Frontend FSD layers (@pages/_, @widgets/_, @features/_, @entities/_)
  **Duplicate Content to Remove:** None (this is the source)
  **Cross-References to Add:**
- Link to 30-naming-conventions.md for naming context
- Link to 32-eslint-configuration.md for ESLint enforcement
- Link to 51-frontend-architecture.md for FSD details

#### 32-eslint-configuration.md (from eslint-path-aliases.md)

**Primary Responsibility:** ESLint configuration for path aliases enforcement  
**Content Sources:**

- eslint-path-aliases.md (100% - entire file)
  **Unique Content:**
- ESLint rule: enforce-path-aliases
- Allowed path aliases list
- TypeScript, Jest, ESLint configuration
- Autofix capability
- Adding new aliases
- Troubleshooting
  **Duplicate Content to Remove:** None (this is the source)
  **Cross-References to Add:**
- Link to 31-import-conventions.md for import conventions
- Link to 13-architecture-boundaries.md for boundary rules

### 2.5 Testing (40-41)

#### 40-backend-testing.md (NEW - from clean-code.md + nestjs-patterns.md)

**Primary Responsibility:** Backend testing conventions and strategies  
**Content Sources:**

- clean-code.md (40% - testing best practices)
- nestjs-patterns.md (40% - NestJS testing)
- PRD.md (20% - testing strategy)
  **Unique Content:**
- Testing pyramid (Unit, Integration, Property-Based, E2E, Concurrency)
- Jest configuration
- Unit test examples (Aggregates, VOs, Domain Services)
- Integration test examples (Command/Query Handlers, Repositories)
- Property-based tests with fast-check
- E2E tests with Supertest
- Concurrency tests (race conditions, optimistic locking)
- Test structure (**tests** folders)
- Mocking strategies
  **Duplicate Content to Remove:**
- Testing sections from clean-code.md (consolidate here)
- Testing sections from nestjs-patterns.md (consolidate here)
  **Cross-References to Add:**
- Link to 21-clean-code-principles.md for general testing principles
- Link to 20-nestjs-implementation.md for NestJS context
- Link to 50-backend-stack.md for testing dependencies

#### 41-frontend-testing.md (from frontend-testing-conventions.md)

**Primary Responsibility:** Frontend testing conventions and strategies  
**Content Sources:**

- frontend-testing-conventions.md (100% - entire file)
  **Unique Content:**
- Testing stack (Vitest, React Testing Library, MSW)
- Test structure (**tests** folders)
- Naming conventions (.test.tsx, .test.ts)
- Unit tests (components, hooks, utilities)
- Component tests (rendering, interactions)
- Hook tests (state, side effects)
- Integration tests (user flows, API mocking)
- Property-based tests with fast-check
- MSW setup (handlers, server)
- Coverage goals (70% general, 90%+ critical)
  **Duplicate Content to Remove:** None (this is the source)
  **Cross-References to Add:**
- Link to 21-clean-code-principles.md for general testing principles
- Link to 51-frontend-architecture.md for FSD context
- Link to 51-frontend-architecture.md for testing dependencies

### 2.6 Tech Stack (50-52)

#### 50-backend-stack.md (from stack.md)

**Primary Responsibility:** Backend technology stack and dependencies  
**Content Sources:**

- stack.md (100% - entire file, backend-focused)
  **Unique Content:**
- NestJS v10.x with Fastify
- PostgreSQL v14+
- TypeORM v0.3.x
- WhatsApp Business API
- JWT authentication
- Utilities (date-fns, uuid)
- Logging (Pino)
- Testing (Jest, Supertest, fast-check)
- CQRS (@nestjs/cqrs)
- Dependencies list
- TypeScript configuration
- Environment variables
- NPM scripts
  **Duplicate Content to Remove:** None (this is the source)
  **Cross-References to Add:**
- Link to 20-nestjs-implementation.md for NestJS patterns
- Link to 40-backend-testing.md for testing setup
- Link to 52-resilience-patterns.md for retry/circuit breaker

#### 51-frontend-architecture.md (from frontend-PRD.md)

**Primary Responsibility:** Frontend architecture and technology stack  
**Content Sources:**

- frontend-PRD.md (100% - entire file)
  **Unique Content:**
- Feature-Sliced Design (FSD) architecture
- React 18 + Vite 5 + TypeScript 5
- TanStack Query 5 (server state)
- Zustand 4 (UI state)
- React Router 6
- Mantine 7 UI library
- React Hook Form 7 + Zod 3
- API integration (Axios)
- State management patterns
- Pages structure
- Forms & validation
- Routing
- Error handling
- Performance optimization
  **Duplicate Content to Remove:** None (this is the source)
  **Cross-References to Add:**
- Link to 31-import-conventions.md for FSD imports
- Link to 41-frontend-testing.md for testing
- Link to 61-monorepo-commands.md for dev commands

#### 52-resilience-patterns.md (from resilience-patterns.md)

**Primary Responsibility:** Resilience patterns (Retry, Circuit Breaker)  
**Content Sources:**

- resilience-patterns.md (100% - entire file)
  **Unique Content:**
- Retry with Exponential Backoff
- Circuit Breaker pattern
- Use cases and anti-patterns
- Implementation examples (SendWhatsAppMessageHandler, SendAdminResponseHandler)
- Best practices (jitter, timeouts, metrics)
- Testing strategies
- MVP vs Post-MVP decisions
  **Duplicate Content to Remove:** None (this is the source)
  **Cross-References to Add:**
- Link to 50-backend-stack.md for dependencies
- Link to 20-nestjs-implementation.md for NestJS context
- Link to 40-backend-testing.md for testing retry logic

### 2.7 Workflow (60-62)

#### 60-git-workflow.md (from git-workflow.md)

**Primary Responsibility:** Git and GitHub workflow with PRs and rulesets  
**Content Sources:**

- git-workflow.md (100% - entire file)
  **Unique Content:**
- Branch structure (master + feature/\*)
- GitHub rulesets (PR required, CI required)
- Workflow steps (sync, create, commit, push, PR, merge, clean)
- Commit conventions (feat, fix, refactor, etc.)
- Pre-push checklist
- Conflict resolution
- Useful commands
- Troubleshooting
  **Duplicate Content to Remove:** None (this is the source)
  **Cross-References to Add:**
- Link to 61-monorepo-commands.md for validation commands
- Link to 62-development-workflow.md for hot reload

#### 61-monorepo-commands.md (from pnpm-commands.md)

**Primary Responsibility:** PNPM commands and monorepo scripts  
**Content Sources:**

- pnpm-commands.md (100% - entire file)
  **Unique Content:**
- Monorepo structure (apps/backend, apps/frontend, packages/shared-types)
- Testing commands (test, test:watch, test:coverage)
- TypeScript commands (typecheck)
- Linting commands (lint, lint:fix)
- Formatting commands (format, format:check)
- Build commands
- Development commands (dev, dev:backend, dev:frontend)
- Workspace-specific commands (--filter)
- Best practices
- Troubleshooting
  **Duplicate Content to Remove:** None (this is the source)
  **Cross-References to Add:**
- Link to 60-git-workflow.md for pre-push validation
- Link to 62-development-workflow.md for dev commands

#### 62-development-workflow.md (from hot-reload.md)

**Primary Responsibility:** Development workflow and hot reload  
**Content Sources:**

- hot-reload.md (100% - entire file)
  **Unique Content:**
- Backend hot reload (nodemon)
- Frontend hot reload (Vite HMR)
- When to restart servers
- Verification methods
- Troubleshooting
- Performance characteristics
- Best practices
  **Duplicate Content to Remove:** None (this is the source)
  **Cross-References to Add:**
- Link to 61-monorepo-commands.md for dev commands
- Link to 50-backend-stack.md for backend setup
- Link to 51-frontend-architecture.md for frontend setup

---

## 3. Duplicate Content Analysis

### 3.1 Major Duplications Identified

#### Architecture Concepts (35% duplication)

**Appears in:** PRD.md, architecture.md, cqrs.md, ddd-patterns.md, bounded-contexts.md

**Duplicate Content:**

- Clean Architecture overview (in PRD.md, architecture.md)
- DDD principles (in PRD.md, architecture.md, ddd-patterns.md)
- CQRS overview (in PRD.md, architecture.md, cqrs.md)
- Bounded Context list (in PRD.md, bounded-contexts.md)

**Consolidation Strategy:**

- Keep detailed architecture in 04-system-architecture.md
- Keep CQRS details in 10-cqrs-pattern.md
- Keep DDD details in 11-ddd-tactical-patterns.md
- Keep BC details in 02-bounded-contexts.md
- Replace duplicates with cross-references

#### NestJS Best Practices (20% duplication)

**Appears in:** nestjs-patterns.md, clean-code.md

**Duplicate Content:**

- Dependency Injection best practices
- Controller patterns
- Testing patterns

**Consolidation Strategy:**

- Keep NestJS-specific patterns in 20-nestjs-implementation.md
- Keep general clean code principles in 21-clean-code-principles.md
- Use cross-references for overlap

#### Naming Conventions (15% duplication)

**Appears in:** naming-conventions.md, clean-code.md

**Duplicate Content:**

- Naming best practices
- Code organization

**Consolidation Strategy:**

- Keep all naming details in 30-naming-conventions.md
- Keep general principles in 21-clean-code-principles.md
- Use cross-references

#### Testing Conventions (10% duplication)

**Appears in:** clean-code.md, nestjs-patterns.md, frontend-testing-conventions.md

**Duplicate Content:**

- Testing best practices
- Test structure

**Consolidation Strategy:**

- Create 40-backend-testing.md (consolidate backend testing)
- Keep 41-frontend-testing.md (frontend-specific)
- Keep general principles in 21-clean-code-principles.md

### 3.2 Content That Should NOT Be Duplicated

1. **Architecture Principles:** Only in 04-system-architecture.md
2. **CQRS Details:** Only in 10-cqrs-pattern.md
3. **DDD Patterns:** Only in 11-ddd-tactical-patterns.md
4. **Factory Pattern:** Only in 12-factory-pattern.md
5. **NestJS Patterns:** Only in 20-nestjs-implementation.md
6. **Naming Conventions:** Only in 30-naming-conventions.md
7. **Import Conventions:** Only in 31-import-conventions.md

### 3.3 Duplication Measurement Methodology

**Objective:** Measure and verify 35% reduction in content duplication.

#### Baseline Measurement (Before Refactoring)

1. **Identify Duplicate Content Blocks:**
   - Define content block as 3+ consecutive lines of similar text
   - Use text similarity analysis (e.g., `diff`, manual review)
   - Document duplicate blocks in a tracking spreadsheet

2. **Calculate Baseline Metrics:**

   ```bash
   # Total lines in existing files
   wc -l .kiro/steering/*.md | tail -1

   # Identify duplicate sections manually
   # For each duplicate, record:
   # - Source files (which files contain this content)
   # - Line count
   # - Topic/concept
   ```

3. **Expected Baseline:**
   - Total content: ~500KB across 20 files
   - Estimated duplication: ~35% (175KB)
   - Major duplicates: Architecture concepts, NestJS patterns, naming conventions

#### Post-Refactoring Measurement

1. **Verify No Duplication:**

   ```bash
   # Check for duplicate paragraphs across new files
   # Manual review of all 62 files
   # Verify cross-references are used instead of duplication
   ```

2. **Calculate New Metrics:**
   - Total content: ~550KB across 62 files (includes cross-references and search strategies)
   - Duplicate content: <5% (only intentional duplicates like glossary terms)
   - Reduction: ~30% of original content eliminated through consolidation

3. **Acceptable Duplicates:**
   - Glossary definitions (can appear in multiple files for context)
   - Critical warnings (e.g., "Never use any type")
   - Brief summaries before cross-references (1-2 sentences)

#### Validation Criteria

- [ ] No content block (3+ lines) appears in more than one file
- [ ] All duplicate content from baseline is either:
  - Consolidated into one file, OR
  - Replaced with cross-reference
- [ ] Total duplicate content < 5% of total content
- [ ] Duplication reduction ≥ 30% from baseline

#### Tools and Scripts

```bash
# Script to find potential duplicates (simplified)
#!/bin/bash
# find-duplicates.sh

for file1 in .kiro/steering/[0-9][0-9]-*.md; do
  for file2 in .kiro/steering/[0-9][0-9]-*.md; do
    if [ "$file1" != "$file2" ]; then
      # Compare files and report similarities
      # (This would need a more sophisticated implementation)
      echo "Comparing $file1 and $file2"
    fi
  done
done
```

---

## 4. Consolidation Strategy

### 4.1 File-by-File Consolidation Plan

#### Product & Architecture (01-04)

**01-product-requirements.md**

- **Action:** Copy PRD.md content
- **Modifications:**
  - Remove detailed architecture section (replace with link to 04)
  - Remove BC list details (replace with link to 02)
  - Remove identity architecture details (replace with link to 03)
  - Add cross-references section at top
- **Front Matter:** `inclusion: always`

**02-bounded-contexts.md**

- **Action:** Copy bounded-contexts.md content
- **Modifications:**
  - Remove BC list from PRD.md (already here)
  - Add cross-references to 01, 11
- **Front Matter:** `inclusion: always`

**03-identity-architecture.md**

- **Action:** Copy user-customer-businessowner-architecture.md content
- **Modifications:**
  - Add cross-references to 02, 11
- **Front Matter:** `inclusion: always`

**04-system-architecture.md**

- **Action:** Copy architecture.md content
- **Modifications:**
  - Remove CQRS details (keep overview, link to 10)
  - Remove DDD details (keep overview, link to 11)
  - Remove architecture section from PRD.md
  - Add cross-references to 10, 11, 13
- **Front Matter:** `inclusion: always`

#### Architecture Patterns (10-13)

**10-cqrs-pattern.md**

- **Action:** Copy cqrs.md content
- **Modifications:**
  - Remove CQRS overview from architecture.md
  - Add cross-references to 04, 11, 20
- **Front Matter:** `inclusion: always`

**11-ddd-tactical-patterns.md**

- **Action:** Copy ddd-patterns.md content
- **Modifications:**
  - Remove DDD overview from architecture.md
  - Remove Factory pattern basics (link to 12)
  - Add cross-references to 04, 10, 12
- **Front Matter:** `inclusion: always`

**12-factory-pattern.md**

- **Action:** Copy factory-pattern.md content
- **Modifications:**
  - Add cross-references to 10, 11
- **Front Matter:** `inclusion: always`

**13-architecture-boundaries.md**

- **Action:** Copy architecture-boundaries.md content
- **Modifications:**
  - Add cross-references to 04, 02, 32
- **Front Matter:** `inclusion: always`

#### NestJS Implementation (20-21)

**20-nestjs-implementation.md**

- **Action:** Copy nestjs-patterns.md content
- **Modifications:**
  - Remove NestJS best practices from clean-code.md (consolidate here)
  - Add cross-references to 10, 21, 50
- **Front Matter:** `inclusion: always`

**21-clean-code-principles.md**

- **Action:** Copy clean-code.md content
- **Modifications:**
  - Remove NestJS-specific practices (move to 20)
  - Remove naming details (link to 30)
  - Remove testing details (link to 40)
  - Add cross-references to 30, 20, 40
- **Front Matter:** `inclusion: always`

#### Code Organization (30-32)

**30-naming-conventions.md**

- **Action:** Copy naming-conventions.md content
- **Modifications:**
  - Remove naming best practices from clean-code.md (consolidate here)
  - Add cross-references to 21, 31
- **Front Matter:** `inclusion: always`

**31-import-conventions.md**

- **Action:** Copy import-conventions.md content
- **Modifications:**
  - Add cross-references to 30, 32, 51
- **Front Matter:** `inclusion: always`

**32-eslint-configuration.md**

- **Action:** Copy eslint-path-aliases.md content
- **Modifications:**
  - Add cross-references to 31, 13
- **Front Matter:** `inclusion: always`

#### Testing (40-41)

**40-backend-testing.md**

- **Action:** CREATE NEW FILE (consolidate from multiple sources)
- **Content Sources:**
  - clean-code.md (testing section)
  - nestjs-patterns.md (testing section)
  - PRD.md (testing strategy section)
- **Modifications:**
  - Consolidate all backend testing content
  - Add cross-references to 21, 20, 50
- **Front Matter:** `inclusion: always`

**41-frontend-testing.md**

- **Action:** Copy frontend-testing-conventions.md content
- **Modifications:**
  - Add cross-references to 21, 51
- **Front Matter:** `inclusion: always`

#### Tech Stack (50-52)

**50-backend-stack.md**

- **Action:** Copy stack.md content (backend-focused)
- **Modifications:**
  - Add cross-references to 20, 40, 52
- **Front Matter:** `inclusion: always`

**51-frontend-architecture.md**

- **Action:** Copy frontend-PRD.md content
- **Modifications:**
  - Add cross-references to 31, 41, 61
- **Front Matter:** `inclusion: always`

**52-resilience-patterns.md**

- **Action:** Copy resilience-patterns.md content
- **Modifications:**
  - Add cross-references to 50, 20, 40
- **Front Matter:** `inclusion: always`

#### Workflow (60-62)

**60-git-workflow.md**

- **Action:** Copy git-workflow.md content
- **Modifications:**
  - Add cross-references to 61, 62
- **Front Matter:** `inclusion: always`

**61-monorepo-commands.md**

- **Action:** Copy pnpm-commands.md content
- **Modifications:**
  - Add cross-references to 60, 62
- **Front Matter:** `inclusion: always`

**62-development-workflow.md**

- **Action:** Copy hot-reload.md content
- **Modifications:**
  - Add cross-references to 61, 50, 51
- **Front Matter:** `inclusion: always`

### 4.2 Cross-Reference Format

All cross-references should use this format:

```markdown
> **📖 Related:** See [File Name](./XX-file-name.md) for [specific topic]
```

**Examples:**

```markdown
> **📖 Related:** See [CQRS Pattern](./10-cqrs-pattern.md) for CQRS implementation details

> **📖 Related:** See [DDD Tactical Patterns](./11-ddd-tactical-patterns.md) for aggregate implementation

> **📖 Related:** See [Bounded Contexts](./02-bounded-contexts.md) for BC definitions and boundaries
```

### 4.3 Content Removal Strategy

When removing duplicate content:

1. **Identify the "source of truth"** file for the content
2. **Replace duplicate content** with cross-reference
3. **Keep context** - add 1-2 sentence summary before cross-reference
4. **Verify no information loss** - ensure all unique details are preserved

**Example:**

```markdown
<!-- BEFORE (in PRD.md) -->

## Bounded Contexts

### BC1: Account

Responsible for managing business owner accounts...
[500 lines of BC details]

<!-- AFTER (in 01-product-requirements.md) -->

## Bounded Contexts

The system is organized into 9 bounded contexts, each with clear responsibilities and boundaries.

> **📖 Related:** See [Bounded Contexts](./02-bounded-contexts.md) for complete BC definitions, aggregates, and communication patterns
```

---

## 5. Implementation Approach

### 5.1 Search Strategy Per Category

Before creating/updating each steering file, perform keyword-based searches to identify related code.

#### 01-04: Product & Architecture

**Search Keywords:**

- `bounded context`, `BC`, `aggregate`, `domain event`
- `clean architecture`, `layer`, `dependency`
- `User`, `Customer`, `BusinessOwner`, `userId`, `customerId`
- `CQRS`, `command`, `query`, `event`

**Search Commands:**

```bash
# Bounded contexts
grepSearch --query "bounded context|BC" --includePattern "**/*.md"

# Architecture layers
grepSearch --query "domain|application|infrastructure|presentation" --includePattern "apps/backend/src/**/*.ts"

# Identity architecture
grepSearch --query "User|Customer|BusinessOwner" --includePattern "apps/backend/src/**/*.ts"
```

**Backend Analysis:**

- Scan `apps/backend/src/` for BC directories
- Identify aggregates in `domain/aggregates/`
- Identify domain events in `domain/events/`
- Verify layer structure (domain, app, infra, presentation)

**Frontend Analysis:**

- Scan `apps/frontend/src/` for FSD structure
- Identify pages, widgets, features, entities
- Verify shared layer organization

#### 10-13: Architecture Patterns

**Search Keywords:**

- `CommandHandler`, `QueryHandler`, `EventsHandler`, `Saga`
- `ICommandHandler`, `IQueryHandler`, `IEventHandler`
- `Aggregate`, `ValueObject`, `DomainEvent`
- `Repository`, `Factory`, `DomainService`
- `VersionedAggregateRoot`, `version`, `optimistic locking`

**Search Commands:**

```bash
# CQRS patterns
grepSearch --query "@CommandHandler|@QueryHandler|@EventsHandler|@Saga" --includePattern "apps/backend/src/**/*.ts"

# DDD patterns
grepSearch --query "extends VersionedAggregateRoot|extends ValueObject" --includePattern "apps/backend/src/**/*.ts"

# Factory pattern
grepSearch --query "IFactory|Factory|fromPersistence" --includePattern "apps/backend/src/**/*.ts"

# Architecture boundaries
grepSearch --query "import.*from.*@shared|import.*from.*@booking" --includePattern "apps/backend/src/**/*.ts"
```

**Backend Analysis:**

- Identify all Command Handlers in `app/commands/*/handler.ts`
- Identify all Query Handlers in `app/queries/*/handler.ts`
- Identify all Event Handlers in `app/event_handlers/`
- Identify all Sagas in `app/sagas/`
- Identify all Aggregates extending VersionedAggregateRoot
- Identify all Value Objects extending ValueObject
- Identify all Factories in `infra/persistence/factories/`
- Verify import patterns and path aliases

**Frontend Analysis:**

- N/A (these are backend-only patterns)

#### 20-21: NestJS & Clean Code

**Search Keywords:**

- `@Module`, `@Controller`, `@Injectable`, `@Inject`
- `@Get`, `@Post`, `@Put`, `@Delete`
- `@UseGuards`, `@UseFilters`, `@UseInterceptors`
- `class-validator`, `class-transformer`, `@IsUUID`, `@IsNotEmpty`
- `SOLID`, `SRP`, `DIP`, `OCP`

**Search Commands:**

```bash
# NestJS decorators
grepSearch --query "@Module|@Controller|@Injectable" --includePattern "apps/backend/src/**/*.ts"

# Guards, Filters, Interceptors
grepSearch --query "@UseGuards|@UseFilters|@UseInterceptors" --includePattern "apps/backend/src/**/*.ts"

# Validation
grepSearch --query "@IsUUID|@IsNotEmpty|@IsString" --includePattern "apps/backend/src/**/*.ts"

# Dependency Injection
grepSearch --query "@Inject\\(" --includePattern "apps/backend/src/**/*.ts"
```

**Backend Analysis:**

- Identify all NestJS modules in `*/*.module.ts`
- Identify all controllers in `presentation/controllers/*.controller.ts`
- Identify all guards in `*/guards/*.guard.ts`
- Identify all filters in `*/filters/*.filter.ts`
- Identify all interceptors in `*/interceptors/*.interceptor.ts`
- Identify DTOs with class-validator decorators
- Verify DI patterns (constructor injection, @Inject)

**Frontend Analysis:**

- N/A (NestJS is backend-only)
- For clean code: Identify React components, hooks, utilities
- Verify TypeScript usage (no `any`, proper typing)

#### 30-32: Code Organization

**Search Keywords:**

- File naming patterns: `kebab-case`, `.ts`, `.tsx`, `.module.ts`, `.controller.ts`
- Import patterns: `@packages`, `@shared`, `@booking`, `@app`, `@pages`
- ESLint rules: `enforce-path-aliases`, `naming-convention`

**Search Commands:**

```bash
# File naming patterns
find apps/backend/src -type f -name "*.ts" | head -20
find apps/frontend/src -type f -name "*.tsx" | head -20

# Import patterns
grepSearch --query "import.*from.*@packages|import.*from.*@shared" --includePattern "apps/**/*.ts"

# Path aliases configuration
grepSearch --query "paths|baseUrl" --includePattern "**/tsconfig.json"

# ESLint configuration
grepSearch --query "enforce-path-aliases|naming-convention" --includePattern "**/.eslintrc*|**/eslint.config.*"
```

**Backend Analysis:**

- Verify file naming (kebab-case for files and folders)
- Verify class naming (PascalCase)
- Verify variable naming (camelCase)
- Verify constant naming (UPPER_SNAKE_CASE)
- Verify import patterns (path aliases vs relative)
- Check tsconfig.json for path aliases
- Check ESLint configuration

**Frontend Analysis:**

- Verify file naming (kebab-case for files and folders)
- Verify component naming (PascalCase)
- Verify hook naming (camelCase with `use` prefix)
- Verify import patterns (FSD layers: @app, @pages, @widgets, @features, @entities)
- Check tsconfig.json for path aliases
- Check vite.config.ts for alias configuration

#### 40-41: Testing

**Search Keywords:**

- `describe`, `it`, `expect`, `jest`, `vitest`
- `@testing-library/react`, `render`, `screen`, `fireEvent`
- `fast-check`, `fc.`, `test.prop`
- `__tests__`, `.test.ts`, `.test.tsx`, `.spec.ts`
- `mock`, `spy`, `stub`

**Search Commands:**

```bash
# Backend tests
grepSearch --query "describe\\(|it\\(|expect\\(" --includePattern "apps/backend/**/*.spec.ts"

# Frontend tests
grepSearch --query "describe\\(|it\\(|expect\\(" --includePattern "apps/frontend/**/*.test.ts*"

# Property-based tests
grepSearch --query "fc\\.|test\\.prop" --includePattern "apps/**/*.spec.ts|apps/**/*.test.ts"

# Test structure
find apps/backend -type d -name "__tests__"
find apps/frontend -type d -name "__tests__"

# MSW handlers
grepSearch --query "rest\\.|http\\." --includePattern "apps/frontend/src/mocks/**/*.ts"
```

**Backend Analysis:**

- Identify test files in `__tests__/` folders
- Verify test naming (\*.spec.ts)
- Identify unit tests (Aggregates, VOs, Domain Services)
- Identify integration tests (Command/Query Handlers)
- Identify property-based tests (fast-check)
- Identify E2E tests (Supertest)
- Verify Jest configuration in package.json

**Frontend Analysis:**

- Identify test files in `__tests__/` folders
- Verify test naming (_.test.tsx, _.test.ts)
- Identify component tests (React Testing Library)
- Identify hook tests (renderHook)
- Identify integration tests (MSW)
- Identify property-based tests (fast-check)
- Verify Vitest configuration in vite.config.ts
- Verify MSW setup in src/mocks/

#### 50-52: Tech Stack

**Search Keywords:**

- `@nestjs`, `fastify`, `typeorm`, `pg`, `axios`
- `react`, `vite`, `@tanstack/react-query`, `zustand`, `mantine`
- `date-fns`, `uuid`, `bcrypt`, `jwt`
- `retry`, `circuit breaker`, `exponential backoff`

**Search Commands:**

```bash
# Backend dependencies
grepSearch --query "@nestjs|typeorm|fastify" --includePattern "apps/backend/package.json"

# Frontend dependencies
grepSearch --query "react|vite|@tanstack|zustand|mantine" --includePattern "apps/frontend/package.json"

# Retry patterns
grepSearch --query "MAX_RETRIES|exponential.*backoff|retry" --includePattern "apps/backend/src/**/*.ts"

# Circuit breaker (future)
grepSearch --query "circuit.*breaker|opossum" --includePattern "apps/backend/src/**/*.ts"
```

**Backend Analysis:**

- Verify package.json dependencies
- Identify NestJS modules and configuration
- Identify TypeORM entities and repositories
- Identify Fastify adapter usage
- Identify Pino logger usage
- Identify retry logic implementations
- Verify tsconfig.json configuration
- Verify environment variables usage

**Frontend Analysis:**

- Verify package.json dependencies
- Identify React components and hooks
- Identify TanStack Query usage (useQuery, useMutation)
- Identify Zustand stores
- Identify Mantine components
- Identify React Hook Form + Zod usage
- Verify vite.config.ts configuration
- Verify environment variables usage

#### 60-62: Workflow

**Search Keywords:**

- `git`, `branch`, `commit`, `pull request`, `PR`
- `pnpm`, `workspace`, `filter`, `monorepo`
- `nodemon`, `vite`, `hot reload`, `HMR`

**Search Commands:**

```bash
# Git configuration
cat .gitignore
grepSearch --query "branch|ruleset" --includePattern ".github/**/*.yml"

# PNPM workspace
cat pnpm-workspace.yaml
grepSearch --query "workspace|filter" --includePattern "package.json"

# Development scripts
grepSearch --query "dev|start|build|test" --includePattern "apps/*/package.json"

# Nodemon configuration
cat apps/backend/nodemon.json

# Vite configuration
cat apps/frontend/vite.config.ts
```

**Backend Analysis:**

- Verify nodemon.json configuration
- Verify package.json scripts (dev, build, test)
- Verify hot reload behavior
- Identify when to restart server

**Frontend Analysis:**

- Verify vite.config.ts configuration
- Verify package.json scripts (dev, build, test)
- Verify HMR behavior
- Identify when to restart server

### 5.2 Backend vs Frontend Separation Strategy

#### Strategy 1: Separate Sections (Preferred for shared concepts)

When a concept applies to both backend and frontend but with different implementations:

````markdown
# File Title

## Overview

[General concept explanation]

## Backend Implementation

### [Backend-specific details]

**Example:**

```typescript
// Backend example
```
````

**Search Strategy:**

- Keywords: [backend keywords]
- Directories: `apps/backend/src/`

## Frontend Implementation

### [Frontend-specific details]

**Example:**

```typescript
// Frontend example
```

**Search Strategy:**

- Keywords: [frontend keywords]
- Directories: `apps/frontend/src/`

````

**Use for:**
- 21-clean-code-principles.md (SOLID applies to both)
- 30-naming-conventions.md (naming applies to both)
- 31-import-conventions.md (imports apply to both)


#### Strategy 2: Backend-Only or Frontend-Only (Explicit note)

When a concept applies to only one side:

```markdown
# File Title

**Scope:** Backend Only

## Overview
[Backend-specific concept explanation]

> **Note:** This pattern is specific to the NestJS backend. For frontend patterns, see [Frontend Architecture](./51-frontend-architecture.md).

[Rest of content]
````

**Use for:**

- 10-cqrs-pattern.md (Backend only - NestJS CQRS)
- 11-ddd-tactical-patterns.md (Backend only - Domain layer)
- 12-factory-pattern.md (Backend only - Aggregate loading)
- 20-nestjs-implementation.md (Backend only - NestJS)
- 40-backend-testing.md (Backend only - Jest)
- 41-frontend-testing.md (Frontend only - Vitest)
- 50-backend-stack.md (Backend only - NestJS stack)
- 51-frontend-architecture.md (Frontend only - React + FSD)
- 52-resilience-patterns.md (Backend only - Retry/Circuit Breaker)

#### Strategy 3: Separate Files (When implementations are completely different)

When backend and frontend have completely different approaches:

- 40-backend-testing.md (Jest, Supertest, fast-check)
- 41-frontend-testing.md (Vitest, React Testing Library, MSW)
- 50-backend-stack.md (NestJS, TypeORM, PostgreSQL)
- 51-frontend-architecture.md (React, Vite, TanStack Query)

### 5.3 File Reference Strategy

Use `#[[file:path]]` syntax to reference actual implementations:

````markdown
## Example Implementation

The following implementation can be found in the codebase:

#[[file:apps/backend/src/booking/app/commands/create-appointment/handler.ts]]

```typescript
@CommandHandler(CreateAppointmentCommand)
export class CreateAppointmentHandler implements ICommandHandler<CreateAppointmentCommand> {
  // Implementation
}
```
````

````

**Rules:**
1. Always verify file exists before adding reference
2. Use relative paths from workspace root
3. Add file references for:
   - Example implementations
   - Configuration files
   - Test examples
4. Do NOT add file references for:
   - Every mention of a pattern
   - Generic concepts
   - Multiple similar files (pick one representative example)

### 5.4 Front Matter Configuration

All steering files should have front matter:

```markdown
---
inclusion: always
---
````

**Rationale:** All refactored steering files should be included by default since they follow single responsibility and have no duplication.

**Future:** If we need conditional inclusion (e.g., only when specific files are read), we can add:

```markdown
---
inclusion: fileMatch
fileMatchPattern: "apps/backend/src/booking/**"
---
```

### 5.5 Inclusion Mode Decision Matrix

**Decision Criteria for Inclusion Modes:**

| Inclusion Mode | When to Use                                                    | Examples                                                                                                               | Rationale                                                                    |
| -------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **always**     | Fundamental concepts needed in all contexts                    | DDD Overview, CQRS Principles, Architecture Boundaries, Naming Conventions                                             | These are core patterns that apply regardless of what file you're working on |
| **fileMatch**  | Patterns specific to file types or directories                 | Aggregates (`**/*.aggregate.ts`), Factories (`**/factories/**/*.ts`), Frontend Testing (`apps/frontend/**/*.test.tsx`) | Only load when working on files that use these patterns                      |
| **manual**     | Advanced topics, reference documentation, or optional patterns | Resilience Patterns, Performance Optimization, Detailed identity architecture                                          | User explicitly requests these when needed                                   |

**Decision Process:**

1. **Ask: "Is this needed for every file in the project?"**
   - Yes → `always`
   - No → Continue to step 2

2. **Ask: "Is this specific to certain file types or directories?"**
   - Yes → `fileMatch` with appropriate pattern
   - No → Continue to step 3

3. **Ask: "Is this advanced/optional/reference material?"**
   - Yes → `manual`
   - No → Default to `always` (better to have context than miss it)

**Examples:**

```markdown
# Example 1: Always included (core architecture)

---

## inclusion: always

# Architecture Boundaries

[All developers need to know dependency rules]

# Example 2: File match (specific to aggregates)

---

inclusion: fileMatch
fileMatchPattern: "**/domain/aggregates/**/\*.ts"

---

# DDD Aggregates

[Only needed when working on aggregate files]

# Example 3: Manual (reference documentation)

---

## inclusion: manual

# Identity Architecture Deep Dive

[Detailed reference, load when explicitly needed]
```

**Current Decision for Refactored Files:**

All 62 refactored files use `inclusion: always` because:

- They follow single responsibility (no noise)
- They have no duplication (no redundant context)
- They are well-organized (easy to scan)
- Better to have context available than miss it

**Future Optimization:**

If context becomes too large, we can selectively change to `fileMatch`:

- Files 11-13 (DDD patterns) → `fileMatch: "**/domain/**/*.ts"`
- File 20 (NestJS) → `fileMatch: "**/*.module.ts"`
- Files 40-41 (Testing) → `fileMatch: "**/*.{test,spec}.{ts,tsx}"`

---

## 6. Correctness Properties

This section defines validation criteria to ensure the refactoring is correct and complete.

### 6.1 Content Preservation

**Property:** No unique content from existing steering files should be lost.

**Content Block Definition:** A content block is defined as:

- **Paragraph-level:** 3+ consecutive lines of text
- **Section-level:** Complete sections with headings
- **Code examples:** Complete code blocks with context
- **Tables and diagrams:** Complete visual elements

**Preservation Rules:**

- Content can be **verbatim** (exact copy)
- Content can be **paraphrased** (same meaning, different wording)
- Content can be **summarized** (condensed version with cross-reference to details)

**Validation:**

1. For each existing steering file, identify all unique sections/paragraphs
2. Verify each unique section appears in exactly ONE new steering file
3. Verify all code examples are preserved
4. Verify all tables and diagrams are preserved
5. Verify all cross-references are updated

**Test:**

```bash
# Extract all headings from old files
for file in .kiro/steering/*.md; do
  grep "^##" "$file" | sed "s/^/$(basename $file): /"
done > old-headings.txt

# Extract all headings from new files
for file in .kiro/steering/[0-9][0-9]-*.md; do
  grep "^##" "$file" | sed "s/^/$(basename $file): /"
done > new-headings.txt

# Compare (all old headings should map to new headings)
```

### 6.2 No Duplication

**Property:** No content should appear in more than one steering file.

**Duplication Definition:** Content is considered duplicated if:

- 3+ consecutive lines of similar text appear in multiple files
- Same code example appears in multiple files
- Same table/diagram appears in multiple files

**Allowed Exceptions:**

- **Glossary definitions:** Can appear in multiple files for context (max 2-3 sentences)
- **Critical warnings:** Can appear in multiple places (e.g., "Never use any type")
- **Cross-reference summaries:** Brief summaries (1-2 sentences) before links to full content
- **Common examples:** If an example illustrates different concepts, it can appear with different explanations

**Validation:**

1. For each paragraph/section in new steering files, verify it appears in only ONE file
2. Cross-references should be used instead of duplicating content
3. Summaries are allowed (1-2 sentences) before cross-references

**Test:**

```bash
# Find duplicate paragraphs (simplified)
for file in .kiro/steering/[0-9][0-9]-*.md; do
  # Extract paragraphs and check for duplicates across files
  # (This would need a more sophisticated script)
done
```

### 6.3 Single Responsibility

**Property:** Each steering file has exactly ONE clear responsibility.

**Validation:**

1. Each file has a "Primary Responsibility" statement in Overview section
2. All content in the file relates to that responsibility
3. No file covers multiple unrelated topics
4. Responsibility statements are unique (no two files have same responsibility)

**Test:**

```bash
# Extract responsibility statements
for file in .kiro/steering/[0-9][0-9]-*.md; do
  grep -A 1 "Primary Responsibility:" "$file" | sed "s/^/$(basename $file): /"
done

# Verify uniqueness (no duplicates in output)
```

### 6.4 Cross-References Validity

**Property:** All cross-references point to existing files and sections.

**Validation:**

1. Extract all markdown links from steering files
2. Verify target files exist
3. Verify target sections exist (if section anchor is used)
4. Verify no broken links

**Test:**

```bash
# Extract all markdown links
grep -r "\[.*\](\.\/.*\.md)" .kiro/steering/[0-9][0-9]-*.md

# For each link, verify target file exists
# (This would need a script to parse and validate)
```

**Validation Script Specification:**

```bash
#!/bin/bash
# validate-cross-references.sh
# Purpose: Validate all markdown cross-references in steering files

for file in .kiro/steering/[0-9][0-9]-*.md; do
  echo "Checking $file..."

  # Extract all markdown links
  grep -o "\[.*\](\.\/[^)]*\.md[^)]*)" "$file" | while read -r link; do
    # Extract target file
    target=$(echo "$link" | sed 's/.*](\.\///' | sed 's/).*//' | sed 's/#.*//')

    # Check if target file exists
    if [ ! -f ".kiro/steering/$target" ]; then
      echo "  ERROR: Broken link to $target in $file"
    fi

    # Extract section anchor if present
    if echo "$link" | grep -q "#"; then
      anchor=$(echo "$link" | sed 's/.*#//' | sed 's/).*//')
      # Verify section exists in target file
      # (This would need more sophisticated parsing)
    fi
  done
done
```

### 6.5 File References Validity

**Property:** All file references point to existing files in the workspace.

**Validation:**

1. Extract all `#[[file:path]]` references
2. Verify each referenced file exists
3. Verify paths are correct (relative to workspace root)

**Test:**

```bash
# Extract all file references
grep -r "#\[\[file:" .kiro/steering/[0-9][0-9]-*.md | sed 's/.*#\[\[file:\(.*\)\]\].*/\1/'

# For each path, verify file exists
while read -r path; do
  if [ ! -f "$path" ]; then
    echo "Missing: $path"
  fi
done
```

**Validation Script Specification:**

```bash
#!/bin/bash
# validate-file-references.sh
# Purpose: Validate all #[[file:path]] references in steering files

echo "Validating file references..."
errors=0

for file in .kiro/steering/[0-9][0-9]-*.md; do
  # Extract all file references
  grep -o "#\[\[file:[^]]*\]\]" "$file" | while read -r ref; do
    # Extract path
    path=$(echo "$ref" | sed 's/#\[\[file://' | sed 's/\]\]//')

    # Check if file exists
    if [ ! -f "$path" ]; then
      echo "ERROR: Invalid reference in $file: $path"
      errors=$((errors + 1))
    fi
  done
done

if [ $errors -eq 0 ]; then
  echo "✅ All file references are valid"
else
  echo "❌ Found $errors invalid file references"
  exit 1
fi
```

### 6.6 Front Matter Validity

**Property:** All steering files have valid YAML front matter.

**Validation:**

1. Each file starts with `---`
2. Front matter contains `inclusion` field
3. `inclusion` value is one of: `always`, `fileMatch`, `manual`
4. If `inclusion: fileMatch`, `fileMatchPattern` field exists
5. Front matter ends with `---`

**Test:**

```bash
# Validate front matter
for file in .kiro/steering/[0-9][0-9]-*.md; do
  # Check if file starts with ---
  head -n 1 "$file" | grep -q "^---$" || echo "Missing front matter: $file"

  # Check for inclusion field
  grep -q "^inclusion:" "$file" || echo "Missing inclusion field: $file"
done
```

### 6.7 Backend/Frontend Separation

**Property:** Backend-only and frontend-only patterns are clearly marked.

**Validation:**

1. Files with backend-only content have "**Scope:** Backend Only" in Overview
2. Files with frontend-only content have "**Scope:** Frontend Only" in Overview
3. Files with both have separate "## Backend Implementation" and "## Frontend Implementation" sections
4. No mixing of backend and frontend examples without clear separation

**Test:**

```bash
# Check for scope markers
for file in .kiro/steering/[0-9][0-9]-*.md; do
  if grep -q "NestJS\|TypeORM\|@nestjs" "$file"; then
    # Backend-specific content
    grep -q "Scope:.*Backend Only" "$file" || echo "Missing backend scope: $file"
  fi

  if grep -q "React\|Vite\|@tanstack" "$file"; then
    # Frontend-specific content
    grep -q "Scope:.*Frontend Only\|## Frontend Implementation" "$file" || echo "Missing frontend scope: $file"
  fi
done
```

### 6.8 Context Analysis Verification

**Property:** All content is based on actual codebase analysis.

**Validation:**

1. Each steering file documents search strategy used
2. File references point to actual implementations
3. Code examples match actual codebase
4. No invented patterns or examples

**Test:**

```bash
# Verify file references exist
grep -r "#\[\[file:" .kiro/steering/[0-9][0-9]-*.md | while read -r line; do
  file=$(echo "$line" | sed 's/.*#\[\[file:\(.*\)\]\].*/\1/')
  [ -f "$file" ] || echo "Invalid reference: $file in $line"
done

# Verify search strategy is documented
for file in .kiro/steering/[0-9][0-9]-*.md; do
  grep -q "Search Strategy\|Search Keywords\|Search Commands" "$file" || echo "Missing search strategy: $file"
done
```

---

## 7. Error Handling

This section defines how to handle common issues during refactoring.

### 7.1 Missing Patterns in Codebase

**Issue:** A pattern documented in existing steering files doesn't exist in the codebase.

**Resolution:**

1. Perform thorough search using multiple keywords
2. If pattern truly doesn't exist:
   - **Option A:** Omit the pattern from new steering file (preferred)
   - **Option B:** Mark as "Future Implementation" with clear note
   - **Option C:** If it's a planned pattern, move to a separate "planned-patterns.md" file
3. Document the decision in design.md

**Example:**

```markdown
<!-- If Circuit Breaker is not implemented yet -->

## Circuit Breaker (Future Implementation)

> **Note:** Circuit Breaker pattern is not currently implemented in the codebase. This section documents the planned implementation for post-MVP.

[Pattern documentation]
```

### 7.2 Backend-Only Pattern in Shared File

**Issue:** A pattern that only applies to backend appears in a file that should cover both backend and frontend.

**Resolution:**

1. Add explicit "**Scope:** Backend Only" note at the beginning of the section
2. Add cross-reference to frontend equivalent (if exists)
3. Consider moving to a backend-specific file if the entire file is backend-only

**Example:**

```markdown
## Factory Pattern

**Scope:** Backend Only

> **Note:** This pattern is specific to the NestJS backend for loading aggregates in CQRS. For frontend data loading patterns, see [Frontend Architecture](./51-frontend-architecture.md#data-loading).

[Pattern documentation]
```

### 7.3 Conflicting Information Between Files

**Issue:** Two existing steering files have conflicting information about the same topic.

**Resolution:**

1. Analyze the codebase to determine which is correct
2. Use the codebase as the source of truth
3. Document the conflict and resolution in design.md
4. Update the new steering file with correct information
5. Add a note explaining the correction

**Example:**

```markdown
## Optimistic Locking

> **Note:** Previous documentation incorrectly stated that all aggregates use optimistic locking. Analysis of the codebase shows that only `Appointment`, `Capacity`, and `Conversation` aggregates use versioning.

[Correct documentation based on codebase]
```

### 7.4 Duplicate Content with Different Details

**Issue:** Two files have similar content but with different details or examples.

**Resolution:**

1. Determine which file should own the content (based on responsibility)
2. Merge the details from both sources
3. Keep the most comprehensive and accurate version
4. Add cross-reference from the other file
5. Document the merge in design.md

**Example:**

```markdown
<!-- In 11-ddd-tactical-patterns.md -->

## Repositories

[Comprehensive repository documentation merged from ddd-patterns.md and cqrs.md]

<!-- In 10-cqrs-pattern.md -->

## Repositories in CQRS

CQRS requires strict separation between write and read repositories.

> **📖 Related:** See [DDD Tactical Patterns - Repositories](./11-ddd-tactical-patterns.md#repositories) for complete repository pattern documentation.

[CQRS-specific repository guidance]
```

### 7.5 Outdated Information

**Issue:** Existing steering file contains outdated information that doesn't match current codebase.

**Resolution:**

1. Verify against codebase using search
2. Update to match current implementation
3. Add a note explaining the update
4. Document the change in design.md

**Example:**

```markdown
## Command Handlers

> **Note:** Updated to reflect current implementation using `@nestjs/cqrs` v11.x. Previous documentation referenced older patterns.

[Current implementation documentation]
```

### 7.6 Missing Backend or Frontend Analysis

**Issue:** A steering file should cover both backend and frontend but only has backend content.

**Resolution:**

1. Perform frontend search using appropriate keywords
2. If frontend implementation exists:
   - Add "## Frontend Implementation" section
   - Document frontend patterns
   - Add file references to frontend code
3. If frontend implementation doesn't exist:
   - Add note: "**Scope:** Backend Only (Frontend implementation pending)"
   - Link to frontend roadmap or planned features

**Example:**

```markdown
# Naming Conventions

## Overview

[General naming principles]

## Backend Implementation

### File Naming

[Backend file naming with examples from apps/backend/src/]

## Frontend Implementation

### File Naming

[Frontend file naming with examples from apps/frontend/src/]

### Component Naming

[React component naming conventions]
```

### 7.7 Circular Cross-References

**Issue:** File A references File B, and File B references File A, creating a circular dependency.

**Resolution:**

1. Identify the primary file for the topic
2. Keep detailed content in primary file
3. Secondary file should only have summary + cross-reference to primary
4. Avoid bidirectional detailed cross-references

**Example:**

```markdown
<!-- In 10-cqrs-pattern.md (primary for CQRS) -->

## Repositories in CQRS

[Detailed CQRS repository explanation]

> **📖 Related:** See [DDD Tactical Patterns - Repositories](./11-ddd-tactical-patterns.md#repositories) for general repository pattern.

<!-- In 11-ddd-tactical-patterns.md (primary for DDD) -->

## Repositories

[Detailed repository pattern explanation]

> **📖 Related:** See [CQRS Pattern - Repositories](./10-cqrs-pattern.md#repositories-in-cqrs) for CQRS-specific usage.
```

---

## 8. Testing Strategy

This section defines how to verify the refactoring is correct.

### 8.1 Pre-Refactoring Tests

**Before starting refactoring:**

1. **Content Inventory:**

   ```bash
   # Create inventory of all existing content
   for file in .kiro/steering/*.md; do
     echo "=== $(basename $file) ===" >> content-inventory.txt
     grep "^##" "$file" >> content-inventory.txt
     echo "" >> content-inventory.txt
   done
   ```

2. **Backup Verification:**

   ```bash
   # Verify backup was created
   [ -d .kiro/steering/backup ] || echo "ERROR: Backup directory missing"

   # Verify all files were backed up
   diff <(ls .kiro/steering/*.md | xargs -n1 basename | sort) \
        <(ls .kiro/steering/backup/*.md | xargs -n1 basename | sort)
   ```

3. **Baseline Metrics:**

   ````bash
   # Count total lines of content
   wc -l .kiro/steering/*.md | tail -1

   # Count total headings
   grep -r "^##" .kiro/steering/*.md | wc -l

   # Count total code blocks
   grep -r "^```" .kiro/steering/*.md | wc -l
   ````

### 8.2 During Refactoring Tests

**For each new steering file created:**

1. **Content Verification:**
   - Verify all content comes from existing files or codebase analysis
   - Verify no hallucinated patterns or examples
   - Verify file references point to existing files

2. **Structure Verification:**
   - Verify front matter is valid YAML
   - Verify headings follow consistent structure
   - Verify code blocks have language specification

3. **Cross-Reference Verification:**
   - Verify all markdown links are valid
   - Verify target files exist
   - Verify no broken links

4. **Search Strategy Verification:**
   - Verify search commands were executed
   - Verify search results were analyzed
   - Verify examples match codebase

### 8.3 Post-Refactoring Tests

**After all files are created:**

1. **Completeness Test:**

   ```bash
   # Verify all 62 files were created
   ls .kiro/steering/[0-9][0-9]-*.md | wc -l
   # Expected: 62

   # Verify README was created
   [ -f .kiro/steering/README.md ] || echo "ERROR: README missing"
   ```

2. **No Duplication Test:**

   ```bash
   # Extract all paragraphs and check for duplicates
   # (This would need a sophisticated script to compare content)

   # Manual verification:
   # - Read through all files
   # - Check for repeated sections
   # - Verify cross-references are used instead of duplication
   ```

3. **Content Preservation Test:**

   ```bash
   # Compare old vs new content inventory
   # Verify all unique content from old files appears in new files

   # Manual verification:
   # - For each old file, verify content is in new files
   # - Check content-inventory.txt against new files
   ```

4. **File Reference Test:**

   ```bash
   # Extract and verify all file references
   grep -r "#\[\[file:" .kiro/steering/[0-9][0-9]-*.md | \
     sed 's/.*#\[\[file:\(.*\)\]\].*/\1/' | \
     while read -r path; do
       [ -f "$path" ] || echo "ERROR: Missing file: $path"
     done
   ```

5. **Cross-Reference Test:**

   ```bash
   # Extract and verify all markdown links
   grep -r "\[.*\](\.\/[0-9][0-9]-.*\.md)" .kiro/steering/[0-9][0-9]-*.md | \
     sed 's/.*](\.\///' | sed 's/).*//' | \
     while read -r file; do
       [ -f ".kiro/steering/$file" ] || echo "ERROR: Missing file: $file"
     done
   ```

6. **Front Matter Test:**

   ```bash
   # Verify all files have valid front matter
   for file in .kiro/steering/[0-9][0-9]-*.md; do
     # Check starts with ---
     head -n 1 "$file" | grep -q "^---$" || echo "ERROR: Invalid front matter in $file"

     # Check has inclusion field
     grep -q "^inclusion:" "$file" || echo "ERROR: Missing inclusion in $file"

     # Check ends with ---
     head -n 10 "$file" | grep -q "^---$" || echo "ERROR: Invalid front matter end in $file"
   done
   ```

7. **Backend/Frontend Separation Test:**

   ```bash
   # Verify backend-only files have scope marker
   for file in .kiro/steering/{10,11,12,20,40,50,52}-*.md; do
     grep -q "Scope:.*Backend Only" "$file" || echo "WARNING: Missing backend scope in $file"
   done

   # Verify frontend-only files have scope marker
   for file in .kiro/steering/{41,51}-*.md; do
     grep -q "Scope:.*Frontend Only" "$file" || echo "WARNING: Missing frontend scope in $file"
   done
   ```

8. **Metrics Comparison:**

   ```bash
   # Compare old vs new metrics
   echo "Old files:"
   wc -l .kiro/steering/backup/*.md | tail -1

   echo "New files:"
   wc -l .kiro/steering/[0-9][0-9]-*.md | tail -1

   # Note: New files should have similar or slightly more content
   # (due to added cross-references and search strategies)
   ```

### 8.4 Manual Review Checklist

**For each new steering file:**

- [ ] Front matter is valid and appropriate
- [ ] Overview section clearly states responsibility
- [ ] Content is organized logically
- [ ] Code examples are from actual codebase
- [ ] File references point to existing files
- [ ] Cross-references are accurate
- [ ] No duplicate content from other files
- [ ] Backend/Frontend separation is clear (if applicable)
- [ ] Search strategy is documented
- [ ] All headings follow consistent structure
- [ ] Code blocks have language specification
- [ ] Tables are properly formatted
- [ ] No broken links
- [ ] No hallucinated patterns

**For the entire refactoring:**

- [ ] All 62 files created
- [ ] README.md created with index
- [ ] Backup directory created
- [ ] No content lost from original files
- [ ] No duplication across files
- [ ] All cross-references valid
- [ ] All file references valid
- [ ] Consistent structure across files
- [ ] Clear backend/frontend separation
- [ ] All files have valid front matter

### 8.5 Kiro AI Testing

**Test with Kiro AI:**

1. **Context Loading Test:**
   - Open a file in each category (backend, frontend, shared)
   - Verify Kiro loads appropriate steering files
   - Verify no duplicate guidance

2. **Cross-Reference Test:**
   - Ask Kiro about a topic covered in multiple files
   - Verify Kiro references the correct primary file
   - Verify Kiro doesn't repeat content

3. **Backend/Frontend Test:**
   - Ask Kiro about a backend pattern
   - Verify Kiro uses backend-specific guidance
   - Ask Kiro about a frontend pattern
   - Verify Kiro uses frontend-specific guidance

4. **Search Strategy Test:**
   - Ask Kiro to implement a pattern
   - Verify Kiro searches codebase first
   - Verify Kiro uses actual implementations as examples

---

## 9. Implementation Tasks

The implementation will be broken down into the following tasks:

### Task 1: Backup and Setup

- Create backup directory
- Copy all existing steering files to backup
- Create README.md with Kiro steering documentation

### Task 2: Product & Architecture (01-04)

- Create 01-product-requirements.md
- Create 02-bounded-contexts.md
- Create 03-identity-architecture.md
- Create 04-system-architecture.md

### Task 3: Architecture Patterns (10-13)

- Create 10-cqrs-pattern.md
- Create 11-ddd-tactical-patterns.md
- Create 12-factory-pattern.md
- Create 13-architecture-boundaries.md

### Task 4: NestJS & Clean Code (20-21)

- Create 20-nestjs-implementation.md
- Create 21-clean-code-principles.md

### Task 5: Code Organization (30-32)

- Create 30-naming-conventions.md
- Create 31-import-conventions.md
- Create 32-eslint-configuration.md

### Task 6: Testing (40-41)

- Create 40-backend-testing.md
- Create 41-frontend-testing.md

### Task 7: Tech Stack (50-52)

- Create 50-backend-stack.md
- Create 51-frontend-architecture.md
- Create 52-resilience-patterns.md

### Task 8: Workflow (60-62)

- Create 60-git-workflow.md
- Create 61-monorepo-commands.md
- Create 62-development-workflow.md

### Task 9: Validation

- Run all post-refactoring tests
- Perform manual review
- Test with Kiro AI
- Fix any issues found

### Task 10: Cleanup

- Update README.md index
- Remove old steering files (keep backup)
- Document completion

---

## 10. Success Criteria

The refactoring is considered successful when:

1. ✅ All 62 new steering files are created
2. ✅ README.md is created with complete index
3. ✅ Backup directory contains all original files
4. ✅ No unique content is lost from original files
5. ✅ No content is duplicated across new files
6. ✅ All cross-references are valid
7. ✅ All file references point to existing files
8. ✅ All files have valid front matter
9. ✅ Backend/Frontend separation is clear
10. ✅ All content is based on codebase analysis
11. ✅ All tests pass
12. ✅ Manual review checklist is complete
13. ✅ Kiro AI testing is successful

---

## 11. Appendix

### 11.1 File Mapping Reference

Quick reference for mapping old files to new files:

| Old File                                    | New File(s)                   | Notes                                                            |
| ------------------------------------------- | ----------------------------- | ---------------------------------------------------------------- |
| PRD.md                                      | 01-product-requirements.md    | Remove architecture details, add cross-refs                      |
| bounded-contexts.md                         | 02-bounded-contexts.md        | Direct copy with cross-refs                                      |
| user-customer-businessowner-architecture.md | 03-identity-architecture.md   | Direct copy with cross-refs                                      |
| architecture.md                             | 04-system-architecture.md     | Remove CQRS/DDD details, add cross-refs                          |
| cqrs.md                                     | 10-cqrs-pattern.md            | Direct copy with cross-refs                                      |
| ddd-patterns.md                             | 11-ddd-tactical-patterns.md   | Remove factory basics, add cross-refs                            |
| factory-pattern.md                          | 12-factory-pattern.md         | Direct copy with cross-refs                                      |
| architecture-boundaries.md                  | 13-architecture-boundaries.md | Direct copy with cross-refs                                      |
| nestjs-patterns.md                          | 20-nestjs-implementation.md   | Consolidate with clean-code.md NestJS parts                      |
| clean-code.md                               | 21-clean-code-principles.md   | Remove NestJS/naming/testing, add cross-refs                     |
| naming-conventions.md                       | 30-naming-conventions.md      | Consolidate with clean-code.md naming parts                      |
| import-conventions.md                       | 31-import-conventions.md      | Direct copy with cross-refs                                      |
| eslint-path-aliases.md                      | 32-eslint-configuration.md    | Direct copy with cross-refs                                      |
| (multiple)                                  | 40-backend-testing.md         | NEW - consolidate from clean-code.md, nestjs-patterns.md, PRD.md |
| frontend-testing-conventions.md             | 41-frontend-testing.md        | Direct copy with cross-refs                                      |
| stack.md                                    | 50-backend-stack.md           | Direct copy with cross-refs                                      |
| frontend-PRD.md                             | 51-frontend-architecture.md   | Direct copy with cross-refs                                      |
| resilience-patterns.md                      | 52-resilience-patterns.md     | Direct copy with cross-refs                                      |
| git-workflow.md                             | 60-git-workflow.md            | Direct copy with cross-refs                                      |
| pnpm-commands.md                            | 61-monorepo-commands.md       | Direct copy with cross-refs                                      |
| hot-reload.md                               | 62-development-workflow.md    | Direct copy with cross-refs                                      |

### 11.2 Cross-Reference Template

Use this template for cross-references:

```markdown
> **📖 Related:** See [File Name](./XX-file-name.md) for [specific topic]
```

Examples:

```markdown
> **📖 Related:** See [CQRS Pattern](./10-cqrs-pattern.md) for CQRS implementation details

> **📖 Related:** See [DDD Tactical Patterns](./11-ddd-tactical-patterns.md#repositories) for repository pattern documentation

> **📖 Related:** See [Bounded Contexts](./02-bounded-contexts.md) for complete BC definitions
```

### 11.3 File Reference Template

Use this template for file references:

````markdown
## Example Implementation

The following implementation can be found in the codebase:

#[[file:apps/backend/src/path/to/file.ts]]

```typescript
// Code example
```
````

```

---

**End of Design Document**

```
