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
  registerDefaultProcedure,
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

describe(`${registerDefaultProcedure.name}`, function () {
  beforeEach(function () {
    reset();
  });

  test('登録', function () {
    async function procedure() {
      return true;
    }
    registerDefaultProcedure('procedure', procedure);
    expect(isDefaultProcedureRegistered('procedure')).toBe(true);
    expect(isDefaultProcedureRegistered('procedure', procedure)).toBe(true);
  });

  test('登録解除', function () {
    /** 登録を解除する。 */
    const unregister = registerDefaultProcedure('procedure', async function () {});
    expect(isDefaultProcedureRegistered('procedure')).toBe(true);
    unregister();
    expect(isDefaultProcedureRegistered('procedure')).toBe(false);
  });
});
