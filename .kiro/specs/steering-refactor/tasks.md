# Steering Files Refactorization - Implementation Tasks

## Overview

This document breaks down the implementation of the steering files refactorization into concrete, actionable tasks. Each task includes specific steps, validation criteria, and dependencies.

**Total Tasks:** 10  
**Estimated Effort:** ~40 hours  
**Priority:** High (blocks AI context improvements)

---

## Task Status Legend

- ⬜ **Not Started** - Task hasn't begun
- 🟦 **In Progress** - Task is currently being worked on
- ✅ **Done** - Task is complete and validated
- ⚠️ **Blocked** - Task is blocked by dependencies

---

## Task 1: Backup and Setup

**Status:** ⬜ Not Started  
**Priority:** Critical (must be done first)  
**Estimated Time:** 30 minutes  
**Dependencies:** None

### Objectives

1. Create backup of all existing steering files
2. Set up directory structure for new files
3. Create README.md with Kiro steering documentation

### Detailed Steps

#### 1.1: Create Backup Directory

```bash
mkdir -p .kiro/steering/backup
```

**Validation:**

```bash
[ -d .kiro/steering/backup ] && echo "✅ Backup directory created" || echo "❌ Failed"
```

#### 1.2: List All Existing Steering Files

```bash
ls -1 .kiro/steering/*.md
```

**Expected files (20 total):**

- PRD.md
- architecture.md
- architecture-boundaries.md
- bounded-contexts.md
- clean-code.md
- cqrs.md
- ddd-patterns.md
- eslint-path-aliases.md
- factory-pattern.md
- frontend-PRD.md
- frontend-testing-conventions.md
- git-workflow.md
- hot-reload.md
- import-conventions.md
- naming-conventions.md
- nestjs-patterns.md
- pnpm-commands.md
- resilience-patterns.md
- stack.md
- user-customer-businessowner-architecture.md

#### 1.3: Copy All Files to Backup

```bash
cp .kiro/steering/*.md .kiro/steering/backup/
```

**Validation:**

```bash
# Count files in backup
backup_count=$(ls -1 .kiro/steering/backup/*.md 2>/dev/null | wc -l)
echo "Backup contains $backup_count files (expected: 20)"

# Verify each file was copied
for file in .kiro/steering/*.md; do
  basename_file=$(basename "$file")
  if [ -f ".kiro/steering/backup/$basename_file" ]; then
    echo "✅ $basename_file backed up"
  else
    echo "❌ $basename_file MISSING in backup"
  fi
done
```

#### 1.4: Verify Backup Integrity

```bash
# Compare file sizes
for file in .kiro/steering/*.md; do
  basename_file=$(basename "$file")
  original_size=$(wc -c < "$file")
  backup_size=$(wc -c < ".kiro/steering/backup/$basename_file")
  if [ "$original_size" -eq "$backup_size" ]; then
    echo "✅ $basename_file: $original_size bytes"
  else
    echo "❌ $basename_file: SIZE MISMATCH (original: $original_size, backup: $backup_size)"
  fi
done
```

#### 1.5: Create Rollback Script

Create `.kiro/steering/rollback.sh` for easy recovery:

```bash
cat > .kiro/steering/rollback.sh << 'EOF'
#!/bin/bash
# rollback.sh - Rollback steering files refactorization

echo "⚠️  WARNING: This will restore all original steering files and remove new files."
read -p "Are you sure you want to rollback? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Rollback cancelled."
  exit 0
fi

echo "Starting rollback..."

# Remove all new numbered files
rm -f .kiro/steering/[0-9][0-9]-*.md
echo "✅ Removed new numbered files"

# Restore original files from backup
cp .kiro/steering/backup/*.md .kiro/steering/
echo "✅ Restored original files from backup"

# Remove new README if it exists
if [ -f .kiro/steering/README.md ]; then
  mv .kiro/steering/README.md .kiro/steering/README.md.new
  echo "✅ Moved new README to README.md.new"
fi

echo "✅ Rollback complete!"
echo "Original files restored. Backup remains in .kiro/steering/backup/"
EOF

chmod +x .kiro/steering/rollback.sh
```

**Validation:**

```bash
[ -f .kiro/steering/rollback.sh ] && echo "✅ Rollback script created" || echo "❌ Failed"
[ -x .kiro/steering/rollback.sh ] && echo "✅ Rollback script is executable" || echo "❌ Not executable"
```

#### 1.6: Create README.md Structure

Create `.kiro/steering/README.md` with the following content:

````markdown
# Kiro Steering Files

This directory contains steering files that guide Kiro AI in providing context-aware assistance for the bookings-bot project.

## What are Steering Files?

Steering files are markdown documents that provide:

- Project-specific conventions and patterns
- Architecture decisions and rationale
- Code organization guidelines
- Testing strategies
- Development workflows

Kiro automatically loads relevant steering files based on the files you're working with.

## File Organization

Files are numbered 01-62 and organized by category:

### Product & Architecture (01-04)

- [ ] 01-product-requirements.md - Product requirements and business context
- [ ] 02-bounded-contexts.md - Bounded Context definitions
- [ ] 03-identity-architecture.md - User/Customer/BusinessOwner architecture
- [ ] 04-system-architecture.md - High-level system architecture

### Architecture Patterns (10-13)

- [ ] 10-cqrs-pattern.md - CQRS implementation with NestJS
- [ ] 11-ddd-tactical-patterns.md - DDD tactical patterns
- [ ] 12-factory-pattern.md - Factory pattern for aggregate loading
- [ ] 13-architecture-boundaries.md - Dependency rules and boundaries

### NestJS Implementation (20-21)

- [ ] 20-nestjs-implementation.md - NestJS-specific patterns
- [ ] 21-clean-code-principles.md - Clean code and SOLID principles

### Code Organization (30-32)

- [ ] 30-naming-conventions.md - Naming conventions
- [ ] 31-import-conventions.md - Import conventions and path aliases
- [ ] 32-eslint-configuration.md - ESLint configuration

### Testing (40-41)

- [ ] 40-backend-testing.md - Backend testing conventions
- [ ] 41-frontend-testing.md - Frontend testing conventions

### Tech Stack (50-52)

