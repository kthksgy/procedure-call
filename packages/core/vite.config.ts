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
    },
    define: {
      /** バージョン(`package.json` `version`) */
      __version: JSON.stringify(process.env.npm_package_version),
    },
  };
});
