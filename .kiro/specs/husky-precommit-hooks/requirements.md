# Requirements Document - Husky Pre-Commit Hooks

## Introduction

This document specifies the requirements for implementing Husky pre-commit hooks in the monorepo. Husky will enforce code quality standards before commits are allowed, preventing low-quality code from entering the repository and reducing CI/CD failures.

**Objective:** Establish automated pre-commit checks that validate code quality, formatting, linting, and type safety at the developer's machine before pushing to remote.

## Glossary

- **Husky** - Git hooks manager that runs scripts before/after Git events
- **Pre-commit Hook** - Script executed before `git commit` completes
- **Staged Files** - Files added to Git staging area with `git add`
- **Lint-staged** - Tool to run linters on staged files only
- **ESLint** - JavaScript/TypeScript linter for code quality
- **Prettier** - Code formatter for consistent style
- **TypeScript** - Static type checker for JavaScript
- **Monorepo** - Single repository containing multiple projects (backend, frontend, packages)

## Requirements

### Requirement 1: Husky Installation and Setup

**User Story:** As a developer, I want Husky to be installed and configured in the monorepo, so that Git hooks are automatically set up when I clone the repository.

#### Acceptance Criteria

1. WHEN a developer clones the repository and runs `pnpm install`, THEN Husky should be automatically installed and Git hooks should be initialized in `.git/hooks`
2. WHEN Husky is installed, THEN a `.husky` directory should be created at the monorepo root with hook scripts
3. WHEN a developer runs `pnpm install`, THEN the `prepare` script should execute automatically to set up Husky hooks
4. WHEN Husky is configured, THEN the `.husky` directory should be committed to Git so all developers have the same hooks

### Requirement 2: Pre-Commit Hook - Lint-Staged Integration

**User Story:** As a developer, I want linting to run only on staged files before commit, so that I don't have to wait for the entire codebase to be linted.

#### Acceptance Criteria

1. WHEN a developer stages files and attempts to commit, THEN lint-staged should run ESLint only on the staged files
2. WHEN lint-staged detects linting errors in staged files, THEN the commit should be blocked and errors should be displayed
3. WHEN lint-staged detects linting errors, THEN the developer should be able to fix them and retry the commit
4. WHEN all staged files pass linting, THEN the pre-commit hook should proceed to the next check

### Requirement 2.1: Pre-Commit Hook - Path Alias Enforcement

**User Story:** As a developer, I want TypeScript path aliases to be enforced in all internal imports, so that the codebase maintains consistent import patterns and improves maintainability.

#### Acceptance Criteria

1. WHEN a developer stages files with relative imports (e.g., `../../../domain/aggregates/appointment`), THEN ESLint should detect them and report an error
2. WHEN ESLint detects relative imports that should use path aliases, THEN the error message should indicate which alias to use
3. WHEN a developer runs `pnpm lint:fix`, THEN relative imports should be automatically converted to path aliases
4. WHEN a developer uses a non-permitted path alias (e.g., `@utils`, `@helpers`), THEN ESLint should report an error
5. WHEN all staged files use only permitted path aliases, THEN the pre-commit hook should proceed to the next check

**Permitted Path Aliases:**

- `@packages/shared-types` - Shared types package
- `@shared/*` - Shared kernel (backend)
- `@booking/*` - Booking BC (backend)
- `@conversation/*` - Conversation BC (backend)
- `@auth/*` - Auth BC (backend)
- `@availability/*` - Availability BC (backend)
- `@offering/*` - Offering BC (backend)
- `@customer/*` - Customer BC (backend)
- `@test-utils/*` - Test utilities (backend)
- `@database/*` - Database migrations/seeds (backend)
- `@config/*` - Configuration files (backend)

### Requirement 3: Pre-Commit Hook - Code Formatting Check

**User Story:** As a developer, I want Prettier to validate code formatting on staged files before commit, so that formatting issues are caught early.

#### Acceptance Criteria

1. WHEN a developer stages files and attempts to commit, THEN Prettier should check formatting on staged files
2. WHEN Prettier detects formatting issues, THEN the commit should be blocked and a message should indicate which files need formatting
3. WHEN formatting issues are detected, THEN the developer should be able to run `pnpm format` to fix them
4. WHEN all staged files pass formatting checks, THEN the pre-commit hook should proceed to the next check

### Requirement 4: Pre-Commit Hook - TypeScript Type Checking

**User Story:** As a developer, I want TypeScript type checking to run on staged files before commit, so that type errors are caught before pushing to remote.

#### Acceptance Criteria

1. WHEN a developer stages TypeScript files and attempts to commit, THEN TypeScript should perform type checking on the changed files
2. WHEN TypeScript detects type errors, THEN the commit should be blocked and type errors should be displayed
3. WHEN type errors are detected, THEN the developer should be able to fix them and retry the commit
4. WHEN all staged files pass type checking, THEN the pre-commit hook should proceed to the next check

