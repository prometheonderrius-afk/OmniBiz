const fs = require('fs');
const path = require('path');

/**
 * Loads compilerOptions.paths from tsconfig.json or jsconfig.json
 * @param {string} rootDir 
 * @returns {{ baseUrl: string, paths: Record<string, string[]> }}
 */
function loadPathsConfig(rootDir) {
  const tsconfigPath = path.join(rootDir, 'tsconfig.json');
  const jsconfigPath = path.join(rootDir, 'jsconfig.json');
  let configPath = null;

  if (fs.existsSync(tsconfigPath)) {
    configPath = tsconfigPath;
  } else if (fs.existsSync(jsconfigPath)) {
    configPath = jsconfigPath;
  }

  if (!configPath) {
    return { baseUrl: '.', paths: {} };
  }

  try {
    const content = fs.readFileSync(configPath, 'utf8');
    // Strip comments from tsconfig/jsconfig since they are JSON-with-comments
    const cleanJson = content.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
    const config = JSON.parse(cleanJson);
    const compilerOptions = config.compilerOptions || {};
    return {
      baseUrl: compilerOptions.baseUrl || '.',
      paths: compilerOptions.paths || {}
    };
  } catch (err) {
    return { baseUrl: '.', paths: {} };
  }
}

const EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.css', '.scss', '.sass', '.less', '.json'];

/**
 * Resolves a module specifier
 * @param {string} importee 
 * @param {string} importer 
 * @param {string} rootDir 
 * @param {{ baseUrl: string, paths: Record<string, string[]> }} pathsConfig 
 * @returns {string|null}
 */
function resolveImport(importee, importer, rootDir, pathsConfig) {
  if (!importee) return null;

  // 1. Absolute paths or relative paths
  if (importee.startsWith('.') || importee.startsWith('/')) {
    const baseDir = importee.startsWith('/') ? rootDir : path.dirname(importer);
    const resolvedPath = path.resolve(baseDir, importee);
    return resolveFileOrDirectory(resolvedPath);
  }

  // 2. Try path aliases from tsconfig/jsconfig
  if (pathsConfig && pathsConfig.paths) {
    const aliasResult = resolveAlias(importee, rootDir, pathsConfig);
    if (aliasResult) return aliasResult;
  }

  // 3. Try resolving as node_modules path (especially important for CSS imports like 'normalize.css')
  const nodeModulesPath = path.join(rootDir, 'node_modules', importee);
  const resolvedNodeModule = resolveFileOrDirectory(nodeModulesPath);
  if (resolvedNodeModule) return resolvedNodeModule;

  return null;
}

function resolveAlias(importee, rootDir, pathsConfig) {
  const { baseUrl, paths } = pathsConfig;
  const base = path.resolve(rootDir, baseUrl);

  for (const aliasPattern of Object.keys(paths)) {
    const templates = paths[aliasPattern];
    
    // Check if alias pattern has a wildcard (e.g. "@/ *")
    if (aliasPattern.endsWith('/*')) {
      const prefix = aliasPattern.slice(0, -2);
      if (importee.startsWith(prefix)) {
        const wildcardContent = importee.slice(prefix.length);
        for (const template of templates) {
          if (template.endsWith('/*')) {
            const templatePrefix = template.slice(0, -2);
            const candidate = path.resolve(base, templatePrefix + wildcardContent);
            const resolved = resolveFileOrDirectory(candidate);
            if (resolved) return resolved;
          }
        }
      }
    } else {
      // Exact match (e.g. "utils")
      if (importee === aliasPattern) {
        for (const template of templates) {
          const candidate = path.resolve(base, template);
          const resolved = resolveFileOrDirectory(candidate);
          if (resolved) return resolved;
        }
      }
    }
  }
  return null;
}

function resolveFileOrDirectory(targetPath) {
  // Check if it exists exactly as specified
  if (fs.existsSync(targetPath)) {
    const stat = fs.statSync(targetPath);
    if (stat.isFile()) {
      return targetPath;
    }
    if (stat.isDirectory()) {
      // Try resolving index file inside the directory
      for (const ext of EXTENSIONS) {
        const indexFile = path.join(targetPath, 'index' + ext);
        if (fs.existsSync(indexFile) && fs.statSync(indexFile).isFile()) {
          return indexFile;
        }
      }
    }
  }

  // Try appending extensions
  for (const ext of EXTENSIONS) {
    const withExt = targetPath + ext;
    if (fs.existsSync(withExt) && fs.statSync(withExt).isFile()) {
      return withExt;
    }
  }

  return null;
}

module.exports = {
  loadPathsConfig,
  resolveImport
};
