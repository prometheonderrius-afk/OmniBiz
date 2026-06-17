import * as path from 'path';

/**
 * Normalizes a path to use forward slashes.
 */
function toForwardSlashes(p: string): string {
  return p.split(path.sep).join('/');
}

/**
 * Calculates a relative path and normalizes it to use forward slashes.
 */
function getRelativePath(fromDir: string, toAbsolute: string): string {
  const rel = path.relative(fromDir, toAbsolute);
  return toForwardSlashes(rel);
}

/**
 * Formats a relative path for Vite/ESLint (ensures leading `./` or `../`).
 */
function formatRelativePath(rel: string): string {
  if (rel === '') return '.';
  if (!rel.startsWith('.') && !rel.startsWith('/')) {
    return './' + rel;
  }
  return rel;
}

/**
 * Formats a relative path for Jest (prefixed with `<rootDir>`).
 */
function formatJestPath(rel: string): string {
  if (rel === '') return '<rootDir>';
  if (rel.startsWith('..')) {
    return `<rootDir>/${rel}`;
  }
  let clean = rel;
  if (clean.startsWith('./')) {
    clean = clean.substring(2);
  }
  return `<rootDir>/${clean}`;
}

/**
 * Generates the Vite resolve.alias config lines.
 */
export function generateViteAliases(
  paths: Record<string, string[]>,
  baseUrl: string,
  viteConfigPath: string
): string {
  const configDir = path.dirname(path.resolve(viteConfigPath));
  const lines: string[] = [];

  for (const [key, targets] of Object.entries(paths)) {
    if (!targets || targets.length === 0) continue;
    
    // Strip trailing /*
    const cleanKey = key.endsWith('/*') ? key.slice(0, -2) : key;
    const firstTarget = targets[0];
    const cleanTarget = firstTarget.endsWith('/*') ? firstTarget.slice(0, -2) : firstTarget;

    const absoluteTarget = path.resolve(baseUrl, cleanTarget);
    const relPath = formatRelativePath(getRelativePath(configDir, absoluteTarget));

    // Vite alias line: 'key': path.resolve(__dirname, 'relPath')
    lines.push(`'${cleanKey}': path.resolve(__dirname, '${relPath}'),`);
  }

  return lines.join('\n');
}

/**
 * Generates the Jest moduleNameMapper config lines.
 */
export function generateJestAliases(
  paths: Record<string, string[]>,
  baseUrl: string,
  jestConfigPath: string
): string {
  const configDir = path.dirname(path.resolve(jestConfigPath));
  const lines: string[] = [];

  for (const [key, targets] of Object.entries(paths)) {
    if (!targets || targets.length === 0) continue;

    const firstTarget = targets[0];

    if (key.endsWith('/*') && firstTarget.endsWith('/*')) {
      const cleanKey = key.slice(0, -2);
      const cleanTarget = firstTarget.slice(0, -2);

      const absoluteTarget = path.resolve(baseUrl, cleanTarget);
      const relPath = getRelativePath(configDir, absoluteTarget);
      const jestTarget = formatJestPath(relPath);

      // Jest regex mapping: '^cleanKey/(.*)$': 'jestTarget/$1'
      lines.push(`'^${cleanKey}/(.*)$': '${jestTarget}/$1',`);
    } else {
      // Exact mapping
      const absoluteTarget = path.resolve(baseUrl, firstTarget);
      const relPath = getRelativePath(configDir, absoluteTarget);
      const jestTarget = formatJestPath(relPath);

      // Jest exact mapping: '^key$': 'jestTarget'
      lines.push(`'^${key}$': '${jestTarget}',`);
    }
  }

  return lines.join('\n');
}

/**
 * Generates the ESLint import/resolver alias map config lines.
 */
export function generateEslintAliases(
  paths: Record<string, string[]>,
  baseUrl: string,
  eslintConfigPath: string
): string {
  const configDir = path.dirname(path.resolve(eslintConfigPath));
  const lines: string[] = [];

  for (const [key, targets] of Object.entries(paths)) {
    if (!targets || targets.length === 0) continue;

    // Strip trailing /*
    const cleanKey = key.endsWith('/*') ? key.slice(0, -2) : key;
    const firstTarget = targets[0];
    const cleanTarget = firstTarget.endsWith('/*') ? firstTarget.slice(0, -2) : firstTarget;

    const absoluteTarget = path.resolve(baseUrl, cleanTarget);
    const relPath = formatRelativePath(getRelativePath(configDir, absoluteTarget));

    // ESLint map line: ['key', 'relPath']
    lines.push(`['${cleanKey}', '${relPath}'],`);
  }

  return lines.join('\n');
}
