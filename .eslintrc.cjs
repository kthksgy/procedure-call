/**
 * @file ESLintの設定ファイル
 * @version 1.3.0
 *
 * @tutorial VSCodeで使用している場合、変更を行った後は必ず再起動する。
 */

/*
# 必須のパッケージをインストールする。Yarnを使用する場合は`yarn add`にコマンドを変更する。
$ npm i -D \
  '@typescript-eslint/eslint-plugin@~6.2.1' \
  '@typescript-eslint/parser@~6.2.1' \
  'confusing-browser-globals@~1.0.11' \
  'eslint@~8.46.0' \
  'eslint-config-prettier@~8.10.0' \
  'eslint-import-resolver-typescript@~3.5.5' \
  'eslint-plugin-import@~2.26.0'

# Reactを使用する場合はインストールする。
$ npm i -D 'eslint-plugin-react@~7.33.1' 'eslint-plugin-react-hooks@~4.6.0'

# Storybookを使用する場合はインストールする。
$ npm i -D 'eslint-plugin-storybook@~0.6.13'
*/

const fs = require('fs');
const path = require('path');

// パッケージ固有設定の有効化フラグを算出する。

/** `react-native`がインストールされている場合、`true` */
const reactNative = fs.existsSync(path.join(__dirname, 'node_modules', 'react-native'));
/** `eslint-plugin-react`がインストールされている場合、`true` */
const eslintPluginReact = fs.existsSync(
  path.join(__dirname, 'node_modules', 'eslint-plugin-react'),
);
/** `eslint-plugin-react-hooks`がインストールされている場合、`true` */
const eslintPluginReactHooks = fs.existsSync(
  path.join(__dirname, 'node_modules', 'eslint-plugin-react-hooks'),
);
/** `eslint-plugin-storybook`がインストールされている場合、`true` */
const estlintPluginStorybook = fs.existsSync(
  path.join(__dirname, 'node_modules', 'eslint-plugin-storybook'),
);

/** 間違えやすいまたは`window.`修飾子無しでの使用が推奨されないブラウザグローバル変数 */
const restrictedGlobals = require('confusing-browser-globals');

