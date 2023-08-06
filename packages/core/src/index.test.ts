import { beforeEach, describe, expect, test } from 'vitest';

import {
  CEPC_ERROR_CODE_INTERNAL,
  CEPC_ERROR_CODE_TIMEOUT,
  CEPC_ERROR_CODE_UNDEFINED,
  CEPC_ERROR_CODE_UNINITIALIZED,
  CEPC_PAYLOAD_STRING_PREFIX,
  CEPC_PROTOCOL,
  CepcError,
  NAME,
  VERSION,
  isDefaultProcedureRegistered,
  isProcedureRegistered,
  registerDefaultProcedure,
  registerProcedure,
  reset,
} from './index';

describe('定数定義', function () {
  test.each([
    [CEPC_ERROR_CODE_INTERNAL, 'CEPC_INTERNAL'],
    [CEPC_ERROR_CODE_TIMEOUT, 'CEPC_TIMEOUT'],
    [CEPC_ERROR_CODE_UNDEFINED, 'CEPC_UNDEFINED'],
    [CEPC_ERROR_CODE_UNINITIALIZED, 'CEPC_UNINITIALIZED'],
    [CEPC_PAYLOAD_STRING_PREFIX, 'cepc::'],
    [CEPC_PROTOCOL, 'cepc'],
    [NAME, 'CEPC'],
    [VERSION, __version],
  ])('"%s" = "%s"', function (actualValue, expectedValue) {
    expect(actualValue).toBe(expectedValue);
  });
});

describe(`${CepcError.name}`, function () {
  test('インスタンス化', function () {
    /** 原因 */
    const cause = new Error();
    /** エラー */
    const error = new CepcError('abc', 'メッセージです。', { cause, data: { a: 1 } });

    expect(error).toBeInstanceOf(CepcError);
    expect(error.cause).toBe(cause);
    expect(error.code).toBe('abc');
    expect(error.data).toStrictEqual({ a: 1 });
    expect(error.message).toBe('メッセージです。');
  });
});

test(`${isDefaultProcedureRegistered.name}`, function () {
  reset();

  /** 手続き名 */
  const procedureName = 'procedure';
  /** 手続き */
  async function procedure() {
    return true;
  }

  expect(isDefaultProcedureRegistered()).toBe(false);
  expect(isDefaultProcedureRegistered(procedureName)).toBe(false);
  expect(isDefaultProcedureRegistered(undefined, procedure)).toBe(false);

  /** 登録を解除する。 */
  const unregister = registerDefaultProcedure(procedureName, procedure);

  expect(isDefaultProcedureRegistered()).toBe(false);
  expect(isDefaultProcedureRegistered(procedureName)).toBe(true);
  expect(isDefaultProcedureRegistered(procedureName, procedure)).toBe(true);
  expect(isDefaultProcedureRegistered(undefined, procedure)).toBe(true);

  unregister();

  expect(isDefaultProcedureRegistered(procedureName)).toBe(false);
  expect(isDefaultProcedureRegistered(undefined, procedure)).toBe(false);
});

test(`${isProcedureRegistered.name}`, function () {
  reset();

  /** 手続き名 */
  const procedureName = 'procedure';
  /** 手続き */
  async function procedure() {
    return true;
  }

  expect(isProcedureRegistered()).toBe(false);
  expect(isProcedureRegistered(procedureName)).toBe(false);
  expect(isProcedureRegistered(undefined, procedure)).toBe(false);

  /** 登録を解除する。 */
  const unregister = registerProcedure(procedureName, procedure);

  expect(isProcedureRegistered()).toBe(false);
  expect(isProcedureRegistered(procedureName)).toBe(true);
  expect(isProcedureRegistered(procedureName, procedure)).toBe(true);
  expect(isProcedureRegistered(undefined, procedure)).toBe(true);

  unregister();

  expect(isProcedureRegistered()).toBe(false);
  expect(isProcedureRegistered(procedureName)).toBe(false);
  expect(isProcedureRegistered(undefined, procedure)).toBe(false);
});

