#!/usr/bin/env python3
"""
Script to fix all account integration tests by adding createTestUser calls
"""

import os
import re
from pathlib import Path

def add_import_if_missing(content):
    """Add createTestUser import if not present"""
    if 'createTestUser' in content:
        return content
    
    # Find the last import statement
    import_pattern = r"(import .+ from .+;)\n"
    imports = list(re.finditer(import_pattern, content))
    
    if imports:
        last_import = imports[-1]
        insert_pos = last_import.end()
        new_import = "import { createTestUser } from '@test-utils/e2e-helpers';\n"
        content = content[:insert_pos] + new_import + content[insert_pos:]
    
    return content

def fix_business_owner_inserts(content):
    """Add createTestUser before BusinessOwnerModel inserts"""
    
    # Pattern 1: Direct insert with userId
    pattern1 = r"(await dataSource\.getRepository\(BusinessOwnerModel\)\.insert\(\{[^}]*userId:\s*['\"]([^'\"]+)['\"])"
    
    def replace1(match):
        full_match = match.group(0)
        user_id = match.group(2)
        return f"await createTestUser(dataSource, '{user_id}');\n      {full_match}"
    
    content = re.sub(pattern1, replace1, content)
    
    # Pattern 2: Insert with userId variable
    pattern2 = r"(const userId = UUID\.generate\(\)\.getValue\(\);)\n(\s+)(await dataSource\.getRepository\(BusinessOwnerModel\))"
    
    def replace2(match):
        const_line = match.group(1)
        indent = match.group(2)
        insert_line = match.group(3)
        return f"{const_line}\n{indent}await createTestUser(dataSource, userId);\n{indent}{insert_line}"
    
    content = re.sub(pattern2, replace2, content)
    
    # Pattern 3: save() method
    pattern3 = r"(const businessOwnerModel = repository\.create\(\{[^}]*userId:\s*['\"]([^'\"]+)['\"])"
    
    def replace3(match):
        full_match = match.group(0)
        user_id = match.group(2)
        return f"await createTestUser(dataSource, '{user_id}');\n      {full_match}"
    
    content = re.sub(pattern3, replace3, content)
    
    return content

def process_file(filepath):
    """Process a single test file"""
    print(f"Processing: {filepath}")
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    original_content = content
    
    # Add import
    content = add_import_if_missing(content)
    
    # Fix inserts
    content = fix_business_owner_inserts(content)
    
    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"  ✓ Fixed {filepath}")
        return True
    else:
        print(f"  - No changes needed for {filepath}")
        return False

def main():
    """Main function"""
    backend_dir = Path("apps/backend/src/account")
    
    # Find all integration test files
    test_files = list(backend_dir.rglob("*.integration.spec.ts"))
    
    print(f"Found {len(test_files)} integration test files in account BC\n")
    
    fixed_count = 0
    for test_file in test_files:
        if process_file(test_file):
            fixed_count += 1
    
    print(f"\n✓ Fixed {fixed_count} files")

if __name__ == "__main__":
    main()