module.exports = {
  env: {
    /** ブラウザのグローバル変数の追加 */
    browser: true,
    /** ECMAScript 2022のグローバル変数の追加 */
    es2022: true,
    /** Node.jsのグローバル変数とスコーピングの追加 */
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:import/recommended',
    ...(eslintPluginReact ? ['plugin:react/recommended', 'plugin:react/jsx-runtime'] : []),
    ...(eslintPluginReactHooks ? ['plugin:react-hooks/recommended'] : []),
    'prettier',
  ],
  overrides: [
    ...(estlintPluginStorybook
      ? [
          {
            files: ['**/*.stories.{js?(x),ts?(x)}'],
            extends: ['plugin:storybook/recommended', 'prettier'],
          },
        ]
      : []),

    {
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:import/typescript',
        ...(eslintPluginReact ? ['plugin:react/recommended', 'plugin:react/jsx-runtime'] : []),
        ...(eslintPluginReactHooks ? ['plugin:react-hooks/recommended'] : []),
        'prettier',
      ],
      files: ['**/*.ts?(x)'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint', 'import'],
      rules: {
        // -----------------------------------------------------------------------------------------
        // ESLintのルール
        // https://eslint.org/docs/latest/rules/
        // -----------------------------------------------------------------------------------------

        /** @description `tsconfig.json`の`noFallthroughCasesInSwitch`を利用する。 */
        'default-case': 'off',

        // -----------------------------------------------------------------------------------------
        // TypeScript ESLintのルール
        // https://typescript-eslint.io/rules/
        // -----------------------------------------------------------------------------------------

        /** 空の関数を作成しない。 */
        '@typescript-eslint/no-empty-function': 'off',
        /** `any`型を明示的に使用しない。 */
        '@typescript-eslint/no-explicit-any': 'off',
        /** 値から推論可能な型を宣言しない。 */
        '@typescript-eslint/no-inferrable-types': 'off',
        /** 未使用の変数を禁止する。 */
        '@typescript-eslint/no-unused-vars': [
          'warn',
          {
            /** 関数の引数の設定。 */
            args: 'none',
            /** スプレッド構文を用いたプロパティ省略のための定義は無視する。 */
            ignoreRestSiblings: true,
          },
        ],

        // -----------------------------------------------------------------------------------------
        // `eslint-plugin-import`のルール
        // https://github.com/import-js/eslint-plugin-import#rules
        // -----------------------------------------------------------------------------------------

        /** 解決できないインポートをしない。 */
        'import/no-unresolved': 'off', // TypeScriptが行う。

        // -----------------------------------------------------------------------------------------
        // `eslint-plugin-react`のルール
        // https://github.com/jsx-eslint/eslint-plugin-react#list-of-supported-rules
        // -----------------------------------------------------------------------------------------

        /** PropTypesを用いてReactコンポーネントプロパティの型を設定する。 */
        'react/prop-types': 'off',
      },
    },
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    // /** ECMAScript構文のバージョン */
    // ecmaVersion: 'latest', // `env.es**** = true`の設定で自動設定される。
    sourceType: 'module',
  },
  plugins: ['import'],
  /** 未使用のESLint無効化コメントを報告する。 */
  reportUnusedDisableDirectives: true,
  /** 上位のESLint設定ファイルを無視する。 */
  root: true,
  rules: {
    // -----------------------------------------------------------------------------------------
    // ESLintのルール
    // https://eslint.org/docs/latest/rules/
    // -----------------------------------------------------------------------------------------

    /** 必要な場合、配列のコールバック関数の`return`を書く。 */
    'array-callback-return': 'warn',
    /** `switch`文で`default`節を記述する。 */
    'default-case': 'warn',
    /** プロパティ参照時のドットの位置を規定する。 */
    'dot-location': ['warn', 'property'],
    /** 厳密等価演算子を使用する。 */
    eqeqeq: ['error', 'smart'],
    /** 引数無しのコンストラクタにも空の括弧を挿入する。 */
    'new-parens': 'error',
    /** 配列要素を引数にした配列のコンストラクタ(`new Array(a, b, c)`)は使わない。 */
    'no-array-constructor': 'warn',
    /** `arguments.caller`と`arguments.callee`を使用しない。 */
    'no-caller': 'error',
    /** 同じファイルからのインポートをまとめる。 */
    'no-duplicate-imports': 'off', // `import/no-duplicates`を使用する。
    /** `eval()`を使用しない。 */
    'no-eval': 'error',
    /** ビルトインやネイティブのオブジェクトを拡張しない。 */
    'no-extend-native': 'error',
    /** 冗長な`bind()`を使用しない。 */
    'no-extra-bind': 'warn',
    /** 冗長なラベルを使用しない。 */
    'no-extra-label': 'warn',
    /** 特定の関数で可能な`eval()`ライクな処理をしない。 */
    'no-implied-eval': 'error',
    /** `__iterator__`プロパティを使用しない。 */
    'no-iterator': 'error',
    /** 変数とラベルで同じ名前を使用しない。 */
    'no-label-var': 'error',
    /** 冗長なブロックを作成しない。 */
    'no-lone-blocks': 'warn',
    /** ループ内で安全でない参照を持つ関数を作成しない。 */
    'no-loop-func': 'error',
    /** 複雑な数式には括弧を付けて優先順位を明確にする。 */
    'no-mixed-operators': 'warn',
    /** 複数行の文字列リテラルを使用しない。 */
    'no-multi-str': 'error',
    /** `Function`クラスに対して`new`演算子を使用しない。 */
    'no-new-func': 'error',
    /** `Object`クラスのコンストラクタを使用しない。 */
    'no-new-object': 'error',
    /** `String`クラス／`Number`クラス／`Boolean`クラスに対して`new`演算子を使用しない。 */
    'no-new-wrappers': 'error',
    /** 文字列リテラル内で8進エスケープシーケンスを使用しない。 */
    'no-octal-escape': 'error',
    /** `__proto__`プロパティを使用しない。 */
    'no-proto': 'error',
    /** 非推奨のグローバル変数を規定する。 */
    'no-restricted-globals': ['error'].concat(restrictedGlobals),
    /** `javascript:`URLを使用しない。 */
    'no-script-url': 'error',
    /** 同じ変数同士を比較しない。 */
    'no-self-compare': 'error',
    /** カンマ演算子を使用しない。 */
    'no-sequences': 'error',
    /** テンプレートリテラル内ではなく文字列リテラル内で`${x}`構文を使用しない。 */
    'no-template-curly-in-string': 'warn',
    /** 例外としてリテラルをスローしない。 */
    'no-throw-literal': 'error',
    /** 1度しか実行されないループを使用しない。 */
    'no-unreachable-loop': 'error',
    /** プログラムの状態に影響を与えない未使用の式を禁止する。 */
    'no-unused-expressions': [
      'error',
      {
        /** 短絡評価は許可する。 */
        allowShortCircuit: true,
        /** 三項演算子は許可する。 */
        allowTernary: true,
        /** タグ付きテンプレートリテラルは許可する。 */
        allowTaggedTemplates: true,
      },
    ],
    /** 未使用の変数を禁止する。 */
    'no-unused-vars': [
      'warn',
      {
        /** 関数の引数の設定。 */
        args: 'none',
        /** スプレッド構文を用いたプロパティ省略のための定義は無視する。 */
        ignoreRestSiblings: true,
      },
    ],
    /** 冗長な計算プロパティ名を禁止する。 */
    'no-useless-computed-key': 'warn',
    /** 冗長なリテラルの連結を禁止する。 */
    'no-useless-concat': 'warn',
    /** 空のコンストラクタを禁止する。 */
    'no-useless-constructor': 'warn',
    /** 同じ名前へのリネームを禁止する。 */
    'no-useless-rename': 'warn',
    /** プロパティの前にスペースを挿入しない。 */
    'no-whitespace-before-property': 'warn',
    /** スプレッド構文の`...`と変数名の間にスペースを挿入する。 */
    'rest-spread-spacing': ['warn', 'never'],
    /** インポートの順番を規定する。 */
    'sort-imports': [
      'warn',
      {
        /** デフォルトインポートをソートしない。 */
        ignoreDeclarationSort: true,
        /** 連続するインポート行の順番のみ考慮する。 */
        allowSeparatedGroups: true,
      },
    ],
    /** 厳格モード構文(`"use strict";`)を挿入する。 */
    strict: ['warn', 'never'],
    /** Unicode Byte Order Markを挿入する。 */
    'unicode-bom': ['warn', 'never'],

    // ---------------------------------------------------------------------------------------------
    // `eslint-plugin-import`のルール
    // https://github.com/import-js/eslint-plugin-import#rules
    // ---------------------------------------------------------------------------------------------

    /** デフォルトエクスポートが存在しないファイルからデフォルトインポートしない。 */
    'import/default': 'off',
    /** ファイル先頭以外でインポートしない。 */
    'import/first': 'warn',
    /** インポートの後に空行を挿入する。 */
    'import/newline-after-import': ['warn', { count: 1 }],
    /** AMDの`require()`と`define()`を禁止する。 */
    'import/no-amd': 'error',
    /** 循環インポートを禁止する。 */
    'import/no-cycle': 'error',
    /** 名前付きエクスポートされた名前と同じ名前でデフォルトエクスポートのプロパティを参照しない。 */
    'import/no-named-as-default-member': 'off',
    /** 自己インポートを禁止する。 */
    'import/no-self-import': 'error',
    /** 不要なパスセグメントを省く。 */
    'import/no-useless-path-segments': 'warn',
    /** webpackのローダー構文を禁止する。 */
    'import/no-webpack-loader-syntax': 'error',
    /** インポートの順番を規定する。 */
    'import/order': [
      'warn',
      {
        alphabetize: {
          /** ソート順。 */
          order: 'asc',
          /** 大文字と小文字を区別しない。 */
          caseInsensitive: false,
        },
        groups: [
          /**
           * Node.jsビルトインインポート
           * @example `import fs from 'fs';`
           */
          'builtin',
          /**
           * 外部インポート
           * @example `import _ from 'lodash';`
           * @example `import chalk from 'chalk';`
           */
          'external',
          /**
           * 内部インポート
           * @example `import { a } from 'local/internal';`
           */
          'internal',
          /**
           * 相対インポート(親)
           * @example `import { a } from '../parent';`
           */
          'parent',
          /**
           * 相対インポート(兄弟)
           * @example `import { a } from './sibling';`
           */
          'sibling',
          /**
           * インデックスインポート
           * @example `import { a } from './';`
           */
          'index',
          /**
           * オブジェクトインポート
           * @example `import log = console.log;`
           */
          'object',
          /**
           * 型インポート
           * @example `import type { Type } from 'types';`
           */
          'type',
          /**
           * 不明なインポート
           */
          'unknown',
        ],
        /** グループ間の改行。 */
        'newlines-between': 'always',
        pathGroups: [
          {
            pattern: '~/**',
            group: 'internal',
            position: 'before',
          },
        ],
      },
    ],

    // ---------------------------------------------------------------------------------------------
    // `eslint-plugin-react`のルール
    // https://github.com/jsx-eslint/eslint-plugin-react#list-of-supported-rules
    // ---------------------------------------------------------------------------------------------
    ...(eslintPluginReact && {
      /** 他のコンポーネントの`propTypes`プロパティを参照しない。 */
      'react/forbid-foreign-prop-types': ['warn', { allowInPropTypes: true }],
      /** `boolean`型の属性をJSXで指定する場合、`={true}`を省略する。 */
      'react/jsx-boolean-value': 'warn',
      /** コンポーネント名は`PascalCase`で命名する。 */
      'react/jsx-pascal-case': [
        'warn',
        {
          allowAllCaps: true,
        },
      ],
      /** コンポーネントプロパティの順番を規定する。 */
      'react/jsx-sort-props': 'warn',
      /** コンポーネントの`style`プロパティをオブジェクトで指定する。 */
      'react/style-prop-object': reactNative ? 'off' : 'warn',
    }),
  },
  settings: {
    'import/extensions': ['.js', '.jsx', '.ts', '.tsx'],
    'import/ignore': [...(reactNative ? ['react-native'] : [])],
    'import/resolver': { node: true, typescript: true },
    ...(eslintPluginReact && { react: { version: 'detect' } }),
  },
};
