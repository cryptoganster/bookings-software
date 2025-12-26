#!/usr/bin/env python3
"""
Script to fix integration tests by adding createTestUser calls before inserting businesses.
"""

import re
import os
import glob

def fix_file(filepath):
    """Fix a single test file."""
    with open(filepath, 'r') as f:
        content = f.read()
    
    original_content = content
    
    # 1. Add import if not present
    if 'createTestUser' not in content and 'E2EDatabaseHelper' in content:
        content = content.replace(
            "import { E2EDatabaseHelper } from '@test-utils/e2e-helpers';",
            "import { E2EDatabaseHelper, createTestUser } from '@test-utils/e2e-helpers';"
        )
    
    # 2. Find all patterns where we create an ownerId and then insert
    # Pattern: const ownerId = UUID.generate().getValue();\n\n      await dataSource.getRepository
    pattern = r'(const ownerId = UUID\.generate\(\)\.getValue\(\);)\s*\n\s*\n(\s*await dataSource\.getRepository\(BusinessModel\)\.insert)'
    
    def replacement(match):
        owner_line = match.group(1)
        spaces = match.group(2).split('await')[0]  # Get the indentation
        insert_line = match.group(2)
        return f'{owner_line}\n{spaces}await createTestUser(dataSource, ownerId); // Create user first\n\n{insert_line}'
    
    content = re.sub(pattern, replacement, content)
    
    # 3. Also handle cases where ownerId is used inline: ownerId: UUID.generate().getValue()
    # We need to extract it first
    pattern2 = r'(\s+)ownerId: UUID\.generate\(\)\.getValue\(\),'
    
    def replacement2(match):
        spaces = match.group(1)
        return f'{spaces}ownerId: ownerId,'
    
    # First, find all inline UUID.generate() for ownerId and extract them
    lines = content.split('\n')
    new_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Check if this line has inline ownerId generation in an insert
        if 'ownerId: UUID.generate().getValue(),' in line and 'await dataSource.getRepository(BusinessModel).insert' in '\n'.join(lines[max(0,i-10):i+1]):
            # Find the start of the insert block (look backwards)
            j = i - 1
            while j >= 0 and 'await dataSource.getRepository(BusinessModel).insert' not in lines[j]:
                j -= 1
            
            if j >= 0:
                # Extract indentation
                indent_match = re.match(r'(\s*)', lines[j])
                indent = indent_match.group(1) if indent_match else '      '
                
                # Add ownerId generation before the insert
                new_lines.append(f'{indent}const ownerId = UUID.generate().getValue();')
                new_lines.append(f'{indent}await createTestUser(dataSource, ownerId); // Create user first')
                new_lines.append('')
                
                # Now add the insert line with the modification
                new_lines.append(lines[j])
                
                # Continue with remaining lines, replacing inline ownerId
                i = j + 1
                while i <= len(lines) - 1:
                    current_line = lines[i]
                    if 'ownerId: UUID.generate().getValue(),' in current_line:
                        current_line = current_line.replace('ownerId: UUID.generate().getValue(),', 'ownerId: ownerId,')
                    new_lines.append(current_line)
                    
                    # Stop at the end of the insert block
                    if '});' in current_line:
                        i += 1
                        break
                    i += 1
                continue
        
        new_lines.append(line)
        i += 1
    
    content = '\n'.join(new_lines)
    
    # Write back if changed
    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        return True
    return False

def main():
    """Main function."""
    # Find all integration test files in account and business
    patterns = [
        'src/account/**/*.integration.spec.ts',
        'src/business/**/*.integration.spec.ts',
    ]
    
    files_fixed = 0
    for pattern in patterns:
        for filepath in glob.glob(pattern, recursive=True):
            if fix_file(filepath):
                print(f'✓ Fixed: {filepath}')
                files_fixed += 1
            else:
                print(f'- Skipped: {filepath}')
    
    print(f'\nTotal files fixed: {files_fixed}')

if __name__ == '__main__':
    main()