describe(`${registerDefaultProcedure.name}`, function () {
  /** 手続き名 */
  const procedureName = 'procedure';
  /** 手続き */
  async function procedure() {
    return true;
  }
  /** 手続き1 */
  async function procedure1() {
    return true;
  }
  /** 手続き2 */
  async function procedure2() {
    return true;
  }
  /** 既定の手続き */
  async function defaultProcedure() {
    return true;
  }

  beforeEach(function () {
    reset();
  });

  test('登録と登録解除', function () {
    /** 登録を解除する。 */
    const unregister = registerDefaultProcedure(procedureName, procedure);
    expect(isDefaultProcedureRegistered(procedureName, procedure)).toBe(true);
    expect(isProcedureRegistered(procedureName, procedure)).toBe(true);

    unregister();
    expect(isDefaultProcedureRegistered(procedureName)).toBe(false);
    expect(isProcedureRegistered(procedureName)).toBe(false);
  });

  test('上書き', function () {
    /** 登録を解除する。 */
    const unregister1 = registerDefaultProcedure(procedureName, procedure1);
    expect(isDefaultProcedureRegistered(procedureName, procedure1)).toBe(true);
    expect(isDefaultProcedureRegistered(procedureName, procedure2)).toBe(false);
    expect(isProcedureRegistered(procedureName, procedure1)).toBe(true);
    expect(isProcedureRegistered(procedureName, procedure2)).toBe(false);

    /** 登録を解除する。 */
    const unregister2 = registerDefaultProcedure(procedureName, procedure2);
    expect(isDefaultProcedureRegistered(procedureName, procedure1)).toBe(false);
    expect(isDefaultProcedureRegistered(procedureName, procedure2)).toBe(true);
    expect(isProcedureRegistered(procedureName, procedure1)).toBe(false);
    expect(isProcedureRegistered(procedureName, procedure2)).toBe(true);

    unregister1();
    expect(isDefaultProcedureRegistered(procedureName, procedure1)).toBe(false);
    expect(isDefaultProcedureRegistered(procedureName, procedure2)).toBe(true);
    expect(isProcedureRegistered(procedureName, procedure1)).toBe(false);
    expect(isProcedureRegistered(procedureName, procedure2)).toBe(true);

    unregister2();
    expect(isDefaultProcedureRegistered(procedureName)).toBe(false);
    expect(isProcedureRegistered(procedureName)).toBe(false);
  });

  test('手続きが登録されている場合の登録と登録解除', function () {
    registerProcedure(procedureName, procedure);

    /** 登録を解除する。 */
    const unregister = registerDefaultProcedure(procedureName, defaultProcedure);
    expect(isDefaultProcedureRegistered(procedureName, defaultProcedure)).toBe(true);
    expect(isProcedureRegistered(procedureName, defaultProcedure)).toBe(false);
    expect(isProcedureRegistered(procedureName, procedure)).toBe(true);

    unregister();
    expect(isDefaultProcedureRegistered(procedureName)).toBe(false);
    expect(isProcedureRegistered(procedureName, defaultProcedure)).toBe(false);
    expect(isProcedureRegistered(procedureName, procedure)).toBe(true);
  });

  test('登録後に手続きが登録された場合の登録解除', function () {
    /** 登録を解除する。 */
    const unregister = registerDefaultProcedure(procedureName, defaultProcedure);
    expect(isDefaultProcedureRegistered(procedureName, defaultProcedure)).toBe(true);
    expect(isProcedureRegistered(procedureName, defaultProcedure)).toBe(true);
    expect(isProcedureRegistered(procedureName, procedure)).toBe(false);

    registerProcedure(procedureName, procedure);
    expect(isProcedureRegistered(procedureName, defaultProcedure)).toBe(false);
    expect(isProcedureRegistered(procedureName, procedure)).toBe(true);

    unregister();
    expect(isDefaultProcedureRegistered(procedureName)).toBe(false);
    expect(isProcedureRegistered(procedureName, defaultProcedure)).toBe(false);
    expect(isProcedureRegistered(procedureName, procedure)).toBe(true);
  });
});

