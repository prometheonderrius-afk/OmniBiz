import * as ts from 'typescript';
import * as path from 'path';

export interface TsConfigPaths {
  baseUrl: string;
  paths: Record<string, string[]>;
}

/**
 * Parses a tsconfig.json file, recursively resolving any extended configs,
 * and extracts the resolved `baseUrl` and `paths` configuration.
 */
export function parseTsConfig(configPath: string): TsConfigPaths {
  const absolutePath = path.resolve(configPath);
  const configDir = path.dirname(absolutePath);

  const readResult = ts.readConfigFile(absolutePath, ts.sys.readFile);
  if (readResult.error) {
    const message = ts.flattenDiagnosticMessageText(readResult.error.messageText, '\n');
    throw new Error(`Failed to read tsconfig at ${configPath}: ${message}`);
  }

  const parsed = ts.parseJsonConfigFileContent(
    readResult.config,
    ts.sys,
    configDir,
    undefined,
    absolutePath
  );

  // Default baseUrl to the tsconfig directory if not specified
  const resolvedBaseUrl = parsed.options.baseUrl ? path.resolve(parsed.options.baseUrl) : configDir;

  return {
    baseUrl: resolvedBaseUrl,
    paths: parsed.options.paths || {}
  };
}
