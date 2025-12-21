/**
 * Custom ESLint rules for architecture boundaries
 * 
 * Este archivo define reglas personalizadas para validar que las capas
 * de Clean Architecture respeten las dependencias permitidas.
 */

module.exports = {
  'enforce-path-aliases': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Enforce use of TypeScript path aliases instead of relative imports',
        category: 'Best Practices',
        recommended: true,
      },
      messages: {
        usePathAlias: 'Use path alias "{{alias}}" instead of relative import. Change "{{from}}" to "{{to}}"',
        invalidAlias: 'Invalid path alias "{{alias}}". Only these aliases are allowed: {{allowedAliases}}',
      },
      fixable: 'code',
      schema: [],
    },
    create(context) {
      const filename = context.getFilename();
      
      // Ignorar archivos de test
      if (filename.includes('.spec.ts') || filename.includes('.test.ts') || filename.includes('.e2e-spec.ts')) {
        return {};
      }
      
      // Definir aliases permitidos (deben coincidir con tsconfig.json)
      const allowedAliases = [
        '@packages/shared-types',
        '@shared',
        '@booking',
        '@conversation',
        '@auth',
        '@availability',
        '@offering',
        '@customer',
        '@business',
        '@test-utils',
        '@database',
        '@config',
      ];
      
      // Mapeo de paths para detección
      const aliasMap = {
        'src/shared': '@shared',
        'src/booking': '@booking',
        'src/conversation': '@conversation',
        'src/auth': '@auth',
        'src/availability': '@availability',
        'src/offering': '@offering',
        'src/customer': '@customer',
        'src/business': '@business',
        'src/test-utils': '@test-utils',
        'src/database': '@database',
        'src/config': '@config',
      };
      
      return {
        ImportDeclaration(node) {
          const importPath = node.source.value;
          
          // Ignorar imports externos (node_modules)
          if (!importPath.startsWith('.')) {
            // Validar que los aliases usados sean permitidos
            const usedAlias = allowedAliases.find(alias => importPath.startsWith(alias));
            if (usedAlias) {
              // Es un alias válido, todo bien
              return;
            }
            
            // Si empieza con @ pero no está en la lista, es inválido
            if (importPath.startsWith('@') && !importPath.startsWith('@nestjs') && !importPath.startsWith('@types')) {
              context.report({
                node,
                messageId: 'invalidAlias',
                data: {
                  alias: importPath.split('/')[0],
                  allowedAliases: allowedAliases.join(', '),
                },
              });
            }
            return;
          }
          
          // Es un import relativo - verificar si debería usar alias
          const path = require('path');
          const currentDir = path.dirname(filename);
          const resolvedPath = path.resolve(currentDir, importPath);
          
          // Detectar si el import apunta a un directorio que tiene alias
          for (const [srcPath, alias] of Object.entries(aliasMap)) {
            const fullSrcPath = path.resolve(process.cwd(), srcPath);
            
            if (resolvedPath.startsWith(fullSrcPath)) {
              // Calcular el path relativo desde el directorio base del alias
              const relativePath = path.relative(fullSrcPath, resolvedPath);
              const suggestedImport = `${alias}/${relativePath}`.replace(/\\/g, '/');
              
              context.report({
                node,
                messageId: 'usePathAlias',
                data: {
                  alias,
                  from: importPath,
                  to: suggestedImport,
                },
                fix(fixer) {
                  return fixer.replaceText(node.source, `'${suggestedImport}'`);
                },
              });
              break;
            }
          }
        },
      };
    },
  },
  
  'no-cross-boundary-imports': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Enforce architecture boundaries between layers and bounded contexts',
        category: 'Architecture',
        recommended: true,
      },
      messages: {
        domainToApp: 'Domain layer cannot import from Application layer ({{from}} -> {{to}})',
        domainToInfra: 'Domain layer cannot import from Infrastructure layer ({{from}} -> {{to}})',
        domainToPresentation: 'Domain layer cannot import from Presentation layer ({{from}} -> {{to}})',
        domainToOtherBC: 'Domain layer cannot import from other Bounded Contexts ({{from}} -> {{to}})',
        domainFramework: 'Domain layer cannot import infrastructure frameworks: {{module}}',
        appToInfra: 'Application layer cannot import from Infrastructure layer ({{from}} -> {{to}})',
        appToPresentation: 'Application layer cannot import from Presentation layer ({{from}} -> {{to}})',
        appToOtherBCApp: 'Application layer cannot import from other BC Application layers ({{from}} -> {{to}})',
        appToOtherBCAggregate: 'Application layer cannot import aggregates from other BCs ({{from}} -> {{to}}). Use interfaces or events instead.',
        infraToPresentation: 'Infrastructure layer cannot import from Presentation layer ({{from}} -> {{to}})',
        infraToOtherBC: 'Infrastructure layer cannot import from other Bounded Contexts ({{from}} -> {{to}})',
        presentationToInfra: 'Presentation layer cannot import from Infrastructure layer ({{from}} -> {{to}})',
        presentationToOtherBC: 'Presentation layer cannot import from other Bounded Contexts ({{from}} -> {{to}})',
      },
      schema: [],
    },
    create(context) {
      const filename = context.getFilename();
      
      // Detectar la capa y BC del archivo actual
      const fileInfo = getFileInfo(filename);
      if (!fileInfo) return {};
      
      return {
        ImportDeclaration(node) {
          const importPath = node.source.value;
          const importInfo = getImportInfo(importPath, filename);
          
          if (!importInfo) return;
          
          // Validar reglas según la capa
          validateBoundaries(context, node, fileInfo, importInfo);
        },
      };
    },
  },
};

