/**
 * @file Prettierの設定ファイル
 * @version 1.1.5
 *
 * @tutorial VSCodeで使用している場合、変更を行った後は必ず再起動する。
 *
 * @see https://prettier.io/docs/en/options.html
 */

/*
# パッケージをインストールする。Yarnを使用する場合は`yarn add`にコマンドを変更する。
$ npm i -D 'prettier@~3.2.5'
*/

module.exports = {
  /** アロー関数の括弧の引数に括弧を付ける。 */
  arrowParens: 'always',
  /** 複数行のHTML要素の閉じ括弧を最後の行の末尾に挿入する。 */
  bracketSameLine: false,
  /** オブジェクトリテラルの括弧の間にスペースを挿入する。 */
  bracketSpacing: true,
  /** 改行コード */
  endOfLine: 'lf',
  /** JSX内でダブルクォーテーションの代わりにシングルクォーテーションを使用する。 */
  jsxSingleQuote: false,
  /** 1行の最大文字数 */
  printWidth: 100,
  /** オブジェクトのプロパティ名をクォーテーションで囲む。 */
  quoteProps: 'as-needed',
  /** 文の最後にセミコロンを挿入する。 */
  semi: true,
  /** ダブルクォーテーションの代わりにシングルクォーテーションを使用する。 */
  singleQuote: true,
  /** 末尾のカンマのスタイル */
  trailingComma: 'all',
  /** インデント1段階に対応する半角スペース数 */
  tabWidth: 2,
  /** インデントとして半角スペースの代わりにタブを使用する。 */
  useTabs: false,
};
