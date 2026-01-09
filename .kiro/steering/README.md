---
inclusion: fileMatch
fileMatchPattern: ".kiro/**/*.md"
---

# Kiro Steering Files

This directory contains steering files that give Kiro persistent knowledge about the bookings-bot project.

## What is Steering?

Steering gives Kiro persistent knowledge about your project through markdown files in `.kiro/steering/`. Instead of explaining your conventions in every chat, steering files ensure Kiro consistently follows your established patterns, libraries, and standards.

### Key Benefits

- **Consistent Code Generation** - Every component, API endpoint, or test follows your team's established patterns and conventions
- **Reduced Repetition** - No need to explain project standards in each conversation. Kiro remembers your preferences
- **Team Alignment** - All developers work with the same standards, whether they're new to the project or seasoned contributors
- **Scalable Project Knowledge** - Documentation that grows with your codebase, capturing decisions and patterns as your project evolves

## Steering File Scope

### Workspace Steering

These steering files reside in your workspace root folder under `.kiro/steering/`, and apply only to this specific workspace. They inform Kiro of patterns, libraries, and standards that apply to the bookings-bot project.

Kiro automatically loads these files in chat sessions.

### Global Steering

Global steering files reside in your home directory under `~/.kiro/steering/`, and apply to all workspaces. They can be used to inform Kiro of conventions that apply to all your workspaces.

In case of conflicting instructions between global and workspace steering, Kiro will prioritize the workspace steering instructions.

### Team Steering

The global steering feature can be used to define centralized steering files that apply to entire teams. Team steering files can be pushed to user's PCs via MDM solutions or Group Policies, or downloaded by users to their PCs from a central repository, and placed into the `~/.kiro/steering` folder.

## Foundational Steering Files

This project includes foundational steering files that establish core project context:

- **Product Overview** - Defines the product's purpose, target users, key features, and business objectives
- **Technology Stack** - Documents chosen frameworks, libraries, development tools, and technical constraints
- **Project Structure** - Outlines file organization, naming conventions, import patterns, and architectural decisions

These foundation files are included in every interaction by default, forming the baseline of Kiro's project understanding.

## Creating Custom Steering Files

Extend Kiro's understanding with specialized guidance tailored to your project's unique needs:

1. Create a new `.md` file in `.kiro/steering/`
2. Choose a descriptive filename (e.g., `api-standards.md`)
3. Write your guidance using standard markdown syntax
4. Use natural language to describe your requirements

Custom steering files are stored in `.kiro/steering/` and become immediately available across all Kiro CLI chat sessions.

## Steering with Custom Agents

When using custom agents, steering files are not automatically included. You must explicitly add them to the agent's resources configuration to load steering context.

To include all steering files in a custom agent, add the following to your agent configuration:

```json
{
  "resources": ["file://.kiro/steering/**/*.md"]
}
```

This glob pattern ensures all markdown files in your steering directory are loaded when using the agent.

## AGENTS.md

Kiro supports providing steering directives via the AGENTS.md standard. AGENTS.md files are in markdown format, similar to Kiro steering files; however, AGENTS.md files are always included.

You can add AGENTS.md files to the global steering file location (`~/.kiro/steering/`), or to the root folder of your workspace, and they will get picked up by Kiro automatically.

## Best Practices

### Keep Files Focused

One domain per file - API design, testing, or deployment procedures.

### Use Clear Names

- `api-rest-conventions.md` - REST API standards
- `testing-unit-patterns.md` - Unit testing approaches
- `components-form-validation.md` - Form component standards

### Include Context

Explain why decisions were made, not just what the standards are.

### Provide Examples

Use code snippets and before/after comparisons to demonstrate standards.

### Security First

Never include API keys, passwords, or sensitive data. Steering files are part of your codebase.

### Maintain Regularly

- Review during sprint planning and architecture changes
- Test file references after restructuring
- Treat steering changes like code changes - require reviews

## Common Steering File Strategies

### API Standards

Define REST conventions, error response formats, authentication flows, and versioning strategies. Include endpoint naming patterns, HTTP status code usage, and request/response examples.

### Testing Approach

Establish unit test patterns, integration test strategies, mocking approaches, and coverage expectations. Document preferred testing libraries, assertion styles, and test file organization.

### Code Style

Specify naming patterns, file organization, import ordering, and architectural decisions. Include examples of preferred code structures, component patterns, and anti-patterns to avoid.

### Security Guidelines

Document authentication requirements, data validation rules, input sanitization standards, and vulnerability prevention measures. Include secure coding practices specific to your application.

