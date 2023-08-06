import { describe, expect, test } from 'vitest';

import {
  CHARACTERS,
  generateDuosexagesimalString,
  generateRandomString,
  generateTemplateLiteralString,
} from './utilities';

test('数字／英大文字／英小文字の文字数', function () {
  expect(CHARACTERS.length).toBe(10 + 26 * 2);
});

describe(`${generateDuosexagesimalString.name}`, function () {
  test.each([
    [0, '0'],
    [1, '1'],
    [61, 'z'],
    [62, '10'],
  ])(`${generateDuosexagesimalString.name}(%d) => "%s"`, function (n, s) {
    expect(generateDuosexagesimalString(n)).toBe(s);
  });
});

test(`${generateRandomString.name}: 0文字から64文字までの生成`, function () {
  expect(generateRandomString(0)).toBe('');
  expect(generateRandomString(-1)).toBe('');
  for (let length = 1; length <= 64; length++) {
    /** 正規表現 */
    const regularExpression = new RegExp(`^[0-9A-Za-z]{${length}}$`);
    for (let i = 0; i < 128; i++) {
      expect(generateRandomString(length)).toMatch(regularExpression);
    }
  }
});

describe(`${generateTemplateLiteralString.name}`, function () {
  test.each([
    ['', '``'],
    ['abc', '`abc`'],
    ['`', '`\\``'],
    ['\\', '`\\\\`'],
  ])(`${generateTemplateLiteralString.name}("%s") => "%s"`, function (inputValue, expectedValue) {
    expect(generateTemplateLiteralString(inputValue)).toBe(expectedValue);
  });
});
