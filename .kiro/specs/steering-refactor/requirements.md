# Requirements Document - Steering Files Refactorization

## Introduction

This document defines the requirements for refactoring and reorganizing all steering files in the `.kiro/steering/` directory. The goal is to create a well-structured, maintainable, and discoverable documentation system that follows Kiro's steering file best practices with proper inclusion modes and clear organization.

## Glossary

- **Steering File**: Markdown documentation file that provides context and guidance to Kiro AI during development
- **Inclusion Mode**: Configuration that determines when a steering file is loaded (always, fileMatch, manual)
- **Front Matter**: YAML metadata at the beginning of a steering file that configures its behavior
- **File Reference**: Link to live workspace files using `#[[file:<relative_file_name>]]` syntax
- **Bounded Context**: DDD concept representing a logical boundary within the domain model

## Requirements

### Requirement 1: Backup Existing Steering Files

**User Story:** As a developer, I want to preserve the current steering files before refactoring, so that I can reference the original content if needed.

#### Acceptance Criteria

1. THE System SHALL create a backup directory at `.kiro/steering/backup/`
2. THE System SHALL copy all existing steering files from `.kiro/steering/` to `.kiro/steering/backup/`
3. THE System SHALL preserve the original file names and content in the backup
4. THE System SHALL exclude the backup directory itself from being backed up (no recursive backup)

---

### Requirement 2: Create Steering Documentation README

**User Story:** As a developer, I want comprehensive documentation about steering files, so that I understand how to use and maintain them.

#### Acceptance Criteria

1. THE System SHALL create a `README.md` file at `.kiro/steering/README.md`
2. THE README SHALL include all content from https://kiro.dev/docs/steering/
3. THE README SHALL document the three inclusion modes: always, fileMatch, and manual
4. THE README SHALL provide examples of front matter configuration
5. THE README SHALL explain file reference syntax `#[[file:<relative_file_name>]]`
6. THE README SHALL include best practices for organizing steering files
7. THE README SHALL provide common steering file strategies with examples

---

### Requirement 3: Organize Steering Files by Category

**User Story:** As a developer, I want steering files organized by category with clear numbering, so that I can easily find relevant documentation.

#### Acceptance Criteria

1. THE System SHALL organize steering files into the following categories:
   - **00-09**: Product & Overview (PRD, bounded contexts, product vision)
   - **10-19**: Architecture Fundamentals (clean architecture, DDD, CQRS, DI)
   - **20-29**: Domain Layer Patterns (aggregates, VOs, services, events)
   - **30-39**: Infrastructure & Application (repositories, factories, adapters, controllers)
   - **40-49**: Code Quality & Testing (naming, testing, logging)
   - **50-59**: Technology & Tools (stack, NestJS, frontend)
   - **60-69**: Development Workflow (git, pnpm, hot-reload)

2. THE System SHALL use two-digit prefixes for all steering files (e.g., `01-`, `10-`, `20-`)

3. THE System SHALL rename and reorganize existing steering files as follows:

**Category 00-09: Product & Architecture Overview**

- `PRD.md` → `01-product-requirements.md` - Complete PRD with MVP scope, bounded contexts, use cases
- `bounded-contexts.md` → `02-bounded-contexts.md` - DDD bounded contexts and responsibilities
- `user-customer-businessowner-architecture.md` → `03-identity-architecture.md` - User/Customer/BusinessOwner unified architecture
- `architecture.md` → `04-architecture-overview.md` - Clean Architecture, DDD, CQRS, Event-Driven principles

**Category 10-19: Architecture Patterns & Layers**

- `cqrs.md` → `10-cqrs-patterns.md` - CQRS with NestJS (Commands, Queries, Events, Sagas)
- `ddd-patterns.md` → `11-ddd-patterns.md` - DDD tactical patterns (Aggregates, VOs, Services, Events, Repositories)
- `factory-pattern.md` → `12-factory-pattern.md` - Factory pattern for CQRS strict separation
- `architecture-boundaries.md` → `13-architecture-boundaries.md` - Layer dependency rules and ESLint validation

