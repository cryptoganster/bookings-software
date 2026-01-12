#!/usr/bin/env bash

# Safe Shell Wrapper
# Purpose: Wrap dangerous commands with confirmation prompts
# Usage: Source this file in your ~/.zshrc or ~/.bashrc
#        source /path/to/bookings-bot/scripts/safe-shell-wrapper.sh

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Function to ask for confirmation
ask_confirmation() {
    local command="$1"
    local message="$2"
    local alternatives="$3"
    
    echo -e "${YELLOW}⚠️  WARNING: Potentially destructive operation!${NC}"
    echo -e "${YELLOW}Command: $command${NC}"
    echo ""
    echo -e "${RED}$message${NC}"
    echo ""
    if [ -n "$alternatives" ]; then
        echo -e "${GREEN}✅ Safe alternatives:${NC}"
        echo -e "$alternatives"
        echo ""
    fi
    
    # Ask for confirmation
    read -p "Are you sure you want to proceed? (y/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}✅ Operation cancelled. Your files are safe.${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}⚠️  Proceeding with operation...${NC}"
    return 0
}

# Wrapper for rm command
safe_rm() {
    local full_command="rm $@"
    
    # Check if using -rf or -f flags on non-build directories
    if [[ "$@" =~ -[rf]+ ]] || [[ "$@" =~ -[fr]+ ]]; then
        # Check if targeting project files (not node_modules, dist, etc.)
        local is_safe_target=false
        for arg in "$@"; do
            if [[ "$arg" =~ node_modules ]] || \
               [[ "$arg" =~ dist/ ]] || \
               [[ "$arg" =~ coverage/ ]] || \
               [[ "$arg" =~ .next/ ]] || \
               [[ "$arg" =~ build/ ]]; then
                is_safe_target=true
                break
            fi
        done
        
        if [ "$is_safe_target" = false ]; then
            local alternatives="   1. Use 'git restore <file>' to discard changes in tracked files
   2. Use 'git clean -n' to preview what would be deleted
   3. Use 'git stash' to save changes temporarily
   4. Delete specific files individually without -rf"
            
            if ask_confirmation "$full_command" "This will permanently delete files that may contain uncommitted work." "$alternatives"; then
                command rm "$@"
            fi
            return $?
        fi
    fi
    
    # Execute normal rm for safe operations
    command rm "$@"
}

# Wrapper for git clean
safe_git_clean() {
    local full_command="git clean $@"
    
    # Check for -fd or -df flags
    if [[ "$@" =~ -[fd]+ ]] || [[ "$@" =~ -[df]+ ]]; then
        local alternatives="   1. Use 'git clean -n' to preview what would be deleted
   2. Use 'git stash --include-untracked' to save untracked files
   3. Review files with 'git status' first"
        
        if ask_confirmation "$full_command" "This will permanently delete all untracked files." "$alternatives"; then
            command git clean "$@"
        fi
        return $?
    fi
    
    # Execute normal git clean for safe operations (like -n)
    command git clean "$@"
}

# Override git command to intercept git clean
git() {
    if [ "$1" = "clean" ]; then
        shift
        safe_git_clean "$@"
    else
        command git "$@"
    fi
}

# Create alias for rm
alias rm='safe_rm'

echo -e "${GREEN}✅ Safe shell wrappers loaded!${NC}"
echo -e "${YELLOW}   - 'rm -rf' will ask for confirmation on project files${NC}"
echo -e "${YELLOW}   - 'git clean -fd' will ask for confirmation${NC}"
echo ""
