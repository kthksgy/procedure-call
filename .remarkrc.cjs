/**
 * @file remarkの設定ファイル
 * @version 1.0.4
 *
 * @tutorial VSCodeで使用している場合、変更を行った後は必ず再起動する。
 */

/*
# パッケージをインストールする。Yarnを使用する場合は`yarn add`にコマンドを変更する。
$ npm i -D remark@~14.0.3
*/

module.exports = {
  settings: {
    /** 順序なしリストの行頭記号。 */
    bullet: '-',
    /** コードブロックを常にバッククォーテーションかチルダで挟む。 */
    fences: true,
    /** リストのインデントサイズ。 */
    listItemIndent: 'one',
  },
};