**Category 20-29: NestJS & Infrastructure**

- `nestjs-patterns.md` → `20-nestjs-patterns.md` - NestJS modules, DI, controllers, guards, pipes, filters
- `clean-code.md` → `21-clean-code-solid.md` - Clean Code principles and SOLID patterns

**Category 30-39: Code Organization & Conventions**

- `naming-conventions.md` → `30-naming-conventions.md` - File, class, variable naming standards
- `import-conventions.md` → `31-import-conventions.md` - Path aliases and import organization
- `eslint-path-aliases.md` → `32-eslint-path-aliases.md` - ESLint rules for enforcing path aliases

**Category 40-49: Testing & Quality**

- `frontend-testing-conventions.md` → `40-frontend-testing.md` - Frontend testing with Vitest, React Testing Library, MSW

**Category 50-59: Technology Stack**

- `stack.md` → `50-backend-stack.md` - Backend stack (NestJS, TypeORM, PostgreSQL, WhatsApp API)
- `frontend-PRD.md` → `51-frontend-stack.md` - Frontend stack (React, Vite, Mantine, TanStack Query)
- `resilience-patterns.md` → `52-resilience-patterns.md` - Retry logic, circuit breaker, error handling

**Category 60-69: Development Workflow**

- `git-workflow.md` → `60-git-workflow.md` - Git branching, commits, PRs, rulesets
- `pnpm-commands.md` → `61-pnpm-commands.md` - PNPM workspace commands
- `hot-reload.md` → `62-hot-reload.md` - Development server hot reload and troubleshooting

---

### Requirement 4: Configure Inclusion Modes

**User Story:** As a developer, I want steering files to load at appropriate times, so that Kiro has relevant context without overwhelming every interaction.

#### Acceptance Criteria

1. WHEN a steering file contains fundamental architecture or coding standards, THE System SHALL configure it with `inclusion: always`
2. WHEN a steering file is specific to certain file types or domains, THE System SHALL configure it with `inclusion: fileMatch` and appropriate `fileMatchPattern`
3. WHEN a steering file contains specialized or rarely-needed information, THE System SHALL configure it with `inclusion: manual`

**Specific Inclusion Mode Assignments:**

**Always Included (Core Architecture & Standards):**

- `01-product-requirements.md` - Core product context and MVP scope
- `02-bounded-contexts.md` - Domain structure and BC responsibilities
- `04-architecture-overview.md` - Fundamental architecture principles
- `10-cqrs-patterns.md` - CQRS fundamentals with NestJS
- `11-ddd-patterns.md` - Core DDD tactical patterns
- `13-architecture-boundaries.md` - Layer dependency rules (critical for all code)
- `30-naming-conventions.md` - Universal naming standards
- `31-import-conventions.md` - Import standards and path aliases
- `50-backend-stack.md` - Backend technology stack

**File Match Patterns (Domain-Specific):**

- `12-factory-pattern.md` - `fileMatchPattern: "**/infra/persistence/factories/**/*.ts"`
- `20-nestjs-patterns.md` - `fileMatchPattern: "**/*.module.ts"`
- `21-clean-code-solid.md` - `fileMatchPattern: "**/{domain,app,infra,presentation}/**/*.ts"`
- `32-eslint-path-aliases.md` - `fileMatchPattern: "**/*.ts"`
- `40-frontend-testing.md` - `fileMatchPattern: "apps/frontend/**/*.{test,spec}.{ts,tsx}"`
- `51-frontend-stack.md` - `fileMatchPattern: "apps/frontend/**/*.{ts,tsx}"`

**Manual Inclusion (Reference Documentation):**

- `03-identity-architecture.md` - Detailed User/Customer/BusinessOwner architecture (reference when working on auth/account/customer BCs)
- `52-resilience-patterns.md` - Specialized retry/circuit breaker patterns (reference when implementing error handling)
- `60-git-workflow.md` - Git workflow reference (reference when needed)
- `61-pnpm-commands.md` - PNPM commands reference (reference when needed)
- `62-hot-reload.md` - Hot reload troubleshooting (reference when debugging dev server)

