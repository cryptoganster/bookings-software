#!/usr/bin/env python3
"""
Script to fix @typescript-eslint/no-explicit-any warnings.

Strategy:
1. For function parameters in tests: Use specific types or unknown
2. For mock objects: Use proper mock types
3. For catch blocks: Use unknown
4. For generic callbacks: Use specific types
"""

import re
import subprocess
import sys
from pathlib import Path

# Run lint and capture output
result = subprocess.run(
    ['pnpm', 'lint'],
    capture_output=True,
    text=True,
    cwd='/Users/bryanstevens/dev/bookings-bot/apps/backend'
)

output = result.stdout + result.stderr

# Parse warnings
pattern = r"^\s*(\d+):(\d+)\s+warning\s+Unexpected any"
warnings = []
current_file = None

for line in output.split('\n'):
    # Check if this is a file path line
    if line.startswith('/') and '.ts' in line:
        current_file = line.split()[0]
        continue
    
    match = re.match(pattern, line)
    if match and current_file:
        line_num, col = match.groups()
        warnings.append({
            'file': current_file,
            'line': int(line_num),
            'col': int(col)
        })

print(f"Found {len(warnings)} 'any' warnings")

# Group by file
files = {}
for warning in warnings:
    if warning['file'] not in files:
        files[warning['file']] = []
    files[warning['file']].append(warning)

# Common patterns to replace
replacements = [
    # Catch blocks: (error: any) -> (error: unknown)
    (r'\(error:\s*any\)', '(error: unknown)'),
    (r'\(err:\s*any\)', '(err: unknown)'),
    (r'\(e:\s*any\)', '(e: unknown)'),
    
    # Data parameters: (data: any) -> (data: unknown)
    (r'\(data:\s*any\)', '(data: unknown)'),
    
    # Event handlers: (event: any) -> (event: unknown)
    (r'\(event:\s*any\)', '(event: unknown)'),
    
    # Mock return types: as any -> as unknown
    (r'as\s+any\b', 'as unknown'),
    
    # Generic any in type annotations
    (r':\s*any\s*\)', ': unknown)'),
    (r':\s*any\s*,', ': unknown,'),
    (r':\s*any\s*;', ': unknown;'),
    (r':\s*any\s*=', ': unknown ='),
    
    # Array of any: any[] -> unknown[]
    (r'\bany\[\]', 'unknown[]'),
    
    # Promise<any> -> Promise<unknown>
    (r'Promise<any>', 'Promise<unknown>'),
    
    # Record<string, any> -> Record<string, unknown>
    (r'Record<string,\s*any>', 'Record<string, unknown>'),
    
    # Function return type any
    (r'\):\s*any\s*{', '): unknown {'),
    (r'\):\s*any\s*=>', '): unknown =>'),
]

# Fix each file
fixed_count = 0
for filepath, file_warnings in files.items():
    print(f"\nFixing {filepath}...")
    
    try:
        with open(filepath, 'r') as f:
            content = f.read()
    except Exception as e:
        print(f"  ✗ Could not read file: {e}")
        continue
    
    original_content = content
    
    # Apply replacements
    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content)
    
    # Write back if changed
    if content != original_content:
        try:
            with open(filepath, 'w') as f:
                f.write(content)
            fixed_count += 1
            print(f"  ✓ Fixed")
        except Exception as e:
            print(f"  ✗ Could not write file: {e}")
    else:
        print(f"  - No automatic fixes applied")

print(f"\n✓ Fixed {fixed_count} files")