### Requirement 5: Pre-Commit Hook - Commit Message Validation

**User Story:** As a developer, I want commit messages to follow a consistent format, so that the Git history is clean and searchable.

#### Acceptance Criteria

1. WHEN a developer attempts to commit, THEN the commit message should be validated against the conventional commits format
2. WHEN a commit message does not follow the format `<type>: <description>`, THEN the commit should be blocked
3. WHEN a commit message is invalid, THEN a helpful error message should explain the required format
4. WHEN a commit message follows the correct format, THEN the commit should be allowed to proceed

### Requirement 6: Pre-Commit Hook - Secret Scanning

**User Story:** As a developer, I want secrets (API keys, passwords) to be detected before commit, so that sensitive data is never accidentally committed.

#### Acceptance Criteria

1. WHEN a developer stages files containing potential secrets and attempts to commit, THEN secret scanning should detect them
2. WHEN potential secrets are detected, THEN the commit should be blocked and the developer should be warned
3. WHEN a false positive is detected, THEN the developer should be able to override with a flag (with documentation)
4. WHEN no secrets are detected, THEN the pre-commit hook should proceed to the next check

### Requirement 7: Pre-Commit Hook - File Size Limits

**User Story:** As a developer, I want large files to be prevented from being committed, so that the repository doesn't grow unnecessarily large.

#### Acceptance Criteria

1. WHEN a developer stages a file larger than 5MB and attempts to commit, THEN the commit should be blocked
2. WHEN a large file is detected, THEN an error message should indicate the file size and the limit
3. WHEN a large file needs to be committed, THEN the developer should be able to use Git LFS or request an exception
4. WHEN all staged files are within size limits, THEN the pre-commit hook should proceed to the next check

### Requirement 8: Pre-Commit Hook - Monorepo-Aware Checks

**User Story:** As a developer, I want pre-commit hooks to be aware of the monorepo structure, so that only relevant checks run for changed files.

#### Acceptance Criteria

1. WHEN a developer stages only backend files, THEN frontend linting should not run
2. WHEN a developer stages only frontend files, THEN backend linting should not run
3. WHEN a developer stages files in both backend and frontend, THEN both linting checks should run
4. WHEN a developer stages files in packages/shared-types, THEN type checking should run for all affected workspaces

### Requirement 9: Pre-Commit Hook - Performance and User Experience

**User Story:** As a developer, I want pre-commit hooks to run quickly, so that the commit process doesn't significantly slow down my workflow.

#### Acceptance Criteria

1. WHEN a developer commits with staged files, THEN the pre-commit hook should complete in less than 10 seconds for typical changes
2. WHEN a developer commits, THEN they should see clear progress messages indicating which checks are running
3. WHEN a pre-commit check fails, THEN the error message should be clear and actionable
4. WHEN a developer needs to bypass hooks temporarily, THEN they should be able to use `git commit --no-verify` with documentation

### Requirement 10: Pre-Commit Hook - Documentation and Developer Guidance

**User Story:** As a developer, I want clear documentation on how to use and troubleshoot pre-commit hooks, so that I can resolve issues quickly.

#### Acceptance Criteria

1. WHEN a developer encounters a pre-commit hook failure, THEN the error message should include a link to documentation
2. WHEN a developer reads the documentation, THEN it should explain each hook and how to fix common issues
3. WHEN a developer needs to bypass a hook, THEN the documentation should explain when and how to do so safely
4. WHEN a developer sets up the project, THEN they should see a message confirming Husky is installed and ready

### Requirement 11: Pre-Commit Hook - Bypass Mechanism for Emergencies

**User Story:** As a developer, I want to be able to bypass pre-commit hooks in emergencies, so that I can push critical fixes without delay.

#### Acceptance Criteria

1. WHEN a developer uses `git commit --no-verify`, THEN all pre-commit hooks should be skipped
2. WHEN a developer bypasses hooks, THEN a warning message should be displayed
3. WHEN a developer bypasses hooks, THEN the commit should still be allowed to proceed
4. WHEN hooks are bypassed, THEN CI/CD should still validate the code before merging

### Requirement 12: Pre-Commit Hook - Consistency Across Team

**User Story:** As a team lead, I want all developers to have the same pre-commit hooks configured, so that code quality is consistent across the team.

#### Acceptance Criteria

1. WHEN a new developer clones the repository, THEN they should automatically get the same Husky configuration as other developers
2. WHEN the Husky configuration is updated, THEN all developers should receive the update on their next `pnpm install`
3. WHEN a developer has an outdated Husky configuration, THEN they should see a message prompting them to update
4. WHEN all developers have the same hooks, THEN code quality should be consistent across commits
