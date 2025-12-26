#!/usr/bin/env python3
"""
Script to add createTestUser calls before all repository.save(businessOwnerModel) calls
"""

import re
from pathlib import Path

def fix_file(filepath):
    """Fix a single file by adding createTestUser before repository.save calls"""
    print(f"Processing: {filepath}")
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    original_content = content
    
    # Pattern to find repository.save with userId in the model
    # We need to extract the userId from the businessOwnerModel creation
    
    # Find all occurrences of repository.create followed by repository.save
    pattern = r"(const businessOwnerModel = repository\.create\(\{[^}]*userId:\s*['\"]([^'\"]+)['\"][^}]*\}\);)\s*(await repository\.save\(businessOwnerModel\);)"
    
    def replacer(match):
        create_line = match.group(1)
        user_id = match.group(2)
        save_line = match.group(3)
        
        return f"{create_line}\n      await createTestUser(dataSource, '{user_id}');\n      {save_line}"
    
    content = re.sub(pattern, replacer, content, flags=re.DOTALL)
    
    # Also handle cases where userId is a variable
    pattern2 = r"(userId:\s*userId,)"
    matches = list(re.finditer(pattern2, content))
    
    if matches and content != original_content:
        # File was modified, save it
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"  ✓ Fixed {filepath}")
        return True
    elif content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"  ✓ Fixed {filepath}")
        return True
    else:
        print(f"  - No changes for {filepath}")
        return False

def main():
    """Main function"""
    # Find the specific file
    filepath = Path("src/account/infra/persistence/factories/__tests__/business-owner.factory.integration.spec.ts")
    
    if filepath.exists():
        fix_file(filepath)
    else:
        print(f"File not found: {filepath}")

if __name__ == "__main__":
    main()
