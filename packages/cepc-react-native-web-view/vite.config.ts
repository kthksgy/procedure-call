import { resolve } from 'path';

import { defineConfig } from 'vite';

import { peerDependencies } from './package.json';

export default defineConfig(function () {
  return {
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        fileName: 'index',
        name: 'index',
      },
      outDir: 'lib',
      rollupOptions: {
        external: [...Object.keys(peerDependencies)],
        output: {
          globals: {
            ...Object.fromEntries(
              Object.keys(peerDependencies).map(function (key) {
                return [
                  key,
                  key.replace(/(?:^|-)(.)/g, function (_, character: string) {
                    return character.toUpperCase();
                  }),
                ];
              }),
            ),
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
});
