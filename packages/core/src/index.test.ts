import { describe, expect, test } from 'vitest';

import {
  CEPC_ERROR_CODE_INTERNAL,
  CEPC_ERROR_CODE_TIMEOUT,
  CEPC_ERROR_CODE_UNDEFINED,
  CEPC_ERROR_CODE_UNINITIALIZED,
  CEPC_PAYLOAD_STRING_PREFIX,
  CEPC_PROTOCOL,
  NAME,
  VERSION,
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