- [ ] 50-backend-stack.md - Backend technology stack
- [ ] 51-frontend-architecture.md - Frontend architecture and stack
- [ ] 52-resilience-patterns.md - Resilience patterns (Retry, Circuit Breaker)

### Workflow (60-62)

- [ ] 60-git-workflow.md - Git and GitHub workflow
- [ ] 61-monorepo-commands.md - PNPM commands and monorepo scripts
- [ ] 62-development-workflow.md - Development workflow and hot reload

## Usage

### For Developers

Steering files are automatically loaded by Kiro when you work on related code. You can also:

1. **Reference specific files:** Mention the file name in your question to Kiro
2. **Browse files:** Open any steering file to understand project conventions
3. **Update files:** Keep steering files up-to-date as the project evolves

### For Kiro AI

All steering files have `inclusion: always` in their front matter, meaning they're always available for context.

## Maintenance

### When to Update Steering Files

- When adding new architectural patterns
- When changing conventions or standards
- When adding new technologies to the stack
- When documenting new workflows

### How to Add New Files

1. Follow the numbering scheme (use next available number in category)
2. Add front matter with `inclusion: always`
3. Document search strategy used

- Add file references to actual implementations

5. Update this README index
6. Add cross-references to related files

## Migration from Old Structure

See [MIGRATION.md](./MIGRATION.md) for mapping from old steering files to new structure.

## Validation

Run the validation script to check steering files integrity:

```bash
.kiro/steering/validate.sh
```
````

---

**Last Updated:** January 8, 2026  
**Total Files:** 62  
**Status:** In Progress

````

**Validation:**
```bash
[ -f .kiro/steering/README.md ] && echo "✅ README.md created" || echo "❌ Failed"
wc -l .kiro/steering/README.md  # Should be ~100+ lines
````

### Validation Criteria

- [ ] Backup directory exists at `.kiro/steering/backup/`
- [ ] All 20 existing files are in backup directory
- [ ] Backup files have identical sizes to originals
- [ ] No files are corrupted or empty in backup
- [ ] README.md exists with proper structure
- [ ] README.md has complete index with all 62 files listed
- [ ] README.md has usage instructions
- [ ] README.md has maintenance guidelines

### Deliverables

- `.kiro/steering/backup/` directory with all 20 original files
- `.kiro/steering/README.md` with complete documentation and index structure

### Troubleshooting

**Issue:** Backup directory already exists  
**Solution:** Remove it first: `rm -rf .kiro/steering/backup && mkdir -p .kiro/steering/backup`

**Issue:** Some files not copied  
**Solution:** Check file permissions and ensure no files are open/locked

**Issue:** README.md already exists  
**Solution:** Back it up first: `mv .kiro/steering/README.md .kiro/steering/README.md.old`

---

## Task 2: Product & Architecture Files (01-04)

**Status:** ⬜ Not Started  
**Priority:** High (foundation for other tasks)  
**Estimated Time:** 5 hours  
**Dependencies:** Task 1 (Backup and Setup)

### Objectives

1. Create 01-product-requirements.md from PRD.md
2. Create 02-bounded-contexts.md from bounded-contexts.md
3. Create 03-identity-architecture.md from user-customer-businessowner-architecture.md
4. Create 04-system-architecture.md from architecture.md
5. Add cross-references between files
6. Validate all files

### Detailed Steps

---

#### 2.1: Create 01-product-requirements.md

**Source:** `.kiro/steering/PRD.md` (100% of content)

##### 2.1.1: Extract Content from PRD.md

```bash
# Read the entire PRD.md file
cat .kiro/steering/PRD.md
```

**Expected sections:**

- Product Requirements Document header
- Vision Overview
- Architecture (2.x sections)
- Bounded Contexts (2.1)
- Identity Architecture (4.x sections)
- User Flows (5.x sections)
- External Integrations (6.x)
- Data Model (7.x)
- Business Rules (8.x)
- Use Cases (9.x)
- Event Handlers (10.x)
- API Endpoints (11.x)
- Web Components (12.x)
- Non-Functional Requirements (13.x)
- Dependencies (14.x)
- Implementation Phases (15.x)
- Success Metrics (16.x)
- Risks (17.x)
- Next Steps (18.x)
- Additional Notes (19.x)

##### 2.1.2: Create File with Front Matter

```bash
cat > .kiro/steering/01-product-requirements.md << 'EOF'
---
inclusion: always
---

# Product Requirements Document (PRD)

## Sistema de Reservas Multi-Tenant vía WhatsApp

**Version:** 1.0 | **Date:** December 2024 | **Type:** MVP

> **Cross-References:**
> - [02-bounded-contexts.md](./02-bounded-contexts.md) - Detailed Bounded Context definitions
> - [03-identity-architecture.md](./03-identity-architecture.md) - User/Customer/BusinessOwner architecture
> - [04-system-architecture.md](./04-system-architecture.md) - Technical architecture details

---

EOF
```

##### 2.1.3: Copy Content from PRD.md

```bash
# Append all content from PRD.md (skip the first line if it's a title)
tail -n +2 .kiro/steering/PRD.md >> .kiro/steering/01-product-requirements.md
```

##### 2.1.4: Add Cross-Reference Markers

Add cross-reference markers at key sections:

```bash
# After section "2.1 Bounded Contexts", add:
# > **📖 Detailed Information:** See [02-bounded-contexts.md](./02-bounded-contexts.md)

# After section "4. Arquitectura de Identidades", add:
# > **📖 Complete Architecture:** See [03-identity-architecture.md](./03-identity-architecture.md)

# After section "2. Arquitectura", add:
# > **📖 Technical Details:** See [04-system-architecture.md](./04-system-architecture.md)
```

**Manual edit required:** Open file and add these markers at appropriate locations.

##### 2.1.5: Validate File

```bash
# Check file exists
[ -f .kiro/steering/01-product-requirements.md ] && echo "✅ File created" || echo "❌ Failed"

# Check file size (should be ~50KB+)
file_size=$(wc -c < .kiro/steering/01-product-requirements.md)
echo "File size: $file_size bytes (expected: >50000)"

# Check front matter
head -n 3 .kiro/steering/01-product-requirements.md | grep -q "inclusion: always" && echo "✅ Front matter OK" || echo "❌ Front matter missing"

