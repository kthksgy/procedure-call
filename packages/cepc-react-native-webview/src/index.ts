import {
  CEPC_ERROR_CODE_UNINITIALIZED,
  CepcError,
  NAME,
  call,
  generateTemplateLiteralString,
} from 'cepc';

import type { CepcProcedureCallOptions, Jsonized } from 'cepc';

/**
 * WebView Guestの手続きを呼び出す。
 * @param webView WebView
 * @param name 名前
 * @param requestData リクエストデータ
 * @param options オプション
 * @returns レスポンスデータ
 */
export async function callWvgProcedure<RequestData, ResponseData>(
  webView: { injectJavaScript: { (script: string): void } } | null | undefined,
  name: string,
  requestData: RequestData,
  options?: CepcProcedureCallOptions,
): Promise<Jsonized<Awaited<ResponseData>, object>> {
  if (webView && typeof webView.injectJavaScript === 'function') {
    /** 送信関数 */
    const post = function (message: string) {
      webView.injectJavaScript(
        `window[${generateTemplateLiteralString(
          CEPC_WVG_SOCKET_FUNCTION_NAME,
        )}](${generateTemplateLiteralString(message)});true;`,
      );
    };
    return call(`WVH:${CEPC_IDENTIFIER}:${n++}`, post, name, requestData, options);
  } else {
    console.error(
      `[${NAME}] WebViewが初期化されていないため、手続き\`${name}\`のリクエストを送信できません。`,
    );
    throw new CepcError(CEPC_ERROR_CODE_UNINITIALIZED);
  }
}

/**
 * WebView Hostの手続きを呼び出す。
 * @param webView WebView
 * @param name 手続きの名前
 * @param requestData リクエストデータ
 * @param options オプション
 * @returns レスポンスデータ
 */
export async function callWvhProcedure<RequestData, ResponseData>(
  name: string,
  requestData: RequestData,
  options?: CepcProcedureCallOptions,
): Promise<Jsonized<Awaited<ResponseData>, object>> {
  if (
    typeof window === 'object' &&
    window !== null &&
    typeof window.ReactNativeWebView === 'object' &&
    window.ReactNativeWebView !== null &&
    typeof window.ReactNativeWebView.postMessage === 'function'
  ) {
    /** 送信関数 */
    const post = window.ReactNativeWebView.postMessage.bind(window.ReactNativeWebView);
    return callProcedure(
      `WVG:${window[CEPC_IDENTIFIER_PROPERTY_NAME]}:${n++}`,
      post,
      name,
      requestData,
      options,
    );
  } else {
    console.error(
      `[${NAME}] \`window.ReactNativeWebView.postMessage()\`が初期化されていないため、` +
        `手続き\`${name}\`のリクエストを送信できません。`,
    );
    throw new CepcError(CEPC_ERROR_CODE_UNINITIALIZED);
  }
}
if (typeof window === 'object' && window !== null) {
  // `window`に公開する。
  window[CEPC_CALL_WVH_FUNCTION_NAME] = callWvhProcedure;
}

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: { (message: string): void };
    };
  }
}
