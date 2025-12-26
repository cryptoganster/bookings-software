# TODO Resolution Spec

**Status:** Draft  
**Created:** December 23, 2024  
**Priority:** High

## Overview

This spec documents all TODO, FIXME, DEPRECATED, and similar markers found in `apps/backend` and provides a structured plan to resolve them.

## Categories

The markers are organized into the following categories:

1. **Deprecated Code** - Code marked for removal or replacement
2. **Missing Implementations** - Features not yet implemented
3. **Temporary Mocks** - Mock implementations that need real persistence
4. **Cross-BC Dependencies** - TODOs related to communication between Bounded Contexts
5. **Test Improvements** - Test cases that need fixing or completion
6. **Documentation Notes** - Comments explaining current behavior
7. **Business Logic Placeholders** - Placeholder commands/queries

## Priority Levels

- **P0 (Critical):** Blocks core functionality or violates architecture
- **P1 (High):** Important for production readiness
- **P2 (Medium):** Nice to have, improves quality
- **P3 (Low):** Documentation or minor improvements

## Resolution Tasks

See individual task files:

- [deprecated-code.md](./deprecated-code.md) - P1, 2h
- [conversation-persistence.md](./conversation-persistence.md) - P0, 2-3d
- [cross-bc-integration.md](./cross-bc-integration.md) - P1, 3-4d
- [test-fixes.md](./test-fixes.md) - P2, 1-2d
- [console-logging.md](./console-logging.md) - P2, 2-3h

## Summary Statistics

- **Total Markers Found:** ~60+
- **Critical (P0):** 1 task (Conversation persistence)
- **High (P1):** 2 tasks (Deprecated code, Cross-BC integration)
- **Medium (P2):** 2 tasks (Test fixes, Console logging)
- **Low (P3):** 0 tasks

### Breakdown by Type

- **Deprecated Code:** 2 files (barrel exports)
- **Temporary Mocks:** 1 BC (Conversation - violates CQRS)
- **Placeholder Commands:** 3 commands (Notification, WhatsApp)
- **Hardcoded Data:** 2 handlers (dates/times in conversation)
- **Incomplete Tests:** 1 test (conversation flow)
- **Console Statements:** 4 production files + test utilities
- **Cross-BC TODOs:** 5+ integration points

## Next Steps

1. Review and prioritize each task file
2. Create implementation specs for P0 and P1 items
3. Schedule work in sprints
4. Track progress in tasks.md files