# Check cross-references
grep -c "02-bounded-contexts.md" .kiro/steering/01-product-requirements.md
grep -c "03-identity-architecture.md" .kiro/steering/01-product-requirements.md
grep -c "04-system-architecture.md" .kiro/steering/01-product-requirements.md
# Each should appear at least once

# Count sections
grep -c "^## " .kiro/steering/01-product-requirements.md
# Should be ~19 sections
```

---

#### 2.2: Create 02-bounded-contexts.md

**Source:** `.kiro/steering/bounded-contexts.md` (90%) + PRD.md (10% - remove duplicate BC list)

##### 2.2.1: Extract Content from bounded-contexts.md

```bash
# Read the entire bounded-contexts.md file
cat .kiro/steering/bounded-contexts.md
```

**Expected sections:**

- What is a Bounded Context?
- Bounded Contexts of the System (BC1-BC8)
- Communication between Bounded Contexts
- Shared Kernel
- Structure per BC
- Ubiquitous Language per BC
- BC Aggregation phases
- Implementation Rules
- Anti-Patterns

##### 2.2.2: Create File with Front Matter

```bash
cat > .kiro/steering/02-bounded-contexts.md << 'EOF'
---
inclusion: always
---

# Bounded Contexts

**Domain-Driven Design Bounded Context Definitions**

> **Cross-References:**
> - [01-product-requirements.md](./01-product-requirements.md) - Business context and requirements
> - [03-identity-architecture.md](./03-identity-architecture.md) - Auth, Account, Customer BC details
> - [11-ddd-tactical-patterns.md](./11-ddd-tactical-patterns.md) - Aggregate implementation patterns
> - [13-architecture-boundaries.md](./13-architecture-boundaries.md) - BC boundary enforcement

---

EOF
```

##### 2.2.3: Copy Content from bounded-contexts.md

```bash
# Append all content from bounded-contexts.md (skip the first line if it's a title)
tail -n +2 .kiro/steering/bounded-contexts.md >> .kiro/steering/02-bounded-contexts.md
```

##### 2.2.4: Add Cross-Reference Markers

```bash
# After "BC1: Account" section, add:
# > **📖 Complete Identity Architecture:** See [03-identity-architecture.md](./03-identity-architecture.md)

# After "Aggregates" subsection in each BC, add:
# > **📖 Aggregate Patterns:** See [11-ddd-tactical-patterns.md](./11-ddd-tactical-patterns.md)

# After "Communication between Bounded Contexts" section, add:
# > **📖 Boundary Rules:** See [13-architecture-boundaries.md](./13-architecture-boundaries.md)
```

**Manual edit required:** Open file and add these markers.

##### 2.2.5: Validate File

```bash
# Check file exists
[ -f .kiro/steering/02-bounded-contexts.md ] && echo "✅ File created" || echo "❌ Failed"

# Check file size (should be ~30KB+)
file_size=$(wc -c < .kiro/steering/02-bounded-contexts.md)
echo "File size: $file_size bytes (expected: >30000)"

# Check front matter
head -n 3 .kiro/steering/02-bounded-contexts.md | grep -q "inclusion: always" && echo "✅ Front matter OK" || echo "❌ Front matter missing"

# Check cross-references
grep -c "01-product-requirements.md" .kiro/steering/02-bounded-contexts.md
grep -c "03-identity-architecture.md" .kiro/steering/02-bounded-contexts.md
grep -c "11-ddd-tactical-patterns.md" .kiro/steering/02-bounded-contexts.md
# Each should appear at least once

# Count BC definitions (should be 8: BC1-BC8)
grep -c "^### BC[0-9]:" .kiro/steering/02-bounded-contexts.md
# Should be 8
```

---

#### 2.3: Create 03-identity-architecture.md

**Source:** `.kiro/steering/user-customer-businessowner-architecture.md` (100%)

##### 2.3.1: Extract Content from user-customer-businessowner-architecture.md

```bash
# Read the entire file
cat .kiro/steering/user-customer-businessowner-architecture.md
```

**Expected sections:**

- Visión General
- Arquitectura Conceptual
- User (Auth BC)
- Customer (Customer BC)
- BusinessOwner (Account BC)
- Business (Business BC)
- Integración con Booking BC
- Escenarios de Usuario
- Comunicación entre BCs
- Tabla Comparativa
- Evolución
- ¿Por Qué Separar?
- Reglas de Negocio
- Beneficios
- Implementación

##### 2.3.2: Create File with Front Matter

```bash
cat > .kiro/steering/03-identity-architecture.md << 'EOF'
---
inclusion: always
---

# User, Customer y BusinessOwner - Arquitectura Unificada

**Arquitectura unificada para gestión de identidades y roles, preparada para evolución hacia marketplace de servicios.**

> **Cross-References:**
> - [01-product-requirements.md](./01-product-requirements.md) - Product context
> - [02-bounded-contexts.md](./02-bounded-contexts.md) - Auth, Account, Customer, Business BC definitions
> - [11-ddd-tactical-patterns.md](./11-ddd-tactical-patterns.md) - Aggregate and Value Object patterns
> - [04-system-architecture.md](./04-system-architecture.md) - Overall architecture

---

EOF
```

##### 2.3.3: Copy Content

```bash
# Append all content (skip the first line if it's a title)
tail -n +2 .kiro/steering/user-customer-businessowner-architecture.md >> .kiro/steering/03-identity-architecture.md
```

##### 2.3.4: Add Cross-Reference Markers

```bash
# After "1. User (Auth BC)" section, add:
# > **📖 Auth BC Details:** See [02-bounded-contexts.md](./02-bounded-contexts.md#bc1-auth)

# After "2. Customer (Customer BC)" section, add:
# > **📖 Customer BC Details:** See [02-bounded-contexts.md](./02-bounded-contexts.md#bc6-customer)

# After "3. BusinessOwner (Account BC)" section, add:
# > **📖 Account BC Details:** See [02-bounded-contexts.md](./02-bounded-contexts.md#bc1-account)

# After "4. Business (Business BC)" section, add:
# > **📖 Business BC Details:** See [02-bounded-contexts.md](./02-bounded-contexts.md#bc2-business)
```

**Manual edit required:** Open file and add these markers.

##### 2.3.5: Validate File

```bash
# Check file exists
[ -f .kiro/steering/03-identity-architecture.md ] && echo "✅ File created" || echo "❌ Failed"

