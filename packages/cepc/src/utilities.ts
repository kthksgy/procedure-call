/** 文字 */
export const CHARACTERS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * 62進数文字列を生成する。
 * @param x 10進数
 * @returns 62進数文字列
 */
export function generateDuosexagesimalString(x: number) {
  /** 文字 */
  const characters = [];
  for (; x > 0; x = Math.floor(x / CHARACTERS.length)) {
    characters.unshift(CHARACTERS.at(x % CHARACTERS.length));
  }
  return characters.length > 0 ? characters.join('') : '0';
}

/**
 * 乱文字列
 * @param length 文字数
 * @returns 乱文字列
 */
export function generateRandomString(length: number) {
  return Array.from({ length: Math.max(length, 0) })
    .map(function () {
      return CHARACTERS[Math.floor(CHARACTERS.length * Math.random())];
    })
    .join('');
}

/**
 * テンプレートリテラル文字列を生成する。
 * @param s 文字列
 * @returns テンプレートリテラル文字列
 */
export function generateTemplateLiteralString(s: string) {
  return ('`'
   + s.replaceAll('\\', '\\\\').replaceAll('`', '\\`')
    + '`');
}