---

### Requirement 5: Add Front Matter to All Steering Files

**User Story:** As a developer, I want all steering files to have proper front matter configuration, so that Kiro loads them at the right time.

#### Acceptance Criteria

1. THE System SHALL add YAML front matter to the beginning of every steering file
2. THE front matter SHALL be enclosed by triple dashes (`---`)
3. THE front matter SHALL include the `inclusion` field with value `always`, `fileMatch`, or `manual`
4. WHEN `inclusion: fileMatch`, THE front matter SHALL include `fileMatchPattern` field with appropriate glob pattern
5. THE front matter SHALL be placed before any markdown content
6. THE front matter SHALL follow valid YAML syntax

**Example Front Matter:**

```yaml
---
inclusion: always
---
```

```yaml
---
inclusion: fileMatch
fileMatchPattern: "**/domain/aggregates/**/*.ts"
---
```

```yaml
---
inclusion: manual
---
```

---

### Requirement 6: Consolidate and Deduplicate Content

**User Story:** As a developer, I want steering files to avoid duplication and cross-reference related content, so that documentation is maintainable and consistent.

#### Acceptance Criteria

1. WHEN multiple steering files contain overlapping content, THE System SHALL consolidate the content into the most appropriate file
2. WHEN a steering file references content in another file, THE System SHALL use markdown links to reference it
3. THE System SHALL use the format `> **📖 See also:** [File Name](./filename.md)` for cross-references
4. THE System SHALL avoid copying large blocks of content between files
5. THE System SHALL maintain a single source of truth for each concept

**Example Cross-References:**

- `11-ddd-patterns.md` contains comprehensive DDD patterns; other files reference it for details
- `12-factory-pattern.md` is referenced by `10-cqrs-patterns.md` when explaining CQRS strict separation
- `03-identity-architecture.md` is referenced by `02-bounded-contexts.md` for detailed User/Customer/BusinessOwner relationships
- `13-architecture-boundaries.md` is referenced when explaining layer separation rules

---

### Requirement 7: Include File References Where Appropriate

**User Story:** As a developer, I want steering files to reference live code examples, so that documentation stays current with the codebase.

#### Acceptance Criteria

1. WHEN a steering file explains a pattern with a concrete implementation, THE System SHALL include a file reference using `#[[file:<relative_file_name>]]`
2. THE System SHALL use file references for:
   - Example aggregate implementations
   - Example repository implementations
   - Configuration files (tsconfig.json, package.json)
   - API specifications (if applicable)
3. THE file references SHALL use paths relative to the workspace root
4. THE System SHALL verify that referenced files exist in the workspace

**Example File References:**

- `#[[file:apps/backend/src/booking/domain/aggregates/appointment.ts]]` - Example aggregate implementation
- `#[[file:apps/backend/src/shared/kernel/versioned-aggregate-root.base.ts]]` - Base class for versioned aggregates
- `#[[file:apps/backend/src/booking/infra/persistence/factories/appointment-factory.ts]]` - Factory pattern implementation
- `#[[file:apps/backend/tsconfig.json]]` - TypeScript configuration with path aliases
- `#[[file:apps/backend/package.json]]` - Backend dependencies and scripts

---

### Requirement 8: Maintain Consistent Structure Within Files

**User Story:** As a developer, I want all steering files to follow a consistent structure, so that they are easy to read and navigate.

#### Acceptance Criteria

1. THE System SHALL structure each steering file with the following sections (where applicable):
   - **Overview** - Brief introduction to the topic
   - **Purpose** - Why this pattern/practice exists
   - **When to Use** - Scenarios where this applies
   - **Implementation** - How to implement with code examples
   - **Examples** - Concrete examples from the codebase
   - **Best Practices** - Do's and don'ts
   - **Common Mistakes** - Anti-patterns to avoid
   - **Testing** - How to test this pattern
   - **References** - Links to related steering files or external resources

2. THE System SHALL use consistent heading levels:
   - `#` for file title
   - `##` for major sections
   - `###` for subsections
   - `####` for detailed points