# Check file size (should be ~40KB+)
file_size=$(wc -c < .kiro/steering/03-identity-architecture.md)
echo "File size: $file_size bytes (expected: >40000)"

# Check front matter
head -n 3 .kiro/steering/03-identity-architecture.md | grep -q "inclusion: always" && echo "✅ Front matter OK" || echo "❌ Front matter missing"

# Check cross-references
grep -c "02-bounded-contexts.md" .kiro/steering/03-identity-architecture.md
grep -c "11-ddd-tactical-patterns.md" .kiro/steering/03-identity-architecture.md
# Each should appear at least once

# Check for key sections
grep -q "## 1. User (Auth BC)" .kiro/steering/03-identity-architecture.md && echo "✅ User section found" || echo "❌ Missing"
grep -q "## 2. Customer (Customer BC)" .kiro/steering/03-identity-architecture.md && echo "✅ Customer section found" || echo "❌ Missing"
grep -q "## 3. BusinessOwner (Account BC)" .kiro/steering/03-identity-architecture.md && echo "✅ BusinessOwner section found" || echo "❌ Missing"
```

---

#### 2.4: Create 04-system-architecture.md

**Source:** `.kiro/steering/architecture.md` (80%) + PRD.md (10%) + cqrs.md (5%) + ddd-patterns.md (5%)

##### 2.4.1: Extract Content from architecture.md

```bash
# Read the entire architecture.md file
cat .kiro/steering/architecture.md
```

**Expected sections:**

- Principios Arquitectónicos Fundamentales
- Clean Architecture
- Domain-Driven Design (DDD)
- CQRS
- Event-Driven Architecture
- Estructura de Capas
- Patrones de Diseño Aplicados
- Manejo de Concurrencia
- Comunicación entre Bounded Contexts
- Escalabilidad y Performance
- Seguridad
- Observabilidad
- Testing Strategy
- Deployment Architecture
- Decisiones Arquitectónicas Clave

##### 2.4.2: Create File with Front Matter

```bash
cat > .kiro/steering/04-system-architecture.md << 'EOF'
---
inclusion: always
---

# Arquitectura del Sistema

**High-level system architecture and architectural principles**

> **Cross-References:**
> - [01-product-requirements.md](./01-product-requirements.md) - Product requirements
> - [02-bounded-contexts.md](./02-bounded-contexts.md) - Bounded Context definitions
> - [10-cqrs-pattern.md](./10-cqrs-pattern.md) - CQRS implementation details
> - [11-ddd-tactical-patterns.md](./11-ddd-tactical-patterns.md) - DDD tactical patterns
> - [13-architecture-boundaries.md](./13-architecture-boundaries.md) - Dependency rules
> - [52-resilience-patterns.md](./52-resilience-patterns.md) - Resilience patterns

---

EOF
```

##### 2.4.3: Copy Content from architecture.md

```bash
# Append all content (skip the first line if it's a title)
tail -n +2 .kiro/steering/architecture.md >> .kiro/steering/04-system-architecture.md
```

##### 2.4.4: Remove Duplicate Content and Add Cross-References

**Manual edits required:**

1. **CQRS Section:** Replace detailed CQRS content with:

```markdown
## 3. CQRS (Command Query Responsibility Segregation)

**Separación estricta entre escritura (Commands) y lectura (Queries)**

> **📖 Complete CQRS Implementation:** See [10-cqrs-pattern.md](./10-cqrs-pattern.md)

**Summary:**

- Commands modify state, Queries read state
- Separate models for write and read
- Synchronization via Domain Events
- Eventual consistency acceptable

[Rest of overview content...]
```

2. **DDD Section:** Replace detailed DDD content with:

```markdown
## 2. Domain-Driven Design (DDD)

**Bounded Contexts and Tactical Patterns**

> **📖 Complete DDD Patterns:** See [11-ddd-tactical-patterns.md](./11-ddd-tactical-patterns.md)
> **📖 Bounded Contexts:** See [02-bounded-contexts.md](./02-bounded-contexts.md)

**Summary:**

- Bounded Contexts as model boundaries
- Aggregates as consistency boundaries
- Value Objects for immutable concepts
- Domain Events for communication

[Rest of overview content...]
```

3. **After "Manejo de Concurrencia" section, add:**

```markdown
> **📖 Resilience Patterns:** See [52-resilience-patterns.md](./52-resilience-patterns.md)
```

4. **After "Estructura de Capas" section, add:**

```markdown
> **📖 Dependency Rules:** See [13-architecture-boundaries.md](./13-architecture-boundaries.md)
```

##### 2.4.5: Validate File

```bash
# Check file exists
[ -f .kiro/steering/04-system-architecture.md ] && echo "✅ File created" || echo "❌ Failed"

# Check file size (should be ~35KB+)
file_size=$(wc -c < .kiro/steering/04-system-architecture.md)
echo "File size: $file_size bytes (expected: >35000)"

# Check front matter
head -n 3 .kiro/steering/04-system-architecture.md | grep -q "inclusion: always" && echo "✅ Front matter OK" || echo "❌ Front matter missing"

# Check cross-references
grep -c "10-cqrs-pattern.md" .kiro/steering/04-system-architecture.md
grep -c "11-ddd-tactical-patterns.md" .kiro/steering/04-system-architecture.md
grep -c "13-architecture-boundaries.md" .kiro/steering/04-system-architecture.md
grep -c "52-resilience-patterns.md" .kiro/steering/04-system-architecture.md
# Each should appear at least once