### Deployment Process

Outline build procedures, environment configurations, deployment steps, and rollback strategies. Include CI/CD pipeline details and environment-specific requirements.

## File Organization

This project organizes steering files by category using numbered prefixes:

- **01-04**: Product & Architecture
- **10-13**: Architecture Patterns
- **20-21**: NestJS Implementation
- **30-32**: Code Organization
- **40-41**: Testing
- **50-52**: Tech Stack
- **60-62**: Workflow

This numbering scheme makes files easy to find and maintains logical grouping.

## Inclusion Modes

Steering files in this project use three inclusion modes:

### Always Inclusion (5 files)

Files with `inclusion: always` are loaded for every interaction. Use for core principles, fundamental concepts, and universal guidelines.

```yaml
---
inclusion: always
---
```

**Files:**

- `01-product-requirements.md` - Product requirements and business context
- `02-bounded-contexts.md` - Bounded context definitions
- `21-clean-code-principles.md` - Clean code and SOLID principles
- `30-naming-conventions.md` - Naming conventions
- `31-import-conventions.md` - Import conventions

### FileMatch Inclusion (13 files)

Files with `inclusion: fileMatch` are loaded only when working with matching files. Use for technology-specific guidance and layer-specific patterns.

```yaml
---
inclusion: fileMatch
fileMatchPattern: "**/domain/aggregates/**/*.ts"
---
```

**Files:**

- `10-cqrs-pattern.md` - CQRS patterns (commands/queries/events)
- `11-ddd-tactical-patterns.md` - DDD patterns (domain files)
- `12-factory-pattern.md` - Factory pattern (factory files)
- `13-architecture-boundaries.md` - Architecture boundaries (domain/app/infra)
- `20-nestjs-implementation.md` - NestJS patterns (modules/controllers)
- `32-eslint-configuration.md` - ESLint configuration (all TS/TSX)
- `40-backend-testing.md` - Backend testing (backend test files)
- `41-frontend-testing.md` - Frontend testing (frontend test files)
- `50-backend-stack.md` - Backend stack (infra/modules)
- `51-frontend-architecture.md` - Frontend architecture (frontend files)
- `52-resilience-patterns.md` - Resilience patterns (external/commands)
- `60-git-workflow.md` - Git workflow (git/markdown files)
- `61-monorepo-commands.md` - Monorepo commands (package.json/workspace)
- `62-development-workflow.md` - Development workflow (all TS/TSX)

### Manual Inclusion (2 files)

Files with `inclusion: manual` are loaded only when explicitly requested. Use for reference material and optional documentation.

```yaml
---
inclusion: manual
---
```

**Files:**

- `03-identity-architecture.md` - Identity architecture details
- `04-system-architecture.md` - System architecture details

To manually include a steering file, use the `#` symbol in chat:

```
Can you help me understand the identity architecture? #03-identity-architecture
```

## Migration from Old Structure

If you're looking for content from deprecated files, see `MIGRATION.md` for detailed mapping from old file names to new numbered files.

## Validation

Run the validation script to check steering files integrity:

```bash
.kiro/steering/validate.sh
```

## Rollback

If you need to restore the original steering files structure, run:

```bash
.kiro/steering/rollback.sh
```

This will remove all numbered files and restore the original files from backup.

---

**Last Updated:** January 9, 2026  
**Total Files:** 20  
**Status:** Complete ✅ (Including Inclusion Mode Optimization)

## Refactorization Complete

All steering files have been successfully refactored into the new numbered structure with optimized inclusion modes:

- **Product & Architecture (01-04):** 4 files covering product requirements, bounded contexts, identity architecture, and system architecture
- **Architecture Patterns (10-13):** 4 files covering CQRS, DDD tactical patterns, factory pattern, and architecture boundaries
- **NestJS Implementation (20-21):** 2 files covering NestJS patterns and clean code principles
- **Code Organization (30-32):** 3 files covering naming conventions, import conventions, and ESLint configuration
- **Testing (40-41):** 2 files covering backend and frontend testing conventions
- **Tech Stack (50-52):** 3 files covering backend stack, frontend architecture, and resilience patterns
- **Workflow (60-62):** 3 files covering Git workflow, monorepo commands, and development workflow

**Inclusion Mode Distribution:**

- **Always (5 files):** Core principles loaded for every interaction
- **FileMatch (13 files):** Context-specific guidance loaded when working with matching files
- **Manual (2 files):** Reference documentation loaded only when explicitly requested

All original files are safely backed up in `.kiro/steering/backup/` and can be restored using the rollback script if needed.
