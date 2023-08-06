import { resolve } from 'path';

import { defineConfig } from 'vite';

export default defineConfig(function () {
  return {
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        fileName: 'index',
        name: 'index',
      },
      outDir: 'lib',
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