3. THE System SHALL use consistent formatting:
   - Code blocks with language specification (`typescript, `bash)
   - Tables for comparisons
   - Bullet lists for enumerations
   - Numbered lists for sequential steps

---

### Requirement 9: Preserve Critical Content

**User Story:** As a developer, I want all critical information from existing steering files to be preserved, so that no important guidance is lost.

#### Acceptance Criteria

1. THE System SHALL preserve all unique content from existing steering files
2. THE System SHALL not delete information that is not duplicated elsewhere
3. THE System SHALL maintain all code examples, tables, and diagrams
4. THE System SHALL preserve all cross-references and links
5. WHEN consolidating content, THE System SHALL merge information rather than discard it

---

### Requirement 10: Single Responsibility Per Steering File

**User Story:** As a developer, I want each steering file to have a single, specific responsibility, so that there is no duplication, redundancy, or noise across the documentation.

#### Acceptance Criteria

1. BEFORE creating new steering files, THE System SHALL analyze each existing steering file individually to identify its unique content
2. THE System SHALL identify overlapping content between existing steering files
3. THE System SHALL create a content responsibility matrix showing which topics belong in which files
4. THE System SHALL ensure each new steering file has ONE clear responsibility
5. WHEN content appears in multiple existing files, THE System SHALL consolidate it into the MOST APPROPRIATE single file
6. WHEN a steering file references content from another file, THE System SHALL use cross-references instead of duplicating content
7. THE System SHALL document the responsibility of each new steering file in its Overview section
8. THE System SHALL validate that no two steering files cover the same responsibility

**Responsibility Definition Guidelines:**

Each steering file MUST have a clear, single responsibility statement such as:

- "This file is responsible for documenting CQRS patterns with NestJS implementation"
- "This file is responsible for defining naming conventions for files, classes, and variables"
- "This file is responsible for explaining the Factory pattern for loading aggregates"

**Content Consolidation Strategy:**

1. **Identify Duplicates**: Find content that appears in multiple existing files
2. **Determine Owner**: Decide which file should own that content based on its primary responsibility
3. **Consolidate**: Move content to the owner file
4. **Cross-Reference**: Add links from other files to the owner file
5. **Validate**: Ensure no content is duplicated across files

**Example Consolidation:**

If both `cqrs.md` and `ddd-patterns.md` explain repositories:

- **Analysis**: Repositories are a DDD tactical pattern, not CQRS-specific
- **Decision**: Consolidate repository documentation in `11-ddd-patterns.md`
- **Action**: Remove repository content from `10-cqrs-patterns.md`
- **Cross-Reference**: Add in `10-cqrs-patterns.md`: `> **📖 See also:** [DDD Patterns - Repositories](./11-ddd-patterns.md#repositories)`

---

### Requirement 11: Context Analysis Before File Creation

**User Story:** As a developer, I want each steering file to be based on actual codebase analysis, so that documentation accurately reflects the real implementation without hallucinations or invented patterns.

#### Acceptance Criteria

1. BEFORE creating or updating any steering file, THE System SHALL perform keyword-based searches to identify related code files
2. THE System SHALL use `grepSearch` tool to find relevant implementations in the codebase
3. THE System SHALL analyze the search results to extract actual patterns, conventions, and implementations
4. THE System SHALL document the search strategy used for each steering file category
5. THE System SHALL analyze code in BOTH `apps/backend/src/` AND `apps/frontend/src/` directories
6. THE System SHALL provide backend-specific guidance when patterns are found in `apps/backend/src/`
7. THE System SHALL provide frontend-specific guidance when patterns are found in `apps/frontend/src/`
8. WHEN a steering file applies to both backend and frontend, THE System SHALL clearly separate sections for each (e.g., "Backend Implementation", "Frontend Implementation")

**Search Strategy by Category:**

**Product & Architecture (01-04):**

- **Backend Search**: `@Module`, `bounded context`, `aggregate`, `User`, `Customer`, `BusinessOwner`
- **Frontend Search**: Component structure, feature organization, routing patterns
- **Backend Files**: `apps/backend/src/*/domain/`, `apps/backend/src/*/*.module.ts`
- **Frontend Files**: `apps/frontend/src/app/`, `apps/frontend/src/pages/`, `apps/frontend/src/features/`
- Analyze: Module definitions, aggregate roots, domain models, frontend architecture

