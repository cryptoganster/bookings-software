#!/usr/bin/env python3
"""
Script to replace hardcoded UUIDs and emails in integration and E2E tests

This script:
1. Finds all integration and E2E test files
2. Replaces hardcoded UUIDs with generateTestId() calls
3. Replaces hardcoded emails with generateTestEmail() calls
4. Adds import statements if not present
5. Adds const declarations for IDs to maintain readability
"""

import re
import os
from pathlib import Path

def should_process_file(filepath):
    """Check if file should be processed"""
    return filepath.endswith('.integration.spec.ts') or filepath.endswith('.e2e.spec.ts')

def add_import_if_missing(content):
    """Add generateTestId and generateTestEmail imports if not present"""
    needs_test_id = 'generateTestId' not in content and re.search(r"'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'", content)
    needs_test_email = 'generateTestEmail' not in content and re.search(r"['\"][\w-]+@example\.com['\"]", content)
    
    if not needs_test_id and not needs_test_email:
        return content
    
    # Find existing imports from @test-utils/integration-test-helper
    import_pattern = re.compile(
        r"import\s+{\s*([^}]+)\s*}\s+from\s+'@test-utils/integration-test-helper';"
    )
    match = import_pattern.search(content)
    
    imports_to_add = []
    if needs_test_id:
        imports_to_add.append('generateTestId')
    if needs_test_email:
        imports_to_add.append('generateTestEmail')
    
    if match:
        # Add to existing import
        imports = match.group(1)
        import_list = [i.strip() for i in imports.split(',')]
        for imp in imports_to_add:
            if imp not in import_list:
                import_list.append(imp)
        new_imports = ',\n  '.join(import_list)
        new_import_statement = f"import {{\n  {new_imports},\n}} from '@test-utils/integration-test-helper';"
        content = content.replace(match.group(0), new_import_statement)
    else:
        # Add new import after other imports
        last_import = None
        for match in re.finditer(r"^import\s+.*?;$", content, re.MULTILINE):
            last_import = match
        
        if last_import:
            insert_pos = last_import.end()
            imports_str = ', '.join(imports_to_add)
            content = (
                content[:insert_pos] + 
                f"\nimport {{ {imports_str} }} from '@test-utils/integration-test-helper';" + 
                content[insert_pos:]
            )
    
    return content

def replace_hardcoded_ids_in_test(content):
    """
    Replace hardcoded UUIDs with generateTestId() calls in test blocks
    """
    
    # Pattern to match hardcoded UUIDs in common contexts
    patterns = [
        # id: 'uuid' -> id: generateTestId()
        (r"id:\s*'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'", 
         "id: generateTestId()"),
        
        # userId: 'uuid' -> userId: generateTestId()
        (r"userId:\s*'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'", 
         "userId: generateTestId()"),
        
        # businessId: 'uuid' -> businessId: generateTestId()
        (r"businessId:\s*'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'", 
         "businessId: generateTestId()"),
        
        # customerId: 'uuid' -> customerId: generateTestId()
        (r"customerId:\s*'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'", 
         "customerId: generateTestId()"),
        
        # offeringId: 'uuid' -> offeringId: generateTestId()
        (r"offeringId:\s*'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'", 
         "offeringId: generateTestId()"),
    ]
    
    for pattern, replacement in patterns:
        content = re.sub(pattern, replacement, content)
    
    return content

def replace_hardcoded_emails(content):
    """
    Replace hardcoded emails with generateTestEmail() calls
    
    Patterns:
    - email: 'test@example.com' -> email: generateTestEmail()
    - 'owner@example.com' -> generateTestEmail()
    """
    
    # Pattern 1: email: 'something@example.com'
    content = re.sub(
        r"email:\s*['\"][\w.-]+@example\.com['\"]",
        "email: generateTestEmail()",
        content
    )
    
    # Pattern 2: Standalone email strings (be careful not to replace in comments)
    # Only replace if it's in a send() or similar context
    content = re.sub(
        r"(\.send\([^)]*email:\s*)['\"][\w.-]+@example\.com['\"]",
        r"\1generateTestEmail()",
        content
    )
    
    return content

def process_file(filepath):
    """Process a single file"""
    print(f"Processing: {filepath}")
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"  ❌ Error reading file: {e}")
        return False
    
    original_content = content
    
    # Add imports
    content = add_import_if_missing(content)
    
    # Replace hardcoded IDs
    content = replace_hardcoded_ids_in_test(content)
    
    # Replace hardcoded emails
    content = replace_hardcoded_emails(content)
    
    if content != original_content:
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  ✅ Updated")
            return True
        except Exception as e:
            print(f"  ❌ Error writing file: {e}")
            return False
    else:
        print(f"  ⏭️  No changes needed")
        return False

def main():
    """Main function"""
    base_dir = Path('src')
    
    if not base_dir.exists():
        print("❌ Error: src directory not found")
        print("   Make sure to run this script from apps/backend/")
        return
    
    files_updated = 0
    files_processed = 0
    files_skipped = 0
    
    # Find all integration and E2E test files
    test_files = list(base_dir.rglob('*.integration.spec.ts')) + list(base_dir.rglob('*.e2e.spec.ts'))
    
    print(f"📁 Found {len(test_files)} test files\n")
    
    for filepath in test_files:
        if should_process_file(str(filepath)):
            files_processed += 1
            if process_file(str(filepath)):
                files_updated += 1
            else:
                files_skipped += 1
    
    print(f"\n{'='*60}")
    print(f"📊 Summary:")
    print(f"  Files found: {len(test_files)}")
    print(f"  Files processed: {files_processed}")
    print(f"  Files updated: {files_updated}")
    print(f"  Files skipped: {files_skipped}")
    print(f"{'='*60}")
    
    if files_updated > 0:
        print(f"\n✅ Successfully updated {files_updated} files!")
        print(f"   Run 'pnpm test:backend' to verify the changes.")
    else:
        print(f"\n✨ All files are already up to date!")

if __name__ == '__main__':
    main()