# Check for key sections
grep -q "## 1. Clean Architecture" .kiro/steering/04-system-architecture.md && echo "✅ Clean Architecture section found" || echo "❌ Missing"
grep -q "## 2. Domain-Driven Design" .kiro/steering/04-system-architecture.md && echo "✅ DDD section found" || echo "❌ Missing"
grep -q "## 3. CQRS" .kiro/steering/04-system-architecture.md && echo "✅ CQRS section found" || echo "❌ Missing"
```

---

### Validation Criteria for Task 2

- [ ] All 4 files created (01, 02, 03, 04)
- [ ] All files have valid front matter with `inclusion: always`
- [ ] All files have cross-reference section at the top
- [ ] File 01: Contains complete PRD content (~50KB+)
- [ ] File 01: Has cross-references to 02, 03, 04
- [ ] File 02: Contains BC definitions (~30KB+)
- [ ] File 02: Has cross-references to 01, 03, 11, 13
- [ ] File 03: Contains identity architecture (~40KB+)
- [ ] File 03: Has cross-references to 01, 02, 11
- [ ] File 04: Contains system architecture (~35KB+)
- [ ] File 04: Has cross-references to 10, 11, 13, 52
- [ ] No duplicate content between files (CQRS/DDD details removed from 04)
- [ ] All cross-reference links use correct format: `[text](./filename.md)`
- [ ] All files are readable and well-formatted

### Incremental Validation for Task 2

After creating all 4 files, run validation checks:

```bash
# Validate front matter
for file in .kiro/steering/0[1-4]-*.md; do
  head -n 3 "$file" | grep -q "inclusion: always" && echo "✅ $file: Front matter OK" || echo "❌ $file: Front matter missing"
done

# Validate cross-references
echo "Checking cross-references..."
grep -c "02-bounded-contexts.md" .kiro/steering/01-product-requirements.md
grep -c "03-identity-architecture.md" .kiro/steering/01-product-requirements.md
grep -c "04-system-architecture.md" .kiro/steering/01-product-requirements.md

# Validate file sizes
for file in .kiro/steering/0[1-4]-*.md; do
  size=$(wc -c < "$file")
  echo "$file: $size bytes"
done

# Check for broken links
for file in .kiro/steering/0[1-4]-*.md; do
  echo "Checking links in $file..."
  grep -o "\[.*\](\.\/[^)]*\.md)" "$file" | while read -r link; do
    target=$(echo "$link" | sed 's/.*](\.\///' | sed 's/).*//' | sed 's/#.*//')
    [ -f ".kiro/steering/$target" ] || echo "  ⚠️  Broken link to $target"
  done
done
```

### Content Migration Verification for Task 2

Verify all content from source files is preserved:

```bash
# Verify PRD.md content is in 01-product-requirements.md
echo "Verifying PRD.md migration..."
# Check key sections exist
grep -q "## Vision Overview" .kiro/steering/01-product-requirements.md && echo "✅ Vision section found" || echo "❌ Missing"
grep -q "## Use Cases" .kiro/steering/01-product-requirements.md && echo "✅ Use Cases section found" || echo "❌ Missing"
grep -q "## Implementation Phases" .kiro/steering/01-product-requirements.md && echo "✅ Phases section found" || echo "❌ Missing"

# Verify bounded-contexts.md content is in 02-bounded-contexts.md
echo "Verifying bounded-contexts.md migration..."
grep -q "### BC1:" .kiro/steering/02-bounded-contexts.md && echo "✅ BC1 found" || echo "❌ Missing"
grep -q "### BC8:" .kiro/steering/02-bounded-contexts.md && echo "✅ BC8 found" || echo "❌ Missing"

# Verify user-customer-businessowner-architecture.md content is in 03-identity-architecture.md
echo "Verifying identity architecture migration..."
grep -q "## 1. User (Auth BC)" .kiro/steering/03-identity-architecture.md && echo "✅ User section found" || echo "❌ Missing"
grep -q "## 2. Customer (Customer BC)" .kiro/steering/03-identity-architecture.md && echo "✅ Customer section found" || echo "❌ Missing"
grep -q "## 3. BusinessOwner (Account BC)" .kiro/steering/03-identity-architecture.md && echo "✅ BusinessOwner section found" || echo "❌ Missing"

# Verify architecture.md content is in 04-system-architecture.md
echo "Verifying architecture.md migration..."
grep -q "## 1. Clean Architecture" .kiro/steering/04-system-architecture.md && echo "✅ Clean Architecture section found" || echo "❌ Missing"
grep -q "## 2. Domain-Driven Design" .kiro/steering/04-system-architecture.md && echo "✅ DDD section found" || echo "❌ Missing"
grep -q "## 3. CQRS" .kiro/steering/04-system-architecture.md && echo "✅ CQRS section found" || echo "❌ Missing"
```

### Deliverables

- `.kiro/steering/01-product-requirements.md` (complete PRD)
- `.kiro/steering/02-bounded-contexts.md` (BC definitions)
- `.kiro/steering/03-identity-architecture.md` (identity architecture)
- `.kiro/steering/04-system-architecture.md` (system architecture with cross-refs)

### Troubleshooting

**Issue:** File already exists  
**Solution:** Back it up first: `mv .kiro/steering/01-product-requirements.md .kiro/steering/01-product-requirements.md.old`

**Issue:** Cross-references not working  
**Solution:** Ensure format is exactly `[text](./filename.md)` with `./` prefix

**Issue:** Content too long for single file  
**Solution:** This is expected - these are comprehensive documents. Verify file size is reasonable (<100KB)

**Issue:** Duplicate content still present  
**Solution:** Manually review and remove duplicate sections, replace with cross-reference links

---

## Task 3: Architecture Patterns Files (10-13)

**Status:** ⬜ Not Started  
**Priority:** High (core patterns for backend)  
**Estimated Time:** 6 hours  
**Dependencies:** Task 1 (Backup and Setup)

### Objectives

1. Create 10-cqrs-pattern.md from cqrs.md
2. Create 11-ddd-tactical-patterns.md from ddd-patterns.md
3. Create 12-factory-pattern.md from factory-pattern.md
4. Create 13-architecture-boundaries.md from architecture-boundaries.md
5. Add cross-references between files
6. Validate all files

### Detailed Steps

---

#### 3.1: Create 10-cqrs-pattern.md

**Source:** `.kiro/steering/cqrs.md` (95%) + architecture.md (5% - remove CQRS overview)

##### 3.1.1: Extract Content from cqrs.md

```bash
# Read the entire cqrs.md file
cat .kiro/steering/cqrs.md
```

**Expected sections:**

- Principio Fundamental
- Commands (Escritura)
- Queries (Lectura)
- Write Model vs Read Model
- Repositories
- Sincronización Write → Read
- Ventajas de CQRS
- Reglas de Implementación
- Testing
- Registro en Módulo
- CQRS Estricto (Domain Services y Factories)
- Anti-Patterns

##### 3.1.2: Create File with Front Matter

```bash
cat > .kiro/steering/10-cqrs-pattern.md << 'EOF'
---
inclusion: always
---

