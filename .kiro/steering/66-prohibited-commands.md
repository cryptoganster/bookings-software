---
inclusion: always
---

# Prohibited Commands - AI Agent Safety Rules

**Critical safety rules to prevent data loss and destructive operations**

> **Cross-References:**
>
> - [60-git-workflow.md](./60-git-workflow.md) - Git workflow and safety
> - [.husky/SAFETY-HOOKS.md](../../.husky/SAFETY-HOOKS.md) - Git safety hooks

---

## Philosophy

**SAFETY FIRST:** AI agents must NEVER execute commands that could permanently delete uncommitted work or untracked files without explicit user confirmation.

## 🚫 Absolutely Prohibited Commands

These commands are **NEVER** allowed without explicit user confirmation:

### 1. File Deletion Commands

```bash
# ❌ PROHIBITED - Deletes files permanently
rm -rf <any-project-file>
rm -f <any-project-file>

# ❌ PROHIBITED - Deletes untracked files permanently  
git clean -fd
git clean -df

# ❌ PROHIBITED - Discards tracked file changes
git restore <file>
git checkout -- <file>
```

**Why prohibited:**
- Permanently deletes files that Git cannot recover
- Untracked files are lost forever (not in Git history)
- Uncommitted work is lost without possibility of recovery
- Human error in AI commands can cause hours of lost work

**Required behavior:**
1. **STOP** - Do not execute the command
2. **ASK** - Use `userInput` tool to ask user for confirmation
3. **EXPLAIN** - Show what will be deleted and why it's dangerous
4. **ALTERNATIVES** - Suggest safe alternatives (stash, commit, etc.)
5. **WAIT** - Only proceed if user explicitly confirms with "yes" or "y"

---

### 2. Git Restore Commands

```bash
# ❌ PROHIBITED - Discards changes in tracked files
git restore <file>
git restore .

# ❌ PROHIBITED - Discards changes (old syntax)
git checkout -- <file>
```

**Why prohibited:**
- Permanently discards uncommitted changes in tracked files
- Cannot be recovered unless previously stashed or committed
- May contain hours of work

**Required behavior:**
1. **STOP** - Do not execute
2. **ASK** - Confirm with user using `userInput` tool
3. **SUGGEST** - Recommend `git stash` instead
4. **WAIT** - Only proceed with explicit confirmation

---

## ✅ Safe Alternatives

### Instead of `rm -rf` or `rm -f`:

```bash
# ✅ SAFE - Preview what would be deleted
git status
git clean -n

# ✅ SAFE - Save untracked files temporarily
git stash --include-untracked

# ✅ SAFE - Commit changes first
git add .
git commit -m "wip: save work before cleanup"
```

### Instead of `git restore`:

```bash
# ✅ SAFE - Save changes temporarily
git stash
git stash save "description of changes"

# ✅ SAFE - Commit changes
git add .
git commit -m "wip: save work"

# ✅ SAFE - Create a backup branch
git checkout -b backup/my-work
git add .
git commit -m "backup before restore"
git checkout original-branch
```

### Instead of `git clean -fd`:

```bash
# ✅ SAFE - Preview first
git clean -n

# ✅ SAFE - Save untracked files
git stash --include-untracked

# ✅ SAFE - Review what's untracked
git status
```

---

## 🤖 AI Agent Rules

### Rule 1: Never Execute Destructive Commands Without Confirmation

**BEFORE executing any of these commands:**
- `rm -rf`
- `rm -f` 
- `git restore`
- `git checkout --`
- `git clean -fd`
- `git reset --hard` (on uncommitted changes)

**YOU MUST:**

1. **Stop execution immediately**
2. **Use the `userInput` tool** to ask for confirmation
3. **Explain clearly** what will be deleted/lost
4. **Show alternatives** that are safer
5. **Wait for explicit "yes" or "y"** response
6. **Only then proceed** if confirmed

### Rule 2: Always Suggest Safe Alternatives First

Before asking for confirmation, **always suggest**:
- `git stash` to save changes temporarily
- `git commit` to save changes permanently  
- `git clean -n` to preview deletions
- Creating a backup branch

### Rule 3: Explain the Risk

When asking for confirmation, **always explain**:
- What files will be affected
- Whether they can be recovered (usually NO)
- How much work might be lost
- Why this is dangerous

### Rule 4: Document What You Did

After executing a destructive command (with user confirmation):
- Document what was deleted
- Explain why it was necessary
- Suggest how to avoid needing it in the future

---

## 📋 Confirmation Template

