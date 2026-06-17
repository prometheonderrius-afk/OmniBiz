import * as fs from 'fs';
import * as path from 'path';

/**
 * Replaces the content between the start and end markers inside a file's content,
 * preserving line endings and indentation.
 */
export function syncFileContent(
  content: string,
  newLines: string,
  startMarker = '// @alias-sync-start',
  endMarker = '// @alias-sync-end'
): { content: string; updated: boolean } {
  const isCrlf = content.includes('\r\n');
  const lineEnding = isCrlf ? '\r\n' : '\n';
  const lines = content.split(/\r?\n/);

  let startIndex = -1;
  let endIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.includes(startMarker)) {
      startIndex = i;
    } else if (trimmed.includes(endMarker)) {
      endIndex = i;
      break;
    }
  }

  if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
    return { content, updated: false };
  }

  // Detect indentation from the start marker line
  const startLine = lines[startIndex];
  const indentMatch = startLine.match(/^(\s*)/);
  const indent = indentMatch ? indentMatch[1] : '';

  // Format new lines with indentation
  const formattedNewLines = newLines
    .split('\n')
    .map(line => (line.trim() ? indent + '  ' + line : ''))
    .join(lineEnding);

  const before = lines.slice(0, startIndex + 1);
  const after = lines.slice(endIndex);

  const updatedContent = [...before, formattedNewLines, ...after].join(lineEnding);

  return { content: updatedContent, updated: true };
}

/**
 * Attempts to automatically inject comment markers into configuration files
 * based on standard config formats.
 */
export function injectMarkers(content: string, type: 'vite' | 'jest' | 'eslint'): { content: string; injected: boolean } {
  if (content.includes('@alias-sync-start') && content.includes('@alias-sync-end')) {
    return { content, injected: false };
  }

  const isCrlf = content.includes('\r\n');
  const nl = isCrlf ? '\r\n' : '\n';

  let updated = content;

  if (type === 'vite') {
    if (/alias:\s*\{/.test(content)) {
      updated = content.replace(/(alias:\s*\{)/, `$1${nl}      // @alias-sync-start${nl}      // @alias-sync-end`);
    } else if (/resolve:\s*\{/.test(content)) {
      updated = content.replace(/(resolve:\s*\{)/, `$1${nl}    alias: {${nl}      // @alias-sync-start${nl}      // @alias-sync-end${nl}    },`);
    } else if (/defineConfig\(\s*\{/.test(content)) {
      updated = content.replace(/(defineConfig\(\s*\{)/, `$1${nl}  resolve: {${nl}    alias: {${nl}      // @alias-sync-start${nl}      // @alias-sync-end${nl}    }${nl}  },`);
    }
  } else if (type === 'jest') {
    if (/moduleNameMapper:\s*\{/.test(content)) {
      updated = content.replace(/(moduleNameMapper:\s*\{)/, `$1${nl}    // @alias-sync-start${nl}    // @alias-sync-end`);
    } else if (/module\.exports\s*=\s*\{/.test(content)) {
      updated = content.replace(/(module\.exports\s*=\s*\{)/, `$1${nl}  moduleNameMapper: {${nl}    // @alias-sync-start${nl}    // @alias-sync-end${nl}  },`);
    } else if (/export\s+default\s*\{/.test(content)) {
      updated = content.replace(/(export\s+default\s*\{)/, `$1${nl}  moduleNameMapper: {${nl}    // @alias-sync-start${nl}    // @alias-sync-end${nl}  },`);
    }
  } else if (type === 'eslint') {
    if (/map:\s*\[/.test(content)) {
      updated = content.replace(/(map:\s*\[)/, `$1${nl}            // @alias-sync-start${nl}            // @alias-sync-end`);
    } else if (/alias:\s*\{/.test(content)) {
      updated = content.replace(/(alias:\s*\{)/, `$1${nl}        map: [${nl}          // @alias-sync-start${nl}          // @alias-sync-end${nl}        ],`);
    } else if (/settings:\s*\{/.test(content)) {
      updated = content.replace(/(settings:\s*\{)/, `$1${nl}    'import/resolver': {${nl}      alias: {${nl}        map: [${nl}          // @alias-sync-start${nl}          // @alias-sync-end${nl}        ]${nl}      }${nl}    },`);
    }
  }

  return {
    content: updated,
    injected: updated !== content
  };
}