**Architecture Patterns (10-13):**

- **Backend Search**: `@CommandHandler`, `@QueryHandler`, `@EventsHandler`, `@Saga`, `Command<`, `Query<`, `ICommandHandler`, `IQueryHandler`
- **Frontend Search**: State management patterns, API client patterns, query/mutation hooks
- **Backend Files**: `apps/backend/src/*/app/commands/`, `apps/backend/src/*/app/queries/`, `apps/backend/src/*/app/event_handlers/`
- **Frontend Files**: `apps/frontend/src/entities/`, `apps/frontend/src/features/`, `apps/frontend/src/shared/api/`
- Analyze: CQRS implementations, command/query handlers, event handlers, sagas, TanStack Query usage

**DDD Patterns (11):**

- **Backend Search**: `extends VersionedAggregateRoot`, `extends ValueObject`, `Domain Service`, `interface I.*Repository`, `interface I.*Factory`
- **Frontend Search**: State management patterns, entity models, data transformation patterns
- **Backend Files**: `apps/backend/src/*/domain/aggregates/`, `apps/backend/src/*/domain/vo/`, `apps/backend/src/*/domain/services/`, `apps/backend/src/*/domain/interfaces/`
- **Frontend Files**: `apps/frontend/src/entities/`, `apps/frontend/src/shared/lib/`, state management files
- Analyze: Backend aggregate implementations, value objects, domain services, repository interfaces; Frontend entity models, data transformation utilities

**Factory Pattern (12):**

- **Backend Search**: `interface I.*Factory`, `class .*Factory implements`, `loadById`, `fromPersistence`
- **Frontend Search**: N/A (Backend-specific pattern)
- **Backend Files**: `apps/backend/src/*/domain/interfaces/factories/`, `apps/backend/src/*/infra/persistence/factories/`
- **Frontend Files**: N/A
- Analyze: Factory implementations for loading aggregates (Backend only)
- **Note**: This is a backend-specific pattern for CQRS strict separation

**Architecture Boundaries (13):**

- **Backend Search**: `eslint-plugin-boundaries`, `boundaries/`, `@shared/`, `@booking/`, `@conversation/`, path aliases
- **Frontend Search**: `@shared/`, `@app/`, `@pages/`, `@features/`, `@entities/`, path aliases, FSD layer boundaries
- **Backend Files**: `apps/backend/eslint.config.mjs`, `apps/backend/tsconfig.json`, boundary rule definitions
- **Frontend Files**: `apps/frontend/eslint.config.mjs`, `apps/frontend/tsconfig.json`, `apps/frontend/vite.config.ts`
- Analyze: Backend ESLint boundary rules for Clean Architecture layers; Frontend FSD layer boundaries and path alias configurations

**NestJS Patterns (20):**

- **Backend Search**: `@Module`, `@Injectable`, `@Controller`, `@Get`, `@Post`, `@UseGuards`, `@Inject`, `@CommandHandler`, `@QueryHandler`
- **Frontend Search**: N/A (Backend-specific framework)
- **Backend Files**: `apps/backend/src/*/*.module.ts`, `apps/backend/src/*/presentation/controllers/`, guard implementations, handler implementations
- **Frontend Files**: N/A
- Analyze: NestJS module structure, dependency injection, controllers, guards, pipes, CQRS handlers (Backend only)
- **Note**: This is backend-specific for NestJS framework patterns

**Clean Code (21):**

- **Backend Search**: `SOLID`, `Single Responsibility`, class definitions, interface definitions, aggregate patterns
- **Frontend Search**: Component composition, hook patterns, utility functions, separation of concerns
- **Backend Files**: `apps/backend/src/*/domain/`, `apps/backend/src/*/app/`, class and interface definitions
- **Frontend Files**: `apps/frontend/src/features/`, `apps/frontend/src/entities/`, `apps/frontend/src/shared/`, component and hook definitions
- Analyze: Backend SOLID principles in domain/application layers; Frontend component composition, custom hooks, utility organization

