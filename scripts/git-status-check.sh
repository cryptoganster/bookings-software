#!/usr/bin/env bash

# Git Status Check - Verifica el estado del repositorio y la estrategia de rebase
# Uso: bash scripts/git-status-check.sh

set -e

echo "🔍 Git Repository Status Check"
echo "================================"
echo ""

# Get current branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
echo "📍 Current branch: $current_branch"
echo ""

# Check 1: Uncommitted changes
echo "1️⃣  Checking for uncommitted changes..."
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
  echo "   ⚠️  WARNING: You have uncommitted changes"
  echo ""
  echo "   Modified files:"
  git status --short
  echo ""
  echo "   ✅ Action: Commit or stash your changes"
  echo "      git add ."
  echo "      git commit -m 'feat: your changes'"
  echo "      # OR"
  echo "      git stash"
  echo ""
else
  echo "   ✅ No uncommitted changes"
  echo ""
fi

# Check 2: Master synchronization
echo "2️⃣  Checking master synchronization..."
git fetch origin master --quiet 2>/dev/null || {
  echo "   ⚠️  Could not fetch from origin"
  echo ""
}

local_master=$(git rev-parse master 2>/dev/null || echo "")
remote_master=$(git rev-parse origin/master 2>/dev/null || echo "")

if [ -n "$local_master" ] && [ -n "$remote_master" ]; then
  if [ "$local_master" != "$remote_master" ]; then
    echo "   ❌ ISSUE: Local master is out of sync with origin/master"
    echo ""
    echo "   Local:  $(git rev-parse --short $local_master)"
    echo "   Remote: $(git rev-parse --short $remote_master)"
    echo ""
    
    if git merge-base --is-ancestor "$remote_master" "$local_master" 2>/dev/null; then
      ahead=$(git rev-list --count origin/master..master)
      echo "   Status: Local is $ahead commit(s) AHEAD"
      echo "   ⚠️  Master should never have local-only commits!"
    elif git merge-base --is-ancestor "$local_master" "$remote_master" 2>/dev/null; then
      behind=$(git rev-list --count master..origin/master)
      echo "   Status: Local is $behind commit(s) BEHIND"
    else
      echo "   Status: DIVERGED"
    fi
    echo ""
    echo "   ✅ Action: Synchronize master"
    echo "      git checkout master"
    echo "      git fetch origin"
    echo "      git reset --hard origin/master"
    echo ""
  else
    echo "   ✅ Master is synchronized"
    echo ""
  fi
fi

# Check 3: Feature branch rebase status (if not on master)
if [ "$current_branch" != "master" ]; then
  echo "3️⃣  Checking if current branch is rebased on origin/master..."
  
  merge_base=$(git merge-base HEAD origin/master 2>/dev/null || echo "")
  origin_master_sha=$(git rev-parse origin/master 2>/dev/null || echo "")
  
  if [ -n "$merge_base" ] && [ -n "$origin_master_sha" ]; then
    if [ "$merge_base" != "$origin_master_sha" ]; then
      behind=$(git rev-list --count $merge_base..origin/master)
      echo "   ❌ ISSUE: Branch is NOT rebased on latest origin/master"
      echo ""
      echo "   Branch base: $(git rev-parse --short $merge_base)"
      echo "   Latest master: $(git rev-parse --short $origin_master_sha)"
      echo "   Commits behind: $behind"
      echo ""
      echo "   ✅ Action: Rebase on origin/master"
      echo "      git fetch origin"
      echo "      git rebase origin/master"
      echo ""
      echo "   If conflicts occur:"
      echo "      # Resolve conflicts in files"
      echo "      git add <resolved-files>"
      echo "      git rebase --continue"
      echo ""
    else
      echo "   ✅ Branch is rebased on latest origin/master"
      echo ""
    fi
  fi
fi

# Check 4: Remote tracking
echo "4️⃣  Checking remote tracking..."
upstream=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "")

if [ -z "$upstream" ]; then
  if [ "$current_branch" != "master" ]; then
    echo "   ⚠️  WARNING: Branch is not tracking a remote branch"
    echo ""
    echo "   ✅ Action: Push and set upstream"
    echo "      git push -u origin $current_branch"
    echo ""
  else
    echo "   ✅ Master tracks origin/master"
    echo ""
  fi
else
  echo "   ✅ Branch tracks: $upstream"
  
  # Check if local is ahead/behind remote
  local_sha=$(git rev-parse HEAD)
  remote_sha=$(git rev-parse @{u} 2>/dev/null || echo "")
  
  if [ -n "$remote_sha" ] && [ "$local_sha" != "$remote_sha" ]; then
    if git merge-base --is-ancestor "$remote_sha" "$local_sha" 2>/dev/null; then
      ahead=$(git rev-list --count @{u}..HEAD)
      echo "   📤 Local is $ahead commit(s) ahead of remote"
      echo ""
      echo "   ✅ Action: Push your changes"
      echo "      git push origin $current_branch"
      echo ""
    elif git merge-base --is-ancestor "$local_sha" "$remote_sha" 2>/dev/null; then
      behind=$(git rev-list --count HEAD..@{u})
      echo "   📥 Local is $behind commit(s) behind remote"
      echo ""
      echo "   ⚠️  Someone else pushed to your branch!"
      echo ""
      echo "   ✅ Action: Fetch and rebase"
      echo "      git fetch origin"
      echo "      git rebase origin/$current_branch"
      echo ""
    else
      echo "   ⚠️  Local and remote have DIVERGED"
      echo ""
      echo "   This usually happens after a rebase."
      echo ""
      echo "   ✅ Action: Force push with lease"
      echo "      git push --force-with-lease origin $current_branch"
      echo ""
    fi
  else
    echo "   ✅ Local and remote are in sync"
    echo ""
  fi
fi

# Summary
echo "================================"
echo "📊 Summary"
echo "================================"
echo ""

# Count issues
issues=0

if ! git diff-index --quiet HEAD -- 2>/dev/null; then
  issues=$((issues + 1))
fi

if [ -n "$local_master" ] && [ -n "$remote_master" ] && [ "$local_master" != "$remote_master" ]; then
  issues=$((issues + 1))
fi

if [ "$current_branch" != "master" ]; then
  merge_base=$(git merge-base HEAD origin/master 2>/dev/null || echo "")
  origin_master_sha=$(git rev-parse origin/master 2>/dev/null || echo "")
  if [ -n "$merge_base" ] && [ -n "$origin_master_sha" ] && [ "$merge_base" != "$origin_master_sha" ]; then
    issues=$((issues + 1))
  fi
fi

if [ $issues -eq 0 ]; then
  echo "✅ All checks passed! Your repository is in good state."
  echo ""
  echo "You can safely:"
  echo "  - Create new feature branches"
  echo "  - Push your changes"
  echo "  - Create Pull Requests"
else
  echo "⚠️  Found $issues issue(s) that need attention."
  echo ""
  echo "Please review the checks above and follow the recommended actions."
fi

echo ""
echo "For more information, see:"
echo "  .kiro/steering/60-git-workflow.md"
echo ""

exit 0
