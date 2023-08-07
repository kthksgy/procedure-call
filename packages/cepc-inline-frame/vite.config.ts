import { existsSync, readFileSync, statSync } from 'fs';
import { resolve } from 'path';

import { defineConfig } from 'vite';

import type { UserConfig as ViteConfiguration } from 'vite';
import type { UserConfig as VitestConfiguration } from 'vitest';

/** `UpperCamelCase`に変換する。 */
function upperCamelCase(s: string) {
  return s.replace(/(?:^|-|_)([^\-_]*)/g, function (_, part: string) {
    return part.length > 0
      ? part.charAt(0).toUpperCase() +
          (/^[0-9A-Z]*$/.test(part) ? part.slice(1).toLowerCase() : part.slice(1))
      : '';
  });
}

export default defineConfig(function () {
  /** `package.json`のパス */
  const libraryPath = resolve(__dirname, 'package.json');
  /** `package.json` */
  let library: { name: string; peerDependencies?: Partial<Record<string, string>> };
  if (existsSync(libraryPath) && statSync(libraryPath).isFile()) {
    library = JSON.parse(readFileSync(libraryPath, 'utf8'));
    if (typeof library.name !== 'string' || library.name.length === 0) {
      throw new Error('`name` is required.');
    }
    if (
      (typeof library.peerDependencies !== 'object' || library.peerDependencies === null) &&
      library.peerDependencies !== undefined
    ) {
      throw new Error('`peerDependencies` is invalid.');
    }
  } else {
    throw new Error(`\`${libraryPath}\` does not exist.`);
  }

  /** 設定 */
  const configuration: ViteConfiguration & VitestConfiguration = {
    build: {
      lib: {
        entry: resolve(__dirname, 'src', 'index.ts'),
        fileName: 'index',
        name: upperCamelCase(library.name),
      },
      outDir: 'lib',
      rollupOptions: {
        external: [...(library?.peerDependencies ? Object.keys(library.peerDependencies) : [])],
        output: {
          globals: {
            ...(library?.peerDependencies
              ? Object.fromEntries(
                  Object.keys(library?.peerDependencies).map(function (key) {
                    return [key, upperCamelCase(key)];
                  }),
                )
              : {}),
          },
        },
      },
      sourcemap: true,
    },

    define: {
      /** バージョン(`package.json` `version`) */
      __version: `'${process.env.npm_package_version}'`,
      // `if(import.meta.vitest) { ... }`を削除する。
      'import.meta.vitest': 'undefined',
    },

    test: {
      includeSource: ['src/**/*.{js,ts}'],
    },
  };

  console.debug(JSON.stringify(configuration, null, 2));

  return configuration;
});