**Naming Conventions (30):**

- **Backend Search**: File naming patterns (`.aggregate.ts`, `.vo.ts`, `.command.ts`, `.handler.ts`), class naming patterns
- **Frontend Search**: File naming patterns (`.tsx`, `.test.tsx`, `use*.ts`), component naming patterns
- **Backend Files**: All TypeScript files in `apps/backend/src/`, examine patterns in file names and class names
- **Frontend Files**: All TypeScript/TSX files in `apps/frontend/src/`, examine patterns in component and hook names
- Analyze: Backend naming conventions for aggregates, VOs, commands, handlers; Frontend naming conventions for components, hooks, utilities

**Import Conventions (31):**

- **Backend Search**: `import.*@shared`, `import.*@booking`, `import.*@conversation`, `import.*@packages`, path aliases usage
- **Frontend Search**: `import.*@shared`, `import.*@app`, `import.*@pages`, `import.*@features`, `import.*@entities`, path aliases usage
- **Backend Files**: `apps/backend/tsconfig.json`, actual import statements across backend codebase
- **Frontend Files**: `apps/frontend/tsconfig.json`, `apps/frontend/vite.config.ts`, actual import statements across frontend codebase
- Analyze: Backend import patterns with BC-specific aliases; Frontend import patterns with FSD layer aliases

**ESLint Path Aliases (32):**

- **Backend Search**: `eslint-local-rules`, `enforce-path-aliases`, path alias configurations, `@shared/`, `@booking/`
- **Frontend Search**: ESLint configuration, path alias rules, `@shared/`, `@app/`, `@pages/`, `@features/`
- **Backend Files**: `apps/backend/eslint-local-rules.cjs`, `apps/backend/eslint.config.mjs`, `apps/backend/tsconfig.json`
- **Frontend Files**: `apps/frontend/eslint.config.mjs`, `apps/frontend/tsconfig.json`, `apps/frontend/vite.config.ts`
- Analyze: Backend ESLint custom rules for enforcing path aliases; Frontend ESLint configuration for FSD layer aliases

**Frontend Testing (40):**

- **Backend Search**: N/A (Frontend-specific)
- **Frontend Search**: `describe`, `it(`, `test(`, `vitest`, `@testing-library`, `MSW`, `*.test.ts`, `*.spec.tsx`, `render`, `screen`, `fireEvent`
- **Backend Files**: N/A
- **Frontend Files**: `apps/frontend/**/__tests__/`, `apps/frontend/**/*.test.{ts,tsx}`, `apps/frontend/vitest.config.ts`, MSW setup files
- Analyze: Frontend test patterns with Vitest, React Testing Library, MSW for API mocking (Frontend only)
- **Note**: This is frontend-specific for React component and hook testing

**Backend Stack (50):**

- **Backend Search**: `@nestjs`, `typeorm`, `pg`, `@nestjs/cqrs`, `bcrypt`, `passport`, package dependencies
- **Frontend Search**: N/A (Backend-specific)
- **Backend Files**: `apps/backend/package.json`, `apps/backend/tsconfig.json`, `apps/backend/nest-cli.json`
- **Frontend Files**: N/A
- Analyze: Backend dependencies, versions, NestJS configuration, TypeORM setup (Backend only)
- **Note**: This is backend-specific for NestJS, TypeORM, PostgreSQL stack

**Frontend Stack (51):**

- **Backend Search**: N/A (Frontend-specific)
- **Frontend Search**: `react`, `vite`, `@mantine`, `@tanstack/react-query`, `zustand`, `react-router`, package dependencies
- **Backend Files**: N/A
- **Frontend Files**: `apps/frontend/package.json`, `apps/frontend/vite.config.ts`, `apps/frontend/tsconfig.json`
- Analyze: Frontend dependencies, versions, Vite configuration, React setup (Frontend only)
- **Note**: This is frontend-specific for React, Vite, Mantine, TanStack Query stack