# CQRS (Command Query Responsibility Segregation)

**CQRS pattern implementation with NestJS**

> **Cross-References:**
> - [04-system-architecture.md](./04-system-architecture.md) - Architectural context
> - [11-ddd-tactical-patterns.md](./11-ddd-tactical-patterns.md) - Aggregates and repositories
> - [12-factory-pattern.md](./12-factory-pattern.md) - Factory pattern for aggregate loading
> - [20-nestjs-implementation.md](./20-nestjs-implementation.md) - NestJS-specific patterns

---

EOF
```

##### 3.1.3: Copy Content from cqrs.md

```bash
# Append all content from cqrs.md (skip the first 4 lines: front matter + title)
tail -n +5 .kiro/steering/cqrs.md >> .kiro/steering/10-cqrs-pattern.md
```

##### 3.1.4: Add Cross-Reference Markers

```bash
# After "## Principio Fundamental" section, add:
# > **📖 Architectural Context:** See [04-system-architecture.md](./04-system-architecture.md)

# After "## Write Model vs Read Model" section, add:
# > **📖 Aggregate Patterns:** See [11-ddd-tactical-patterns.md](./11-ddd-tactical-patterns.md)

# After "### Solución 2: Factories para Cargar Aggregates" section, add:
# > **📖 Factory Pattern Details:** See [12-factory-pattern.md](./12-factory-pattern.md)

# After "## Registro en Módulo" section, add:
# > **📖 NestJS Module Patterns:** See [20-nestjs-implementation.md](./20-nestjs-implementation.md)
```

**Manual edit required:** Open file and add these markers at appropriate locations.

##### 3.1.5: Validate File

```bash
# Check file exists
[ -f .kiro/steering/10-cqrs-pattern.md ] && echo "✅ File created" || echo "❌ Failed"

# Check file size (should be ~45KB+)
file_size=$(wc -c < .kiro/steering/10-cqrs-pattern.md)
echo "File size: $file_size bytes (expected: >45000)"

# Check front matter
head -n 3 .kiro/steering/10-cqrs-pattern.md | grep -q "inclusion: always" && echo "✅ Front matter OK" || echo "❌ Front matter missing"

# Check cross-references
grep -c "04-system-architecture.md" .kiro/steering/10-cqrs-pattern.md
grep -c "11-ddd-tactical-patterns.md" .kiro/steering/10-cqrs-pattern.md
grep -c "12-factory-pattern.md" .kiro/steering/10-cqrs-pattern.md
grep -c "20-nestjs-implementation.md" .kiro/steering/10-cqrs-pattern.md
# Each should appear at least once

# Check for key sections
grep -q "## Commands (Escritura)" .kiro/steering/10-cqrs-pattern.md && echo "✅ Commands section found" || echo "❌ Missing"
grep -q "## Queries (Lectura)" .kiro/steering/10-cqrs-pattern.md && echo "✅ Queries section found" || echo "❌ Missing"
grep -q "## CQRS Estricto" .kiro/steering/10-cqrs-pattern.md && echo "✅ CQRS Estricto section found" || echo "❌ Missing"
```

---

#### 3.2: Create 11-ddd-tactical-patterns.md

**Source:** `.kiro/steering/ddd-patterns.md` (90%) + architecture.md (5%) + factory-pattern.md (5% - remove factory basics)

##### 3.2.1: Extract Content from ddd-patterns.md

```bash
# Read the entire ddd-patterns.md file
cat .kiro/steering/ddd-patterns.md
```

**Expected sections:**

- Aggregates
- Value Objects
- Domain Events
- Entities
- Domain Services (Uniqueness Checkers, Limit Checkers, Existence Checkers, Availability Checkers)
- Repositories
- Factories (Aggregate Loaders)
- Specifications
- Ubiquitous Language
- Anti-Patterns

##### 3.2.2: Create File with Front Matter

```bash
cat > .kiro/steering/11-ddd-tactical-patterns.md << 'EOF'
---
inclusion: always
---

# Domain-Driven Design (DDD) Tactical Patterns

**DDD tactical patterns applied in the project**

> **Cross-References:**
> - [04-system-architecture.md](./04-system-architecture.md) - Architectural context
> - [02-bounded-contexts.md](./02-bounded-contexts.md) - Bounded Context definitions
> - [10-cqrs-pattern.md](./10-cqrs-pattern.md) - CQRS integration
> - [12-factory-pattern.md](./12-factory-pattern.md) - Factory pattern details

---

EOF
```

##### 3.2.3: Copy Content from ddd-patterns.md

```bash
# Append all content from ddd-patterns.md (skip the first 4 lines: front matter + title)
tail -n +5 .kiro/steering/ddd-patterns.md >> .kiro/steering/11-ddd-tactical-patterns.md
```

##### 3.2.4: Remove Duplicate Content and Add Cross-References

**Manual edits required:**

1. **Factories Section:** Replace detailed factory content with summary and cross-reference:

```markdown
## Factories (Aggregate Loaders)

**Propósito:** Cargar aggregates desde persistencia para modificación (mantener CQRS estricto).

> **📖 Complete Factory Pattern:** See [12-factory-pattern.md](./12-factory-pattern.md)

**Summary:**

- Factory loads aggregates with business logic
- Used in Command Handlers for modification
- Preserves version for optimistic locking
- Separate from Read Repository (returns DTOs) and Write Repository (persists)

