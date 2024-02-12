import { describe, expect, test, vi } from 'vitest';

import { CEPC_KEY_CALL_WEB_VIEW_HOST, CEPC_KEY_WEB_VIEW_INJECTION_HANDLER } from './common';
import {
  callWebViewHost,
  isWebViewGuest,
  startWebViewInjectionHandler,
  stopWebViewInjectionHandler,
  webViewInjectionHandler,
} from './guest';

describe(`${startWebViewInjectionHandler.name} & ${stopWebViewInjectionHandler.name}`, function () {
  test('正常に登録と登録解除ができる', function () {
    vi.stubGlobal('window', {});
    expect(window[CEPC_KEY_CALL_WEB_VIEW_HOST]).toBeUndefined();
    expect(window[CEPC_KEY_WEB_VIEW_INJECTION_HANDLER]).toBeUndefined();
    startWebViewInjectionHandler();
    expect(window[CEPC_KEY_CALL_WEB_VIEW_HOST]).toBe(callWebViewHost);
    expect(window[CEPC_KEY_WEB_VIEW_INJECTION_HANDLER]).toBe(webViewInjectionHandler);
    stopWebViewInjectionHandler();
    expect(window[CEPC_KEY_CALL_WEB_VIEW_HOST]).toBeUndefined();
    expect(window[CEPC_KEY_WEB_VIEW_INJECTION_HANDLER]).toBeUndefined();
    vi.unstubAllGlobals();
  });

  test(`\`window\`が存在しない`, function () {
    /** `console.warn` */
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(function () {});
    startWebViewInjectionHandler();
    stopWebViewInjectionHandler();
    expect(consoleWarnSpy).toBeCalledTimes(2);
    expect(consoleWarnSpy).nthCalledWith(1, `[CEPC] \`window\`が存在しません。`);
    expect(consoleWarnSpy).nthCalledWith(2, `[CEPC] \`window\`が存在しません。`);
  });
});

describe(`${isWebViewGuest.name}`, function () {
  test(`\`window\`が存在しない`, function () {
    expect(isWebViewGuest()).toBe(false);
  });

  test(`\`window\`に\`ReactNativeWebView\`が存在しない`, function () {
    vi.stubGlobal('window', {});
    expect(isWebViewGuest()).toBe(false);
    vi.unstubAllGlobals();
  });

  test(`\`window\`に\`ReactNativeWebView\`が存在する`, function () {
    vi.stubGlobal('window', { ReactNativeWebView: {} });
    expect(isWebViewGuest()).toBe(true);
    vi.unstubAllGlobals();
  });
});
