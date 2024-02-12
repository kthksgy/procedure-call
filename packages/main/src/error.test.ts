import { describe, expect, test } from 'vitest';

import { PROCEDURE_CALL_ERROR_CODE, ProcedureCallError } from './error';

describe('定数定義', function () {
  test.each([
    [PROCEDURE_CALL_ERROR_CODE.INTERNAL, 'PROCEDURE_CALL_INTERNAL'],
    [PROCEDURE_CALL_ERROR_CODE.TIMEOUT, 'PROCEDURE_CALL_TIMEOUT'],
    [PROCEDURE_CALL_ERROR_CODE.UNDEFINED, 'PROCEDURE_CALL_UNDEFINED'],
    [PROCEDURE_CALL_ERROR_CODE.UNINITIALIZED, 'PROCEDURE_CALL_UNINITIALIZED'],
  ])('"%s" = "%s"', function (actualValue, expectedValue) {
    expect(actualValue).toBe(expectedValue);
  });
});

describe(`${ProcedureCallError.name}`, function () {
  test('インスタンス化', function () {
    /** エラー */
    const error = new ProcedureCallError();

    expect(error).toBeInstanceOf(ProcedureCallError);
    expect(error.cause).toBe(undefined);
    expect(error.code).toBe('');
    expect(error.data).toBe(undefined);
    expect(error.message).toBe('');
  });

  test('インスタンス化(フルオプション)', function () {
    /** 原因 */
    const cause = new Error();
    /** エラー */
    const error = new ProcedureCallError('abc', 'メッセージです。', { cause, data: { a: 1 } });

    expect(error).toBeInstanceOf(ProcedureCallError);
    expect(error.cause).toBe(cause);
    expect(error.code).toBe('abc');
    expect(error.data).toStrictEqual({ a: 1 });
    expect(error.message).toBe('メッセージです。');
  });
});
