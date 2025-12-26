#!/usr/bin/env python3
"""
Script to add createTestUser calls before repository.save(businessOwnerModel)
"""

import re
from pathlib import Path

def process_file(filepath):
    """Process a single file"""
    print(f"Processing: {filepath.name}")
    
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    new_lines = []
    i = 0
    changes = 0
    
    while i < len(lines):
        line = lines[i]
        new_lines.append(line)
        
        # Check if this line contains repository.save(businessOwnerModel)
        if 'await repository.save(businessOwnerModel)' in line:
            # Look backwards to find the userId
            user_id = None
            for j in range(i-1, max(0, i-20), -1):
                prev_line = lines[j]
                # Look for userId: 'some-uuid' or userId: "some-uuid"
                match = re.search(r"userId:\s*['\"]([^'\"]+)['\"]", prev_line)
                if match:
                    user_id = match.group(1)
                    break
            
            if user_id:
                # Get the indentation of the current line
                indent = len(line) - len(line.lstrip())
                # Insert createTestUser call before save
                create_user_line = ' ' * indent + f"await createTestUser(dataSource, '{user_id}');\n"
                # Insert before the save line
                new_lines.insert(-1, create_user_line)
                changes += 1
                print(f"  ✓ Added createTestUser for userId: {user_id}")
        
        i += 1
    
    if changes > 0:
        with open(filepath, 'w') as f:
            f.writelines(new_lines)
        print(f"  ✓ Made {changes} changes to {filepath.name}")
        return True
    else:
        print(f"  - No changes needed for {filepath.name}")
        return False

def main():
    """Main function"""
    base_path = Path("src/account")
    
    # Find all integration test files
    test_files = list(base_path.rglob("*.integration.spec.ts")) + list(base_path.rglob("*.concurrency.spec.ts"))
    
    print(f"Found {len(test_files)} test files\n")
    
    fixed_count = 0
    for test_file in test_files:
        if process_file(test_file):
            fixed_count += 1
    
    print(f"\n✓ Fixed {fixed_count} files")

if __name__ == "__main__":
    main()
