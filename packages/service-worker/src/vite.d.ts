/// <reference types="vite/client" />

/**
 * バージョン(`package.json` `version`)
 *
 * @requires vite.config.ts
 * ```
 * export default defineConfig({
 *   // ...
 *   define: {
 *     // ...
 *     __version: "'" + process.env.npm_package_version + "'",
 *     // ...
 *   },
 *   // ...
 * });
 * ```
 */
declare const __version: string;
