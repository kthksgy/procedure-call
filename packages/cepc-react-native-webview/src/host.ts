import {
  CEPC_ERROR_CODE_UNINITIALIZED,
  CepcError,
  NAME,
  call,
  generateTemplateLiteralString,
  handle,
  isDefaultProcedureRegistered,
  registerDefaultProcedure,
} from 'cepc';

import { CEPC_KEY_CALL_HOST, CEPC_KEY_HANDLE_GUEST } from './common';

import type { CepcPacket, CepcProcedureCallOptions, Jsonized } from 'cepc';

/**
 * WebView Guestの手続きを呼び出す。
 * @param webView WebView
 * @param name 名前
 * @param requestData リクエストデータ
 * @param options オプション
 * @returns レスポンスデータ
 */
export async function callGuest<RequestData, ResponseData>(
  webView: { injectJavaScript: { (script: string): void } } | null | undefined,
  name: string,
  requestData: RequestData,
  options?: CepcProcedureCallOptions,
): Promise<Jsonized<Awaited<ResponseData>, object>> {
  if (
    typeof webView === 'object' &&
    webView !== null &&
    typeof webView.injectJavaScript === 'function'
  ) {
    /** 送信関数 */
    const post = function (message: string) {
      webView.injectJavaScript(
        `window[${generateTemplateLiteralString(
          CEPC_KEY_HANDLE_GUEST,
        )}](${generateTemplateLiteralString(message)});true;`,
      );
    };
    return call(name, requestData, post, options);
  } else {
    console.error(
      `[${NAME}] WebViewが初期化されていないため、手続き\`${name}\`のリクエストを送信できません。`,
    );
    throw new CepcError(CEPC_ERROR_CODE_UNINITIALIZED);
  }
}

/**
 * @returns `bypassConsole`を導入するスクリプト
 */
export function generateBypassConsoleInstaller() {
  if (!isDefaultProcedureRegistered('bypassConsole')) {
    // `bypassConsole`を登録する。
    registerDefaultProcedure<
      { content: string; level: 'debug' | 'error' | 'info' | 'log' | 'warn' },
      void
    >('bypassConsole', async function (requestData) {
      console[requestData.level]('<WebView>', requestData.content);
    });
  }

  return `console = {...console, ...Object.fromEntries(['debug', 'error', 'info', 'log', 'warn'].map(function (level) {
    return [level, function (...parameters) {
        window[${generateTemplateLiteralString(CEPC_KEY_CALL_HOST)}]('bypassConsole', {
          content: parameters.map(function (parameter) {
            return String((parameter !== null && typeof parameter === 'object') ? JSON.stringify(parameter) : parameter);
          }).join(' '),
          level,
        });
    }];
  })
)};`;
}

/**
 * WebView Hostのリスナーを生成する。
 * @param getWebView WebViewを取得する。
 * @returns リスナー
 */
export function generateHostListener(getWebView: {
  (): { injectJavaScript: { (script: string): void } } | null | undefined;
}) {
  /**
   * リスナー
   * @param event イベント
   */
  return function (event: { nativeEvent: { data: string } }) {
    /** ペイロード文字列 */
    const payloadString = event.nativeEvent.data;

    /** 送信関数 */
    const post = function (message: string, payload: CepcPacket<'req'>) {
      /** WebView */
      const webView = getWebView();
      if (webView) {
        webView.injectJavaScript(
          `window[${generateTemplateLiteralString(
            CEPC_KEY_HANDLE_GUEST,
          )}](${generateTemplateLiteralString(message)});true;`,
        );
      } else {
        console.error(
          `[${NAME}] WebViewが初期化されていないため、手続き\`${payload.name}\`の結果を送信できません。`,
        );
      }
    };

    handle(payloadString, post);
  };
}
