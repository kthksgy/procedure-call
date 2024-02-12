import { describe, expect, test } from 'vitest';

import { CEPC_KEY_CALL_WEB_VIEW_HOST, CEPC_KEY_WEB_VIEW_INJECTION_HANDLER } from './common';

describe('定数定義', function () {
  test.each([
    [CEPC_KEY_CALL_WEB_VIEW_HOST, '__cepc_rnwv_callWebViewHost__'],
    [CEPC_KEY_WEB_VIEW_INJECTION_HANDLER, '__cepc_rnwv_webViewInjectionHandler__'],
  ])('"%s" = "%s"', function (actualValue, expectedValue) {
    expect(actualValue).toBe(expectedValue);
  });
});