**Resilience Patterns (52):**

- **Backend Search**: `retry`, `ConcurrencyException`, `exponential backoff`, `maxRetries`, `circuit breaker`, error handling in handlers
- **Frontend Search**: Error boundaries, retry logic in queries, error handling in API client, `onError`, `retry` in TanStack Query
- **Backend Files**: `apps/backend/src/*/app/commands/`, `apps/backend/src/*/app/queries/`, command handlers with retry logic
- **Frontend Files**: `apps/frontend/src/shared/api/`, `apps/frontend/src/app/providers/`, error boundary components, query configurations
- Analyze: Backend retry implementations with exponential backoff, optimistic locking; Frontend error boundaries, TanStack Query retry configuration

**Git Workflow (60):**

- **Backend Search**: `.github/workflows`, branch protection, PR templates, commit conventions
- **Frontend Search**: Same as backend (applies to entire monorepo)
- **Backend Files**: `.github/`, `.husky/`, `commitlint.config.js`, git configuration files
- **Frontend Files**: Same as backend (monorepo-level configuration)
- Analyze: Git workflow configuration, GitHub Actions, Husky hooks, commit linting (Applies to both)
- **Note**: This applies to the entire monorepo, not specific to backend or frontend

**PNPM Commands (61):**

- **Backend Search**: `pnpm`, `workspace`, scripts in package.json, `--filter backend`
- **Frontend Search**: `pnpm`, `workspace`, scripts in package.json, `--filter frontend`
- **Backend Files**: Root `package.json`, `apps/backend/package.json`, `pnpm-workspace.yaml`
- **Frontend Files**: Root `package.json`, `apps/frontend/package.json`, `pnpm-workspace.yaml`
- Analyze: PNPM workspace configuration, backend-specific scripts, frontend-specific scripts (Applies to both)
- **Note**: Document both backend and frontend workspace commands

**Hot Reload (62):**

- **Backend Search**: `nodemon`, `nest start --watch`, dev server configuration, `start:dev` script
- **Frontend Search**: `vite`, `HMR`, `Hot Module Replacement`, dev server configuration, `dev` script
- **Backend Files**: `apps/backend/nodemon.json`, `apps/backend/package.json` (dev scripts), `apps/backend/nest-cli.json`
- **Frontend Files**: `apps/frontend/vite.config.ts`, `apps/frontend/package.json` (dev scripts)
- Analyze: Backend hot reload with nodemon and NestJS; Frontend HMR with Vite

5. THE System SHALL document findings from searches in the steering file
6. THE System SHALL include file references `#[[file:path]]` to actual implementations found
7. THE System SHALL NOT include patterns or examples that don't exist in the codebase
8. THE System SHALL verify all code examples against actual codebase before including them
9. WHEN a pattern is not found in the codebase (backend or frontend), THE System SHALL omit it from the steering file
10. THE System SHALL include a "References" section in each steering file listing the actual files analyzed from both backend and frontend (when applicable)
11. WHEN a steering file applies to both backend and frontend, THE System SHALL clearly separate sections (e.g., "## Backend Implementation", "## Frontend Implementation")
12. WHEN a steering file is backend-only or frontend-only, THE System SHALL explicitly note this in the Overview section

---

### Requirement 12: Create Index in README

**User Story:** As a developer, I want a comprehensive index in the README, so that I can quickly find relevant steering files.

#### Acceptance Criteria

1. THE README SHALL include a "Steering Files Index" section
2. THE index SHALL list all steering files organized by category
3. THE index SHALL include a brief description for each file
4. THE index SHALL indicate the inclusion mode for each file (always/fileMatch/manual)
5. THE index SHALL use markdown links to each steering file
6. THE index SHALL be kept at the beginning of the README after the introduction

**Example Index Entry:**

