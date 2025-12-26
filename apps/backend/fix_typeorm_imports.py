#!/usr/bin/env python3
import re
import sys
from pathlib import Path

def fix_file(filepath):
    """Fix TypeOrmModule.forRoot in a test file"""
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        
        original_content = content
        changed = False
        
        # 1. Add E2EDatabaseHelper import if not present
        if 'E2EDatabaseHelper' not in content and 'TypeOrmModule.forRoot({' in content:
            # Find last import line
            lines = content.split('\n')
            import_indices = [i for i, line in enumerate(lines) if line.strip().startswith('import ')]
            if import_indices:
                last_import_idx = import_indices[-1]
                lines.insert(last_import_idx + 1, "import { E2EDatabaseHelper } from '@test-utils/e2e-helpers';")
                content = '\n'.join(lines)
                changed = True
        
        # 2. Replace TypeOrmModule.forRoot({ ... }) with E2EDatabaseHelper.getTestTypeOrmConfig()
        # Simple pattern that matches the opening and finds the closing brace
        if 'TypeOrmModule.forRoot({' in content:
            # Find all occurrences
            start_pattern = 'TypeOrmModule.forRoot({'
            idx = 0
            while True:
                idx = content.find(start_pattern, idx)
                if idx == -1:
                    break
                
                # Find matching closing brace
                brace_count = 1
                i = idx + len(start_pattern)
                while i < len(content) and brace_count > 0:
                    if content[i] == '{':
                        brace_count += 1
                    elif content[i] == '}':
                        brace_count -= 1
                    i += 1
                
                if brace_count == 0:
                    # Found matching brace, check if followed by )
                    if i < len(content) and content[i] == ')':
                        # Replace the entire TypeOrmModule.forRoot({...})
                        old_text = content[idx:i+1]
                        new_text = 'TypeOrmModule.forRoot(E2EDatabaseHelper.getTestTypeOrmConfig())'
                        content = content[:idx] + new_text + content[i+1:]
                        changed = True
                        idx = idx + len(new_text)
                    else:
                        idx = i
                else:
                    break
        
        # 3. Replace .clear() with E2EDatabaseHelper.cleanDatabase(dataSource)
        clear_patterns = [
            (r'await\s+dataSource\.getRepository\([^)]+\)\.clear\(\);', 'await E2EDatabaseHelper.cleanDatabase(dataSource);'),
            (r'await\s+repository\.clear\(\);', 'await E2EDatabaseHelper.cleanDatabase(dataSource);'),
        ]
        
        for pattern, replacement in clear_patterns:
            if re.search(pattern, content):
                content = re.sub(pattern, replacement, content)
                changed = True
        
        # Only write if changed
        if changed:
            with open(filepath, 'w') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error processing {filepath}: {e}", file=sys.stderr)
        return False

def main():
    # Find all test files with TypeOrmModule.forRoot
    backend_dir = Path('src')
    test_files = list(backend_dir.rglob('**/__tests__/*.spec.ts'))
    
    fixed_count = 0
    for test_file in test_files:
        try:
            with open(test_file, 'r') as f:
                if 'TypeOrmModule.forRoot({' in f.read():
                    if fix_file(test_file):
                        print(f"✓ Fixed: {test_file}")
                        fixed_count += 1
        except Exception as e:
            print(f"✗ Error reading {test_file}: {e}", file=sys.stderr)
    
    print(f"\nFixed {fixed_count} files")

if __name__ == '__main__':
    main()
