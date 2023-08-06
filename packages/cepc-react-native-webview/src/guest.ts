import { CEPC_ERROR_CODE_UNINITIALIZED, CepcError, NAME, callTarget, handle } from 'cepc';

import { CEPC_KEY_CALL_WEB_VIEW_HOST, CEPC_KEY_WEB_VIEW_INJECTION_HANDLER } from './common';

import type { CepcPacket, CepcProcedureCallOptions, Jsonized } from 'cepc';

/**
 * WebView Hostの手続きを呼び出す。
 * @param name 手続きの名前
 * @param requestData リクエストデータ
 * @param options オプション
 * @returns レスポンスデータ
 */
export async function callWebViewHost<RequestData, ResponseData>(
  name: string,
  requestData: RequestData,
  options?: CepcProcedureCallOptions,
): Promise<Jsonized<Awaited<ResponseData>, object>> {
  if (typeof window === 'object' && window !== null) {
    return callTarget(window.ReactNativeWebView, name, requestData, options);
  } else {
    console.error(
      `[${NAME}] \`window.ReactNativeWebView.postMessage()\`が初期化されていないため、` +
        `手続き\`${name}\`のリクエストを送信できません。`,
    );
    throw new CepcError(CEPC_ERROR_CODE_UNINITIALIZED);
  }
}

/** WebView Guestである場合、`true`を返す。 */
export function isWebViewGuest() {
  return typeof window === 'object' && window !== null && Boolean(window.ReactNativeWebView);
}

/**
 * WebView Injection Handler
 * @param payloadString ペイロード文字列
 */
export async function webViewInjectionHandler(payloadString: string) {
  /** 送信関数 */
  const post = function (message: string, payload: CepcPacket<'req'>) {
    if (
      typeof window === 'object' &&
      window !== null &&
      typeof window.ReactNativeWebView === 'object' &&
      window.ReactNativeWebView !== null &&
      typeof window.ReactNativeWebView.postMessage === 'function'
    ) {
      window.ReactNativeWebView.postMessage(message);
    } else {
      console.error(
        `[${NAME}] \`window.ReactNativeWebView.postMessage()\`が初期化されていないため、` +
          `手続き\`${payload.name}\`のレスポンスを送信できません。`,
      );
    }
  };

  await handle(payloadString, post);
}

/**
 * WebView Guestのリスナーを開始する。
 * @returns 停止する。
 */
export function startWebViewInjectionHandler() {
  if (typeof window === 'object' && window !== null) {
    // `window`に公開する。
    window[CEPC_KEY_CALL_WEB_VIEW_HOST] = callWebViewHost;
    window[CEPC_KEY_WEB_VIEW_INJECTION_HANDLER] = webViewInjectionHandler;
  } else {
    console.warn(`[${NAME}] \`window\`が存在しません。`);
  }
  return stopWebViewInjectionHandler;
}

/**
 * WebView Guestのリスナーを停止する。
 */
export function stopWebViewInjectionHandler() {
  if (typeof window === 'object' && window !== null) {
    window[CEPC_KEY_CALL_WEB_VIEW_HOST] = undefined;
    window[CEPC_KEY_WEB_VIEW_INJECTION_HANDLER] = undefined;
  } else {
    console.warn(`[${NAME}] \`window\`が存在しません。`);
  }
}

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: { (message: string): void };
    };
    [CEPC_KEY_CALL_WEB_VIEW_HOST]?: {
      (name: string, requestData: unknown, options?: CepcProcedureCallOptions): Promise<unknown>;
    };
    [CEPC_KEY_WEB_VIEW_INJECTION_HANDLER]?: { (payloadString: string): void };
  }

  let window: Window;
}
