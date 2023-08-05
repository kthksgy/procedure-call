import { beforeEach, describe, expect, test } from 'vitest';

import {
  CEPC_ERROR_CODE_INTERNAL,
  CEPC_ERROR_CODE_TIMEOUT,
  CEPC_ERROR_CODE_UNDEFINED,
  CEPC_ERROR_CODE_UNINITIALIZED,
  CEPC_PAYLOAD_STRING_PREFIX,
  CEPC_PROTOCOL,
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

test(`${isDefaultProcedureRegistered.name}`, function () {
  reset();

  /** 手続き名 */
  const procedureName = 'procedure';
  /** 手続き */
  async function procedure() {
    return true;
  }

  expect(isDefaultProcedureRegistered(procedureName)).toBe(false);

  /** 登録を解除する。 */
  const unregister = registerDefaultProcedure(procedureName, procedure);

  expect(isDefaultProcedureRegistered(procedureName)).toBe(true);
  expect(isDefaultProcedureRegistered(procedureName, procedure)).toBe(true);

  unregister();

  expect(isDefaultProcedureRegistered(procedureName)).toBe(false);
});

test(`${isProcedureRegistered.name}`, function () {
  reset();

  /** 手続き名 */
  const procedureName = 'procedure';
  /** 手続き */
  async function procedure() {
    return true;
  }

  expect(isProcedureRegistered(procedureName)).toBe(false);

  /** 登録を解除する。 */
  const unregister = registerProcedure(procedureName, procedure);

  expect(isProcedureRegistered(procedureName)).toBe(true);
  expect(isProcedureRegistered(procedureName, procedure)).toBe(true);

  unregister();

  expect(isProcedureRegistered(procedureName)).toBe(false);
});

describe(`${registerDefaultProcedure.name}`, function () {
  beforeEach(function () {
    reset();
  });

  test('登録と登録解除', function () {
    /** 手続き名 */
    const procedureName = 'procedure';
    /** 手続き */
    async function procedure() {
      return true;
    }

    /** 登録を解除する。 */
    const unregister = registerDefaultProcedure(procedureName, procedure);
    expect(isDefaultProcedureRegistered(procedureName, procedure)).toBe(true);
    expect(isProcedureRegistered(procedureName, procedure)).toBe(true);

    unregister();

    expect(isDefaultProcedureRegistered(procedureName)).toBe(false);
    expect(isProcedureRegistered(procedureName)).toBe(false);
  });

  test('上書き', function () {
    /** 手続き名 */
    const procedureName = 'procedure';
    /** 手続き1 */
    async function procedure1() {
      return true;
    }
    /** 手続き2 */
    async function procedure2() {
      return true;
    }

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
});

describe(`${registerProcedure.name}`, function () {
  beforeEach(function () {
    reset();
  });

  test('登録', function () {
    async function procedure() {
      return true;
    }
    registerProcedure('procedure', procedure);
    expect(isProcedureRegistered('procedure')).toBe(true);
    expect(isProcedureRegistered('procedure', procedure)).toBe(true);
  });

  test('登録解除', function () {
    /** 登録を解除する。 */
    const unregister = registerProcedure('procedure', async function () {});
    expect(isProcedureRegistered('procedure')).toBe(true);
    unregister();
    expect(isProcedureRegistered('procedure')).toBe(false);
  });

  test('上書き', function () {
    /** 手続き名 */
    const procedureName = 'procedure';
    /** 手続き1 */
    async function procedure1() {
      return true;
    }
    /** 手続き2 */
    async function procedure2() {
      return true;
    }
    registerProcedure(procedureName, procedure1);
    expect(isProcedureRegistered(procedureName)).toBe(true);
    expect(isProcedureRegistered(procedureName, procedure1)).toBe(true);

    registerProcedure(procedureName, procedure2);
    expect(isProcedureRegistered(procedureName)).toBe(true);
    expect(isProcedureRegistered(procedureName, procedure1)).toBe(false);
    expect(isProcedureRegistered(procedureName, procedure2)).toBe(true);
  });

  test('既定の手続きの復元');
});
