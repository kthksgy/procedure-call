import { describe, expect, test } from 'vitest';

import {
  PROCEDURE_CALL_KEY_CALL_WEB_VIEW_HOST,
  PROCEDURE_CALL_KEY_WEB_VIEW_INJECTION_HANDLER,
} from './common';

describe('定数定義', function () {
  test.each([
    [PROCEDURE_CALL_KEY_CALL_WEB_VIEW_HOST, '__pc_rnwv_callWebViewHost__'],
    [PROCEDURE_CALL_KEY_WEB_VIEW_INJECTION_HANDLER, '__pc_rnwv_webViewInjectionHandler__'],
  ])('"%s" = "%s"', function (actualValue, expectedValue) {
    expect(actualValue).toBe(expectedValue);
  });
});