```markdown
### 00-09: Product & Architecture Overview

- **[01-product-requirements.md](./01-product-requirements.md)** (always) - Complete PRD with MVP scope, bounded contexts, use cases, and architecture decisions
- **[02-bounded-contexts.md](./02-bounded-contexts.md)** (always) - DDD bounded contexts: auth, account, business, offering, availability, booking, customer, conversation, notification
- **[03-identity-architecture.md](./03-identity-architecture.md)** (manual) - Detailed User/Customer/BusinessOwner unified architecture for marketplace evolution
- **[04-architecture-overview.md](./04-architecture-overview.md)** (always) - Clean Architecture, DDD, CQRS, Event-Driven principles and layer separation

### 10-19: Architecture Patterns & Layers

- **[10-cqrs-patterns.md](./10-cqrs-patterns.md)** (always) - CQRS with NestJS: Commands, Queries, Events, Sagas, and strict separation
- **[11-ddd-patterns.md](./11-ddd-patterns.md)** (always) - DDD tactical patterns: Aggregates, Value Objects, Domain Services, Events, Repositories, Factories
```

---

## Testing Strategy

### Unit Testing

- Verify that all steering files have valid YAML front matter
- Verify that all file references point to existing files
- Verify that all markdown links are valid

### Integration Testing

- Test that Kiro loads steering files according to their inclusion mode
- Test that fileMatch patterns correctly match target files
- Test that manual inclusion works when referenced with #steering-file-name

### Content Validation

- Verify that no critical content was lost during refactoring
- Verify that all cross-references are accurate
- Verify that code examples are syntactically correct

---

### Requirement 13: Rollback and Recovery Strategy

**User Story:** As a developer, I want a clear rollback strategy, so that I can revert changes if issues arise during or after refactoring.

#### Acceptance Criteria

1. WHEN starting refactorization THEN the system SHALL create a timestamped backup of all steering files
2. WHEN validation fails THEN the system SHALL provide a one-command rollback procedure
3. WHEN rollback is executed THEN the system SHALL restore all original files and remove new files
4. THE System SHALL document the rollback procedure in the README.md
5. THE System SHALL preserve the backup directory until refactoring is validated and approved

---

### Requirement 14: Validation Criteria Enhancement

**User Story:** As a developer, I want clear validation criteria for content accuracy, so that I can verify patterns exist in the codebase without ambiguity.

#### Acceptance Criteria

1. WHEN a pattern has multiple implementations THEN the steering file SHALL reference the most recent or canonical implementation
2. WHEN a pattern is deprecated THEN the steering file SHALL mark it as deprecated and reference the replacement
3. WHEN verifying content accuracy THEN the system SHALL validate code examples against actual codebase syntax
4. WHEN a pattern is found but has evolved THEN the steering file SHALL document the current implementation
5. THE System SHALL define a threshold for pattern existence (minimum one clear example in codebase)

---

### Requirement 15: Single Responsibility Definition

**User Story:** As a developer, I want clear boundaries for single responsibility, so that I can determine when to split vs. keep content together.

#### Acceptance Criteria

1. THE System SHALL define "single topic" as one cohesive concept with clear boundaries
2. WHEN topics naturally overlap THEN the system SHALL use the following criteria:
   - If concepts are parent-child relationship (e.g., DDD → Aggregates), keep in same file with sections
   - If concepts are siblings (e.g., Aggregates vs Value Objects), split into separate files
   - If concepts are implementation details of same pattern (e.g., NestJS Modules → DI), keep together
3. THE System SHALL document the responsibility of each file in its Overview section
4. THE System SHALL provide examples of correct splitting decisions in the design document

---

## Testing Strategy

### Unit Testing

- Verify that all steering files have valid YAML front matter
- Verify that all file references point to existing files
- Verify that all markdown links are valid

### Integration Testing

- Test that Kiro loads steering files according to their inclusion mode
- Test that fileMatch patterns correctly match target files
- Test that manual inclusion works when referenced with #steering-file-name

### Content Validation

- Verify that no critical content was lost during refactoring
- Verify that all cross-references are accurate
- Verify that code examples are syntactically correct

---

## Notes

- This refactoring should be done incrementally, one category at a time
- Each new steering file should be reviewed for accuracy before moving to the next
- The backup directory should be kept until the refactoring is complete and validated
- Consider creating a migration guide document to help team members adapt to the new structure