[Keep only the comparison table and basic example, remove detailed implementation]
```

2. **After "## Aggregates" section, add:**

```markdown
> **📖 Bounded Context Aggregates:** See [02-bounded-contexts.md](./02-bounded-contexts.md) for aggregate lists per BC
```

3. **After "## Domain Services" section, add:**

```markdown
> **📖 CQRS Strict with Domain Services:** See [10-cqrs-pattern.md](./10-cqrs-pattern.md#cqrs-estricto)
```

##### 3.2.5: Validate File

```bash
# Check file exists
[ -f .kiro/steering/11-ddd-tactical-patterns.md ] && echo "✅ File created" || echo "❌ Failed"

# Check file size (should be ~40KB+)
file_size=$(wc -c < .kiro/steering/11-ddd-tactical-patterns.md)
echo "File size: $file_size bytes (expected: >40000)"

# Check front matter
head -n 3 .kiro/steering/11-ddd-tactical-patterns.md | grep -q "inclusion: always" && echo "✅ Front matter OK" || echo "❌ Front matter missing"

# Check cross-references
grep -c "04-system-architecture.md" .kiro/steering/11-ddd-tactical-patterns.md
grep -c "02-bounded-contexts.md" .kiro/steering/11-ddd-tactical-patterns.md
grep -c "10-cqrs-pattern.md" .kiro/steering/11-ddd-tactical-patterns.md
grep -c "12-factory-pattern.md" .kiro/steering/11-ddd-tactical-patterns.md
# Each should appear at least once

# Check for key sections
grep -q "## Aggregates" .kiro/steering/11-ddd-tactical-patterns.md && echo "✅ Aggregates section found" || echo "❌ Missing"
grep -q "## Value Objects" .kiro/steering/11-ddd-tactical-patterns.md && echo "✅ Value Objects section found" || echo "❌ Missing"
grep -q "## Domain Services" .kiro/steering/11-ddd-tactical-patterns.md && echo "✅ Domain Services section found" || echo "❌ Missing"
```

---

#### 3.3: Create 12-factory-pattern.md

**Source:** `.kiro/steering/factory-pattern.md` (100%)

##### 3.3.1: Extract Content from factory-pattern.md

```bash
# Read the entire factory-pattern.md file
cat .kiro/steering/factory-pattern.md
```

**Expected sections:**

- Propósito
- Problema que Resuelve
- Diferencias Clave (Factory vs Read Repository vs Write Repository)
- Ejemplo Completo
- Flujo Completo
- Cuándo Usar Cada Uno
- Reglas y Mejores Prácticas
- Aggregate.fromPersistence()
- Testing
- Beneficios
- Ejemplo Adicional: ConversationFactory
- Referencias

##### 3.3.2: Create File with Front Matter

```bash
cat > .kiro/steering/12-factory-pattern.md << 'EOF'
---
inclusion: always
---

# Factory Pattern para CQRS Estricto

**Factory pattern for loading aggregates while maintaining CQRS strict separation**

> **Cross-References:**
> - [10-cqrs-pattern.md](./10-cqrs-pattern.md) - CQRS context and strict separation
> - [11-ddd-tactical-patterns.md](./11-ddd-tactical-patterns.md) - Aggregate patterns
> - [04-system-architecture.md](./04-system-architecture.md) - Architectural context

---

EOF
```

##### 3.3.3: Copy Content from factory-pattern.md

```bash
# Append all content from factory-pattern.md (skip the first line if it's a title)
tail -n +2 .kiro/steering/factory-pattern.md >> .kiro/steering/12-factory-pattern.md
```

##### 3.3.4: Add Cross-Reference Markers

```bash
# After "## Propósito" section, add:
# > **📖 CQRS Context:** See [10-cqrs-pattern.md](./10-cqrs-pattern.md) for CQRS strict separation

# After "## Diferencias Clave" section, add:
# > **📖 Aggregate Patterns:** See [11-ddd-tactical-patterns.md](./11-ddd-tactical-patterns.md) for aggregate implementation

# After "## Aggregate.fromPersistence()" section, add:
# > **📖 Aggregate Base Class:** See [11-ddd-tactical-patterns.md](./11-ddd-tactical-patterns.md#aggregates)
```

**Manual edit required:** Open file and add these markers.

##### 3.3.5: Validate File

```bash
# Check file exists
[ -f .kiro/steering/12-factory-pattern.md ] && echo "✅ File created" || echo "❌ Failed"

# Check file size (should be ~35KB+)
file_size=$(wc -c < .kiro/steering/12-factory-pattern.md)
echo "File size: $file_size bytes (expected: >35000)"

# Check front matter
head -n 3 .kiro/steering/12-factory-pattern.md | grep -q "inclusion: always" && echo "✅ Front matter OK" || echo "❌ Front matter missing"

# Check cross-references
grep -c "10-cqrs-pattern.md" .kiro/steering/12-factory-pattern.md
grep -c "11-ddd-tactical-patterns.md" .kiro/steering/12-factory-pattern.md
# Each should appear at least once

# Check for key sections
grep -q "## Propósito" .kiro/steering/12-factory-pattern.md && echo "✅ Propósito section found" || echo "❌ Missing"
grep -q "## Diferencias Clave" .kiro/steering/12-factory-pattern.md && echo "✅ Diferencias section found" || echo "❌ Missing"
grep -q "## Ejemplo Completo" .kiro/steering/12-factory-pattern.md && echo "✅ Ejemplo section found" || echo "❌ Missing"
```

---

#### 3.4: Create 13-architecture-boundaries.md

**Source:** `.kiro/steering/architecture-boundaries.md` (100%)

##### 3.4.1: Extract Content from architecture-boundaries.md

```bash
# Read the entire architecture-boundaries.md file
cat .kiro/steering/architecture-boundaries.md
```

**Expected sections:**

- Reglas de Dependencia por Capa (1-8)
- Validación Automática
- Ejemplos de Violaciones
- Ejemplos Correctos
- Instalación
- Configuración en package.json
- Excepciones
- Beneficios
- Troubleshooting

##### 3.4.2: Create File with Front Matter

```bash
cat > .kiro/steering/13-architecture-boundaries.md << 'EOF'
---
inclusion: always
---

# Reglas de Arquitectura - Boundaries

**Dependency rules and architectural boundaries enforcement**

> **Cross-References:**
> - [04-system-architecture.md](./04-system-architecture.md) - Layer definitions
> - [02-bounded-contexts.md](./02-bounded-contexts.md) - BC boundaries
> - [32-eslint-configuration.md](./32-eslint-configuration.md) - ESLint setup for path aliases

---

EOF
```

##### 3.4.3: Copy Content from architecture-boundaries.md

```bash
# Append all content from architecture-boundaries.md (skip the first 4 lines: front matter + title)
tail -n +5 .kiro/steering/architecture-boundaries.md >> .kiro/steering/13-architecture-boundaries.md
```

##### 3.4.4: Add Cross-Reference Markers

```bash
# After "## Reglas de Dependencia por Capa" section, add:
# > **📖 Layer Definitions:** See [04-system-architecture.md](./04-system-architecture.md#estructura-de-capas)

# After "### 8. NestJS Modules" section, add:
# > **📖 BC Boundaries:** See [02-bounded-contexts.md](./02-bounded-contexts.md) for Bounded Context definitions

# After "## Validación Automática" section, add:
# > **📖 ESLint Configuration:** See [32-eslint-configuration.md](./32-eslint-configuration.md) for ESLint path alias enforcement
```

**Manual edit required:** Open file and add these markers.

##### 3.4.5: Validate File

```bash
# Check file exists
[ -f .kiro/steering/13-architecture-boundaries.md ] && echo "✅ File created" || echo "❌ Failed"

# Check file size (should be ~25KB+)
file_size=$(wc -c < .kiro/steering/13-architecture-boundaries.md)
echo "File size: $file_size bytes (expected: >25000)"

# Check front matter
head -n 3 .kiro/steering/13-architecture-boundaries.md | grep -q "inclusion: always" && echo "✅ Front matter OK" || echo "❌ Front matter missing"

# Check cross-references
grep -c "04-system-architecture.md" .kiro/steering/13-architecture-boundaries.md
grep -c "02-bounded-contexts.md" .kiro/steering/13-architecture-boundaries.md
grep -c "32-eslint-configuration.md" .kiro/steering/13-architecture-boundaries.md
# Each should appear at least once

# Check for key sections
grep -q "## Reglas de Dependencia por Capa" .kiro/steering/13-architecture-boundaries.md && echo "✅ Reglas section found" || echo "❌ Missing"
grep -q "## Ejemplos de Violaciones" .kiro/steering/13-architecture-boundaries.md && echo "✅ Violaciones section found" || echo "❌ Missing"
grep -q "## Ejemplos Correctos" .kiro/steering/13-architecture-boundaries.md && echo "✅ Correctos section found" || echo "❌ Missing"
```

---

### Validation Criteria for Task 3

- [ ] All 4 files created (10, 11, 12, 13)
- [ ] All files have valid front matter with `inclusion: always`
- [ ] All files have cross-reference section at the top
- [ ] File 10: Contains complete CQRS content (~45KB+)
- [ ] File 10: Has cross-references to 04, 11, 12, 20
- [ ] File 11: Contains DDD patterns (~40KB+)
- [ ] File 11: Has cross-references to 04, 02, 10, 12
- [ ] File 11: Factory section replaced with summary + link to 12
- [ ] File 12: Contains factory pattern (~35KB+)
- [ ] File 12: Has cross-references to 10, 11
- [ ] File 13: Contains boundary rules (~25KB+)
- [ ] File 13: Has cross-references to 04, 02, 32
- [ ] No duplicate content between files
- [ ] All cross-reference links use correct format: `[text](./filename.md)`
- [ ] All files are readable and well-formatted

### Deliverables

- `.kiro/steering/10-cqrs-pattern.md` (CQRS implementation)
- `.kiro/steering/11-ddd-tactical-patterns.md` (DDD patterns)
- `.kiro/steering/12-factory-pattern.md` (Factory pattern)
- `.kiro/steering/13-architecture-boundaries.md` (Boundary rules)

### Troubleshooting

**Issue:** File already exists  
**Solution:** Back it up first: `mv .kiro/steering/10-cqrs-pattern.md .kiro/steering/10-cqrs-pattern.md.old`

**Issue:** Cross-references not working  
**Solution:** Ensure format is exactly `[text](./filename.md)` with `./` prefix

**Issue:** Content too long for single file  
**Solution:** This is expected - these are comprehensive documents. Verify file size is reasonable (<50KB)

**Issue:** Duplicate factory content in file 11  
**Solution:** Manually review and replace detailed factory section with summary + cross-reference to file 12

---

## Summary and Timeline

### Task Dependencies

```
Task 1 (Backup)
    ↓
Task 2 (Product & Architecture) ← Task 3 (Patterns)
    ↓                                  ↓
Task 4 (NestJS & Clean Code) ← Task 5 (Code Org)
    ↓                                  ↓
Task 6 (Testing) ← Task 7 (Tech Stack) ← Task 8 (Workflow)
    ↓
Task 9 (Validation)
    ↓
Task 10 (Cleanup)
```

### Estimated Timeline

| Task                           | Duration | Cumulative |
| ------------------------------ | -------- | ---------- |
| Task 1: Backup                 | 0.5h     | 0.5h       |
| Task 2: Product & Architecture | 5h       | 5.5h       |
| Task 3: Architecture Patterns  | 6h       | 11.5h      |
| Task 4: NestJS & Clean Code    | 5h       | 16.5h      |
| Task 5: Code Organization      | 4h       | 20.5h      |
| Task 6: Testing                | 5h       | 25.5h      |
| Task 7: Tech Stack             | 4h       | 29.5h      |
| Task 8: Development Workflow   | 3h       | 32.5h      |
| Task 9: Validation             | 4h       | 36.5h      |
| Task 10: Cleanup               | 3h       | 39.5h      |

**Total Estimated Time:** 39.5 hours (~1 week full-time or 2 weeks part-time)

### Critical Path

1. Task 1 (Backup) - **MUST** be done first
2. Task 2 (Product & Architecture) - Foundation for other tasks
3. Task 9 (Validation) - **MUST** be done before cleanup
4. Task 10 (Cleanup) - Final step

### Parallel Work Opportunities

After Task 2 is complete, the following can be done in parallel:

- Task 3 (Architecture Patterns)
- Task 5 (Code Organization)
- Task 7 (Tech Stack)
- Task 8 (Development Workflow)

After Task 4 is complete:

- Task 6 (Testing)

### Success Metrics

- [ ] All 62 files created
- [ ] All files have valid front matter
- [ ] All cross-references are valid
- [ ] All file references point to existing files
- [ ] No duplicate content
- [ ] README.md index is complete
- [ ] Validation script passes
- [ ] Migration guide is clear
- [ ] Original files are archived

---

## Next Steps

1. **Review this task breakdown** - Ensure all tasks are clear and complete
2. **Start with Task 1** - Create backup and setup
3. **Work through tasks sequentially** - Follow dependencies
4. **Validate frequently** - Run validation checks after each task
5. **Update README.md** - Keep index updated as files are created
6. **Document issues** - Track any problems or deviations

---

**Document Version:** 1.0  
**Last Updated:** January 8, 2026  
**Status:** Ready for Implementation