describe(`${registerProcedure.name}`, function () {
  /** 手続き名 */
  const procedureName = 'procedure';
  /** 手続き */
  async function procedure() {
    return true;
  }
  /** 手続き1 */
  async function procedure1() {
    return true;
  }
  /** 手続き2 */
  async function procedure2() {
    return true;
  }
  /** 既定の手続き */
  async function defaultProcedure() {
    return true;
  }

  beforeEach(function () {
    reset();
  });

  test('登録と登録解除', function () {
    /** 登録を解除する。 */
    const unregister = registerProcedure(procedureName, procedure);
    expect(isProcedureRegistered(procedureName, procedure)).toBe(true);

    unregister();
    expect(isProcedureRegistered(procedureName)).toBe(false);
  });

  test('既定の手続きに影響しない', function () {
    /** 登録を解除する。 */
    const unregister1 = registerProcedure(procedureName, procedure);
    expect(isDefaultProcedureRegistered(procedureName)).toBe(false);

    unregister1();
    expect(isDefaultProcedureRegistered(procedureName)).toBe(false);

    registerDefaultProcedure(procedureName, defaultProcedure);

    /** 登録を解除する。 */
    const unregister2 = registerProcedure(procedureName, procedure);
    expect(isDefaultProcedureRegistered(procedureName, defaultProcedure)).toBe(true);
    expect(isDefaultProcedureRegistered(procedureName, procedure)).toBe(false);

    unregister2();
    expect(isDefaultProcedureRegistered(procedureName, defaultProcedure)).toBe(true);
    expect(isDefaultProcedureRegistered(procedureName, procedure)).toBe(false);
  });

  test('上書き', function () {
    /** 登録を解除する。 */
    const unregister1 = registerProcedure(procedureName, procedure1);
    expect(isProcedureRegistered(procedureName, procedure1)).toBe(true);
    expect(isProcedureRegistered(procedureName, procedure2)).toBe(false);

    /** 登録を解除する。 */
    const unregister2 = registerProcedure(procedureName, procedure2);
    expect(isProcedureRegistered(procedureName, procedure1)).toBe(false);
    expect(isProcedureRegistered(procedureName, procedure2)).toBe(true);

    unregister1();
    expect(isProcedureRegistered(procedureName, procedure1)).toBe(false);
    expect(isProcedureRegistered(procedureName, procedure2)).toBe(true);

    unregister2();
    expect(isProcedureRegistered(procedureName)).toBe(false);
  });

  test('既定の手続きの復元', function () {
    registerDefaultProcedure(procedureName, defaultProcedure);

    /** 登録を解除する。 */
    const unregister = registerProcedure(procedureName, procedure);
    expect(isProcedureRegistered(procedureName, defaultProcedure)).toBe(false);
    expect(isProcedureRegistered(procedureName, procedure)).toBe(true);

    unregister();
    expect(isProcedureRegistered(procedureName, defaultProcedure)).toBe(true);
    expect(isProcedureRegistered(procedureName, procedure)).toBe(false);
  });

  test('既定の手続きが途中で登録された場合の既定の手続きの復元', function () {
    /** 登録を解除する。 */
    const unregister = registerProcedure(procedureName, procedure);
    expect(isProcedureRegistered(procedureName, defaultProcedure)).toBe(false);
    expect(isProcedureRegistered(procedureName, procedure)).toBe(true);

    registerDefaultProcedure(procedureName, defaultProcedure);

    unregister();
    expect(isProcedureRegistered(procedureName, defaultProcedure)).toBe(true);
    expect(isProcedureRegistered(procedureName, procedure)).toBe(false);
  });
});
