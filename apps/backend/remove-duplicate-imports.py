#!/usr/bin/env python3
"""Remove duplicate createTestUser imports"""

import re
from pathlib import Path

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Find all createTestUser imports
    pattern = r"import \{ createTestUser \} from '@test-utils/e2e-helpers';\n"
    matches = list(re.finditer(pattern, content))
    
    if len(matches) > 1:
        # Keep only the first one, remove the rest
        for match in reversed(matches[1:]):
            content = content[:match.start()] + content[match.end():]
        
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"✓ Fixed {filepath.name} - removed {len(matches)-1} duplicate imports")
        return True
    return False

def main():
    base_path = Path("src/account")
    test_files = list(base_path.rglob("*.spec.ts"))
    
    fixed = 0
    for test_file in test_files:
        if fix_file(test_file):
            fixed += 1
    
    print(f"\n✓ Fixed {fixed} files")

if __name__ == "__main__":
    main()