When you need to execute a destructive command, use this template with `userInput`:

```typescript
userInput({
  question: `⚠️ **DESTRUCTIVE OPERATION WARNING**

I need to execute: \`${command}\`

**This will permanently delete:**
- ${list_of_files_or_changes}

**These files CANNOT be recovered** because:
- ${reason_why_not_recoverable}

**Safe alternatives:**
1. ${alternative_1}
2. ${alternative_2}
3. ${alternative_3}

**Do you want to proceed with this destructive operation?**`,
  options: ["Yes, proceed (I understand the risk)", "No, use safe alternative instead"]
})
```

---

## 🔍 Examples

### Example 1: User asks to discard changes

**❌ WRONG:**
```bash
# Agent executes immediately
git restore infra/github/README.md
```

**✅ CORRECT:**
```typescript
// Agent stops and asks first
await userInput({
  question: `⚠️ **WARNING: This will permanently discard uncommitted changes**

Command: git restore infra/github/README.md

**Changes that will be lost:**
- All modifications to infra/github/README.md since last commit
- These changes CANNOT be recovered

**Safe alternatives:**
1. git stash - Save changes temporarily
2. git commit - Save changes permanently
3. git diff infra/github/README.md - Review changes first

**Proceed with discarding changes?**`,
  options: ["Yes, discard changes", "No, use stash instead"]
})
```

### Example 2: User asks to delete untracked files

**❌ WRONG:**
```bash
# Agent executes immediately
rm -f infra/github/ENFORCE-REBASE-ONLY.md scripts/update-all-prs.sh
```

**✅ CORRECT:**
```typescript
// Agent stops and asks first
await userInput({
  question: `⚠️ **WARNING: This will permanently delete untracked files**

Files to delete:
- infra/github/ENFORCE-REBASE-ONLY.md
- scripts/update-all-prs.sh

**These files are NOT in Git and CANNOT be recovered!**

**Safe alternatives:**
1. git add <files> && git commit - Save to Git first
2. git stash --include-untracked - Save temporarily
3. Review files first to ensure they're not needed

**Proceed with permanent deletion?**`,
  options: ["Yes, delete permanently", "No, save to Git first"]
})
```

### Example 3: Cleaning up after work

**❌ WRONG:**
```bash
# Agent executes multiple destructive commands
git restore .
rm -rf temp-files/
git clean -fd
```

**✅ CORRECT:**
```typescript
// Agent suggests safe workflow
await userInput({
  question: `⚠️ **WARNING: Multiple destructive operations requested**

You want to clean up the workspace. This would:
1. Discard all uncommitted changes (git restore .)
2. Delete temp-files/ directory (rm -rf)
3. Delete all untracked files (git clean -fd)

**ALL of this work will be PERMANENTLY LOST!**

**Recommended safe workflow:**
1. Review changes: git status
2. Save important work: git stash --include-untracked
3. Or commit work: git add . && git commit -m "wip: save before cleanup"
4. Then clean safely

**Proceed with destructive cleanup?**`,
  options: ["Yes, I've backed up my work", "No, help me save it first"]
})
```

---

## 🎯 Key Principles

1. **Assume files are valuable** - Treat all files as containing important work
2. **Untracked files are most vulnerable** - They have no Git history to recover from
3. **Ask before destroying** - Always get explicit user confirmation
4. **Suggest alternatives** - Help user find safer approaches
5. **Explain risks clearly** - User must understand what they're losing
6. **Document actions** - Record what was deleted and why

---

## 🚨 Emergency Recovery

If a destructive command was executed by mistake:

### For tracked files (git restore):
```bash
# Check reflog for previous state
git reflog

# Restore from reflog
git reset --hard HEAD@{1}
```

### For untracked files (rm -rf, git clean -fd):
```bash
# ❌ CANNOT BE RECOVERED
# Untracked files are permanently lost
# This is why we MUST ask for confirmation first!
```

---

## ✅ Checklist for AI Agents

Before executing ANY command, check:

- [ ] Is this command in the prohibited list?
- [ ] Will this delete or discard any files or changes?
- [ ] Are there untracked files involved?
- [ ] Have I asked the user for explicit confirmation?
- [ ] Have I explained what will be lost?
- [ ] Have I suggested safe alternatives?
- [ ] Did the user respond with explicit "yes" or "y"?

**If ANY answer is uncertain, STOP and ASK the user first!**

---

**Last Updated:** January 12, 2026  
**Status:** Active ✅  
**Priority:** CRITICAL - Must be followed at all times
