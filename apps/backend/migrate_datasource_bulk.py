#!/usr/bin/env python3
"""
Script para migrar tests de DataSource aislado a createIntegrationTestDataSource()
"""

import re
import sys
from pathlib import Path

# Template para el import
IMPORT_TEMPLATE = "import { createIntegrationTestDataSource, cleanDatabase } from '@test-utils/integration-test-helper';"

# Patrón para encontrar el bloque de DataSource
DATASOURCE_PATTERN = r'''(\s+)\{
\s+provide: DataSource,
\s+useFactory: async \(\) => \{
\s+const AppDataSource = new DataSource\(\{[^}]+\}\);
\s+return AppDataSource\.initialize\(\);
\s+\},
\s+\}'''

# Reemplazo para DataSource
DATASOURCE_REPLACEMENT = r'''\1{
\1  provide: DataSource,
\1  useValue: dataSource, // Use the shared DataSource
\1}'''

def migrate_file(filepath):
    """Migra un archivo de test"""
    print(f"📝 Procesando: {filepath}")
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    original_content = content
    
    # 1. Agregar import si no existe
    if 'createIntegrationTestDataSource' not in content:
        # Buscar la línea de import de typeorm
        typeorm_import = re.search(r"import.*from 'typeorm';", content)
        if typeorm_import:
            insert_pos = typeorm_import.end()
            content = content[:insert_pos] + f"\n{IMPORT_TEMPLATE}" + content[insert_pos:]
            print("  ✅ Import agregado")
    
    # 2. Reemplazar el bloque de DataSource useFactory con useValue
    content = re.sub(DATASOURCE_PATTERN, DATASOURCE_REPLACEMENT, content, flags=re.MULTILINE)
    
    # 3. Agregar creación de dataSource en beforeAll/beforeEach
    # Buscar beforeAll o beforeEach
    if 'beforeAll(async () => {' in content or 'beforeEach(async () => {' in content:
        # Buscar el inicio del beforeAll/beforeEach
        pattern = r'(beforeAll\(async \(\) => \{)\n'
        replacement = r'\1\n    // Use shared DataSource with all entities\n    dataSource = await createIntegrationTestDataSource();\n\n'
        
        # Solo reemplazar si no existe ya
        if 'createIntegrationTestDataSource()' not in content:
            content = re.sub(pattern, replacement, content)
            print("  ✅ DataSource creation agregado")
    
    # 4. Reemplazar repository.clear() con cleanDatabase()
    content = re.sub(
        r'await repository\.clear\(\);',
        'await cleanDatabase(dataSource);',
        content
    )
    
    # 5. Eliminar línea de dataSource = module.get<DataSource>(DataSource);
    content = re.sub(
        r'\s+dataSource = module\.get<DataSource>\(DataSource\);\n',
        '',
        content
    )
    
    # 6. Eliminar dropSchema: true
    content = re.sub(
        r',?\s*dropSchema: true,?\s*',
        '',
        content
    )
    
    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print("  ✅ Archivo migrado exitosamente")
        return True
    else:
        print("  ⚠️  No se realizaron cambios")
        return False

def main():
    # Lista de archivos a migrar
    files = [
        "src/account/app/commands/upgrade-subscription/__tests__/handler.concurrency.spec.ts",
        "src/account/app/commands/complete-onboarding/__tests__/handler.integration.spec.ts",
        "src/account/app/commands/upgrade-subscription/__tests__/handler.integration.spec.ts",
        "src/account/app/commands/restore-subscription/__tests__/handler.integration.spec.ts",
        "src/account/app/commands/suspend-subscription/__tests__/handler.integration.spec.ts",
        "src/account/app/commands/create-business-owner/__tests__/handler.integration.spec.ts",
    ]
    
    migrated = 0
    for file in files:
        filepath = Path(file)
        if filepath.exists():
            if migrate_file(filepath):
                migrated += 1
        else:
            print(f"  ⚠️  Archivo no encontrado: {file}")
    
    print(f"\n✅ {migrated} archivos migrados exitosamente")

if __name__ == "__main__":
    main()