/**
 * Extrae información del archivo actual
 */
function getFileInfo(filename) {
  // Ignorar archivos de test
  if (filename.includes('.spec.ts') || filename.includes('.test.ts') || filename.includes('.e2e-spec.ts')) {
    return null;
  }
  
  const match = filename.match(/src\/([^\/]+)\/(domain|app|infra|presentation)\//);
  if (!match) return null;
  
  const [, bc, layer] = match;
  
  // Detectar si es shared
  const isShared = filename.includes('src/shared/');
  
  return {
    bc: isShared ? 'shared' : bc,
    layer,
    isShared,
    isModule: filename.endsWith('.module.ts'),
  };
}

/**
 * Extrae información del import
 */
function getImportInfo(importPath, currentFile) {
  // Imports externos (node_modules)
  if (!importPath.startsWith('.') && !importPath.startsWith('@')) {
    return {
      isExternal: true,
      module: importPath,
    };
  }
  
  // Resolver path relativo
  const path = require('path');
  const currentDir = path.dirname(currentFile);
  const resolvedPath = path.resolve(currentDir, importPath);
  
  // Detectar BC y capa del import
  const match = resolvedPath.match(/src\/([^\/]+)\/(domain|app|infra|presentation)\//);
  if (!match) return null;
  
  const [, bc, layer] = match;
  const isShared = resolvedPath.includes('src/shared/');
  
  // Detectar subcapa específica
  const isInterface = resolvedPath.includes('/domain/interfaces/');
  const isEvent = resolvedPath.includes('/domain/events/');
  const isAggregate = resolvedPath.includes('/domain/aggregates/');
  const isVO = resolvedPath.includes('/domain/vo/');
  
  return {
    isExternal: false,
    bc: isShared ? 'shared' : bc,
    layer,
    isShared,
    isInterface,
    isEvent,
    isAggregate,
    isVO,
    path: resolvedPath,
  };
}

/**
 * Valida las reglas de boundaries
 */
function validateBoundaries(context, node, fileInfo, importInfo) {
  const { bc: fromBC, layer: fromLayer, isShared: fromShared, isModule } = fileInfo;
  
  // Módulos NestJS pueden importar lo que necesiten
  if (isModule) return;
  
  // Imports externos
  if (importInfo.isExternal) {
    validateExternalImports(context, node, fileInfo, importInfo);
    return;
  }
  
  const { bc: toBC, layer: toLayer, isShared: toShared, isInterface, isEvent } = importInfo;
  
  // Permitir imports de shared
  if (toShared) return;
  
  // Validar según la capa origen
  switch (fromLayer) {
    case 'domain':
      validateDomainImports(context, node, fileInfo, importInfo);
      break;
    case 'app':
      validateAppImports(context, node, fileInfo, importInfo);
      break;
    case 'infra':
      validateInfraImports(context, node, fileInfo, importInfo);
      break;
    case 'presentation':
      validatePresentationImports(context, node, fileInfo, importInfo);
      break;
  }
}

/**
 * Valida imports externos (node_modules)
 */
function validateExternalImports(context, node, fileInfo, importInfo) {
  const { layer } = fileInfo;
  const { module } = importInfo;
  
  // Domain no puede importar frameworks
  if (layer === 'domain') {
    const forbiddenModules = ['@nestjs/common', '@nestjs/typeorm', 'typeorm', 'axios'];
    if (forbiddenModules.some(m => module.startsWith(m))) {
      context.report({
        node,
        messageId: 'domainFramework',
        data: { module },
      });
    }
  }
}

/**
 * Valida imports desde Domain layer
 */
function validateDomainImports(context, node, fileInfo, importInfo) {
  const { bc: fromBC } = fileInfo;
  const { bc: toBC, layer: toLayer } = importInfo;
  
  // Domain solo puede importar de su propio domain
  if (toBC !== fromBC) {
    context.report({
      node,
      messageId: 'domainToOtherBC',
      data: { from: `${fromBC}/domain`, to: `${toBC}/${toLayer}` },
    });
    return;
  }
  
  // Domain no puede importar de app, infra, presentation
  if (toLayer === 'app') {
    context.report({
      node,
      messageId: 'domainToApp',
      data: { from: `${fromBC}/domain`, to: `${toBC}/app` },
    });
  } else if (toLayer === 'infra') {
    context.report({
      node,
      messageId: 'domainToInfra',
      data: { from: `${fromBC}/domain`, to: `${toBC}/infra` },
    });
  } else if (toLayer === 'presentation') {
    context.report({
      node,
      messageId: 'domainToPresentation',
      data: { from: `${fromBC}/domain`, to: `${toBC}/presentation` },
    });
  }
}

/**
 * Valida imports desde Application layer
 */
function validateAppImports(context, node, fileInfo, importInfo) {
  const { bc: fromBC } = fileInfo;
  const { bc: toBC, layer: toLayer, isInterface, isEvent, isAggregate } = importInfo;
  
  // App puede importar interfaces y eventos de cualquier BC
  if (isInterface || isEvent) return;
  
  // App puede importar de su propio domain
  if (toBC === fromBC && toLayer === 'domain') return;
  
  // App puede importar de su propio app
  if (toBC === fromBC && toLayer === 'app') return;
  
  // App NO puede importar aggregates de otros BCs
  if (toBC !== fromBC && toLayer === 'domain' && isAggregate) {
    context.report({
      node,
      messageId: 'appToOtherBCAggregate',
      data: { from: `${fromBC}/app`, to: `${toBC}/domain/aggregates` },
    });
    return;
  }
  
  // App NO puede importar de otros BC app
  if (toBC !== fromBC && toLayer === 'app') {
    context.report({
      node,
      messageId: 'appToOtherBCApp',
      data: { from: `${fromBC}/app`, to: `${toBC}/app` },
    });
    return;
  }
  
  // App no puede importar de infra
  if (toLayer === 'infra') {
    context.report({
      node,
      messageId: 'appToInfra',
      data: { from: `${fromBC}/app`, to: `${toBC}/infra` },
    });
  }
  
  // App no puede importar de presentation
  if (toLayer === 'presentation') {
    context.report({
      node,
      messageId: 'appToPresentation',
      data: { from: `${fromBC}/app`, to: `${toBC}/presentation` },
    });
  }
}

/**
 * Valida imports desde Infrastructure layer
 */
function validateInfraImports(context, node, fileInfo, importInfo) {
  const { bc: fromBC } = fileInfo;
  const { bc: toBC, layer: toLayer } = importInfo;
  
  // Infra solo puede importar de su propio BC
  if (toBC !== fromBC) {
    context.report({
      node,
      messageId: 'infraToOtherBC',
      data: { from: `${fromBC}/infra`, to: `${toBC}/${toLayer}` },
    });
    return;
  }
  
  // Infra no puede importar de presentation
  if (toLayer === 'presentation') {
    context.report({
      node,
      messageId: 'infraToPresentation',
      data: { from: `${fromBC}/infra`, to: `${toBC}/presentation` },
    });
  }
}

/**
 * Valida imports desde Presentation layer
 */
function validatePresentationImports(context, node, fileInfo, importInfo) {
  const { bc: fromBC } = fileInfo;
  const { bc: toBC, layer: toLayer } = importInfo;
  
  // Presentation solo puede importar de su propio BC
  if (toBC !== fromBC) {
    context.report({
      node,
      messageId: 'presentationToOtherBC',
      data: { from: `${fromBC}/presentation`, to: `${toBC}/${toLayer}` },
    });
    return;
  }
  
  // Presentation no puede importar de infra
  if (toLayer === 'infra') {
    context.report({
      node,
      messageId: 'presentationToInfra',
      data: { from: `${fromBC}/presentation`, to: `${toBC}/infra` },
    });
  }
}
