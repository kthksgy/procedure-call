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

import type { CepcPacket, CepcProcedureCallOptions, Jsonized } from 'cepc';

/** CEPC WebView Host呼び出し関数のキー */
export const CEPC_KEY_CALL_HOST = '__cepc_rnwvg_call__';
/** CEPC WebView Guest処理関数のキー */
export const CEPC_KEY_HANDLE_GUEST = '__cepc_rnwvg_handle__';

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
 * WebView Hostの手続きを呼び出す。
 * @param name 手続きの名前
 * @param requestData リクエストデータ
 * @param options オプション
 * @returns レスポンスデータ
 */
export async function callHost<RequestData, ResponseData>(
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
    return call(name, requestData, post, options);
  } else {
    console.error(
      `[${NAME}] \`window.ReactNativeWebView.postMessage()\`が初期化されていないため、` +
        `手続き\`${name}\`のリクエストを送信できません。`,
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

/** WebViewである場合、`true`を返す。 */
export function isWebView() {
  return Boolean(
    typeof window === 'object' && window !== null && window.ReactNativeWebView !== undefined,
  );
}

/**
 * WebView Guestの処理関数
 * @param payloadString ペイロード文字列
 */
export async function handleGuest(payloadString: string) {
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

export function startGuestHandler() {
  if (typeof window === 'object' && window !== null) {
    // `window`に公開する。
    window[CEPC_KEY_CALL_HOST] = callHost;
    window[CEPC_KEY_HANDLE_GUEST] = handleGuest;
  } else {
    console.warn(`[${NAME}] \`window\`が存在しません。`);
  }
  return stopGuestHandler;
}

export function stopGuestHandler() {
  if (typeof window === 'object' && window !== null) {
    window[CEPC_KEY_CALL_HOST] = undefined;
    window[CEPC_KEY_HANDLE_GUEST] = undefined;
  } else {
    console.warn(`[${NAME}] \`window\`が存在しません。`);
  }
}

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: { (message: string): void };
    };

    [CEPC_KEY_CALL_HOST]?: {
      (name: string, requestData: unknown, options?: CepcProcedureCallOptions): Promise<unknown>;
    };
    [CEPC_KEY_HANDLE_GUEST]?: { (payloadString: string): void };
  }
}
