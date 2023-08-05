/**
 * @file LRPC - Local Remote Procedure Call
 * @module lrpc
 * @version 0.0.9
 *
 * @example WebViewに導入する
 *
 * - `window`のプロパティとして`LRPC_IDENTIFIER_PROPERTY_NAME`に指定されたキーに識別子を設定する。
 *   - `generateLrpcIdentifierSetter()`を使用してスクリプト文字列を生成できる。
 * - `onMessage`に`generateSocketFunction`で生成したソケット関数を設定する。
 *   - `useMemo()`を使用してメモ化する事を推奨する。
 *
 * ```
 * const webViewReference = useRef<WebView>(null);
 *
 * const socketFunction = useMemo(function () {
 *   return generateSocketFunction(function () {
 *     return webViewReference.current;
 *   });
 * }, []);
 *
 * return (
 *   <WebView
 *     injectedJavaScript={`window[${generateTemplateLiteralString(LRPC_IDENTIFIER_PROPERTY_NAME)}]='GUEST1';true;`}
 *     onMessage={socketFunction}
 *     ref={webViewReference}
 *   />
 * );
 * ```
 */

import type { Platform } from 'react-native';

/** LRPC(`lrpc`)の表示可能なモジュール名 */
export const NAME = 'LRPC';
/** LRPC(`lrpc`)のパッケージバージョン */
export const VERSION = '0.0.9'; // 変更した場合はファイル先頭のバージョンの記述も変更する。

console.debug(`[${NAME}] バージョン: \`${VERSION}\``);

/** LRPC WebView Host 呼び出し関数名 */
export const LRPC_CALL_WVH_FUNCTION_NAME = 'lrpcWvhCallFunction';
/** LRPCエラーコード: 内部エラー */
export const LRPC_ERROR_CODE_INTERNAL = 'LRPC_INTERNAL';
/** LRPCエラーコード: タイムアウト */
export const LRPC_ERROR_CODE_TIMEOUT = 'LRPC_TIMEOUT';
/** LRPCエラーコード: 未定義 */
export const LRPC_ERROR_CODE_UNDEFINED = 'LRPC_UNDEFINED';
/** LRPCエラーコード: 未初期化 */
export const LRPC_ERROR_CODE_UNINITIALIZED = 'LRPC_UNINITIALIZED';
/** LRPC識別子プロパティ名 */
export const LRPC_IDENTIFIER_PROPERTY_NAME = 'LRPC_IDENTIFIER';
/** LRPC識別子 */
const LRPC_IDENTIFIER = `${Date.now()}:${Math.random()}`;
/** LRPCソケット関数名 */
export const LRPC_WVG_SOCKET_FUNCTION_NAME = 'lrpcWvgSocketFunction';
/** LRPCプロトコル */
const LRPC_PROTOCOL = 'lrpc';

/** コールバック */
const callbacks = new Map<string, [{ (value: any): void }, { (reason?: any): void }]>();
/** 既定の手続き */
const defaultProcedures = new Map<string, LrpcProcedure>();
/** カウンター */
let n = 0;
/** 手続き */
const procedures = new Map<string, LrpcProcedure>();

/**
 * JSON化された
 * @version 1.1.0
 */
type Jsonized<Type, Parent extends object | Array<any> | undefined> = Type extends
  | symbol
  | { (...parameters: Array<any>): any }
  | undefined
  ? Parent extends object
    ? never
    : Parent extends Array<any>
    ? null
    : void
  : Type extends bigint
  ? never
  : Type extends readonly [...infer Tuple]
  ? [
      ...{
        [Index in keyof Tuple]: Index extends Exclude<keyof Tuple, keyof Array<any>>
          ? Jsonized<Tuple[Index], Array<any>>
          : Tuple[Index];
      },
    ]
  : Type extends Array<infer Element>
  ? Array<Jsonized<Element, Array<any>>>
  : Type extends Date
  ? string
  : Type extends object
  ? NeverOmitted<{ [Key in keyof Type]: Jsonized<Type[Key], object> }>
  : Type extends number
  ? number // | null // `NaN`、`Infinity`、`-Infinity`は`null`になる。
  : Type;

/**
 * LRPCコンテキスト
 */
export interface LrpcContext<Data = unknown> {
  /** ペイロード */
  payload: LrpcPacket<'req', LrpcVersionUnion, Data>;
  /** WebView */
  webView?: unknown;
}

/**
 * LRPCエラー
 * @version 2
 */
export class LrpcError<Data = unknown> extends Error {
  /**
   * コード
   * @default ''
   */
  code: string;
  /**
   * データ
   * @default undefined
   */
  data?: Data;
  /**
   * タイムスタンプ(UNIX時間)[ミリ秒]
   */
  timestamp: number;

  constructor(code?: string, message?: string, options?: LrpcErrorOptions<Data>) {
    super(message, options && options.cause ? { cause: options.cause } : undefined);

    this.code = code ?? '';
    this.name = LrpcError.name + '[' + this.code + ']';
    this.timestamp = Date.now();

    if (options) {
      if (options.data) {
        this.data = options.data;
      }
    }
  }
}

/**
 * LRPCエラーオプション
 * @version 0
 */
export interface LrpcErrorOptions<Data = unknown> extends ErrorOptions {
  /** データ */
  data?: Data;
}

/**
 * LRPCパケット
 * @version 4
 */
type LrpcPacket<
  Type extends 'err' | 'req' | 'res',
  Version extends LrpcVersionUnion = 0,
  Data = unknown,
> = LrpcRawPacket<Type, Version, Jsonized<Data, object>>;

/**
 * LRPC手続き
 * @version 1
 */
type LrpcProcedure<RequestData = any, ResponseData = any> = {
  /**
   * @param requestData リクエストデータ
   * @param context コンテキスト
   * @returns レスポンスデータ
   * @throws {LrpcError} エラー
   */
  (requestData: RequestData, context: LrpcContext<RequestData>): Promise<ResponseData>;
};

/**
 * LRPC手続き呼び出しオプション
 * @version 0
 */
export type LrpcProcedureCallOptions = {
  /** タイムアウト時間[ミリ秒] */
  timeout?: number;
};

/**
 * LRPCローパケット
 * @version 0
 */
type LrpcRawPacket<
  Type extends 'err' | 'req' | 'res',
  Version extends LrpcVersionUnion = 0,
  Data = unknown,
> = {
  /**
   * インデックス
   * @description 受信時、奇数の場合はレスポンス、偶数の場合はリクエストを表す。
   */
  index: number;
  /** 通信の識別子 */
  key: string;
  /** 手続きの名前 */
  name: string;
  /** プロトコル */
  p: typeof LRPC_PROTOCOL;
  /** タイムスタンプ(UNIX時間)[ミリ秒] */
  timestamp: number;
  /** タイプ */
  t: Type;
  /** バージョン */
  v: Version;
} & (Type extends 'err'
  ? { code?: string; data?: Data; message?: string }
  : Type extends 'req'
  ? { data: Data }
  : Type extends 'res'
  ? { data: Data }
  : unknown);

/** LRPCバージョンユニオン */
type LrpcVersionUnion = 0;

/**
 * バリューが`never`のキーが省略された
 * @version 1.0.0
 */
type NeverOmitted<Type> = Type extends object
  ? { [Key in keyof Type as Type[Key] extends never ? never : Key]: Type[Key] }
  : Type;

/**
 * 手続きを呼び出す。
 * @param key キー
 * @param post 送信関数
 * @param name 名前
 * @param requestData リクエストデータ
 * @param options オプション
 * @returns レスポンスデータ
 */
export async function callProcedure<RequestData, ResponseData>(
  key: string,
  post: { (message: string): void },
  name: string,
  requestData: RequestData,
  options?: LrpcProcedureCallOptions,
): Promise<Jsonized<Awaited<ResponseData>, object>> {
  return new Promise(function (resolve, reject) {
    callbacks.set(key, [resolve, reject]);
    /** リクエスト */
    const request: LrpcRawPacket<'req'> = {
      data: requestData,
      index: 0,
      key,
      name,
      p: LRPC_PROTOCOL,
      timestamp: Date.now(),
      t: 'req',
      v: 0,
    };

    post(JSON.stringify(request));

    if (options?.timeout !== undefined && Number.isFinite(options.timeout) && options.timeout > 0) {
      setTimeout(function () {
        reject(new LrpcError(LRPC_ERROR_CODE_TIMEOUT));
        callbacks.delete(key);
      }, options.timeout);
    }
  });
}

/**
 * WindowClientの手続きを呼び出す。
 * @param windowClient WindowClient
 * @param name 名前
 * @param requestData リクエストデータ
 * @param options オプション
 * @returns レスポンスデータ
 */
export async function callWcProcedure<RequestData, ResponseData>(
  windowClient: { postMessage: { (message: string): void } } | null | undefined,
  name: string,
  requestData: RequestData,
  options?: LrpcProcedureCallOptions,
): Promise<Jsonized<Awaited<ResponseData>, object>> {
  if (windowClient && typeof windowClient.postMessage === 'function') {
    /** 送信関数 */
    const post = function (message: string) {
      windowClient.postMessage(message);
    };
    return callProcedure(`WVH:${LRPC_IDENTIFIER}:${n++}`, post, name, requestData, options);
  } else {
    console.error(
      `[${NAME}] Service Worker Hostが初期化されていないため、手続き\`${name}\`のリクエストを送信できません。`,
    );
    throw new LrpcError(LRPC_ERROR_CODE_UNINITIALIZED);
  }
}

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
  options?: LrpcProcedureCallOptions,
): Promise<Jsonized<Awaited<ResponseData>, object>> {
  if (webView && typeof webView.injectJavaScript === 'function') {
    /** 送信関数 */
    const post = function (message: string) {
      webView.injectJavaScript(
        `window[${generateTemplateLiteralString(
          LRPC_WVG_SOCKET_FUNCTION_NAME,
        )}](${generateTemplateLiteralString(message)});true;`,
      );
    };
    return callProcedure(`WVH:${LRPC_IDENTIFIER}:${n++}`, post, name, requestData, options);
  } else {
    console.error(
      `[${NAME}] WebViewが初期化されていないため、手続き\`${name}\`のリクエストを送信できません。`,
    );
    throw new LrpcError(LRPC_ERROR_CODE_UNINITIALIZED);
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
  options?: LrpcProcedureCallOptions,
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
      `WVG:${window[LRPC_IDENTIFIER_PROPERTY_NAME]}:${n++}`,
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
    throw new LrpcError(LRPC_ERROR_CODE_UNINITIALIZED);
  }
}
if (typeof window === 'object' && window !== null) {
  // `window`に公開する。
  window[LRPC_CALL_WVH_FUNCTION_NAME] = callWvhProcedure;
}

/**
 * @returns `bypassConsole`を導入するスクリプト
 */
export function generateBypassConsoleInstaller() {
  return `console = {...console, ...Object.fromEntries(['debug', 'error', 'info', 'log', 'warn'].map(function (level) {
    return [level, function (...parameters) {
        window[${generateTemplateLiteralString(LRPC_CALL_WVH_FUNCTION_NAME)}]('bypassConsole', {
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
 * @param identifier 識別子
 * @returns LRPC識別子を設定するスクリプト
 */
export function generateLrpcIdentifierSetter(identifier: string) {
  return `window[${generateTemplateLiteralString(
    LRPC_IDENTIFIER_PROPERTY_NAME,
  )}] = ${generateTemplateLiteralString(identifier)};`;
}

/**
 * @returns `window.ReactNativePlatform`を設定するスクリプト
 */
export function generateReactNativePlatformSetter(platform: Platform) {
  return `window.ReactNativePlatform = JSON.parse(${generateTemplateLiteralString(
    JSON.stringify(platform),
  )});`;
}

/**
 * テンプレートリテラル文字列を生成する。
 * @param s 文字列
 * @returns テンプレートリテラル文字列
 *
 * @version 0
 */
export function generateTemplateLiteralString(s: string) {
  return `\`${s.replaceAll('\\', '\\\\').replaceAll('`', '\\`')}\``;
}

/**
 * WebView Hostソケット関数を生成する。
 * @param getWebView WebViewを取得する。
 * @returns ソケット関数
 */
export function generateWvhSocketFunction(getWebView: {
  (): { injectJavaScript: { (script: string): void } } | null | undefined;
}) {
  /**
   * ソケット関数
   * @param event イベント
   */
  return function (event: { nativeEvent: { data: string } }) {
    /** ペイロード文字列 */
    const payloadString = event.nativeEvent.data;

    /** 送信関数 */
    const post = function (message: string, payload: LrpcPacket<'req'>) {
      /** WebView */
      const webView = getWebView();
      if (webView) {
        webView.injectJavaScript(
          `window[${generateTemplateLiteralString(
            LRPC_WVG_SOCKET_FUNCTION_NAME,
          )}](${generateTemplateLiteralString(message)});true;`,
        );
      } else {
        console.error(
          `[${NAME}] WebViewが初期化されていないため、手続き\`${payload.name}\`の結果を送信できません。`,
        );
      }
    };

    socketFunction(payloadString, post);
  };
}

/** `window.ReactNativePlatform`を取得する。 */
export function getPlatform() {
  return typeof window === 'object' && window !== null ? window.ReactNativePlatform : undefined;
}

/** `window.ReactNativeWebView`を取得する。 */
export function getWebView() {
  return typeof window === 'object' && window !== null ? window.ReactNativeWebView : undefined;
}

/**
 * 手続きが登録されている場合、`true`を返す。
 * @param name 名前
 * @param procedure 手続き
 * @returns 真偽値
 *
 * - 名前のみ指定した場合、その名前で手続きが登録されている場合に`true`を返す。
 * - 手続きのみ指定した場合、その手続きが何れかの名前で登録されている場合に`true`を返す。
 * - 名前と手続きを指定した場合、その名前でその手続きが登録されている場合に`true`を返す。
 *
 * @version 0
 */
export function isProcedureRegistered<RequestData, ResponseData>(
  name?: string,
  procedure?: LrpcProcedure<RequestData, ResponseData>,
) {
  if (name !== undefined) {
    if (procedure !== undefined) {
      return procedures.get(name) === procedure;
    } else {
      return procedures.has(name);
    }
  } else if (procedure !== undefined) {
    return Array.from(procedures.values()).includes(procedure);
  } else {
    return false;
  }
}

/** LRPCを初期化する。 */
export function initialize() {
  // `bypassConsole`を登録する。
  registerProcedure<
    {
      content: string;
      level: 'debug' | 'error' | 'info' | 'log' | 'warn';
    },
    void
  >('bypassConsole', async function (requestData) {
    console[requestData.level]('<WebView>', requestData.content);
  });

  console.debug(`[${NAME}] 初期化しました。`);
}

/** WebViewである場合、`true`を返す。 */
export function isWebView() {
  return Boolean(
    typeof window === 'object' && window !== null && window.ReactNativeWebView !== undefined,
  );
}

/** AndroidのWebViewである場合、`true`を返す。 */
export function isWebViewAndroid() {
  return isWebView() && window.ReactNativePlatform?.OS === 'android';
}

/** iOSのWebViewである場合、`true`を返す。 */
export function isWebViewIos() {
  return isWebView() && window.ReactNativePlatform?.OS === 'ios';
}

/**
 * 既定の手続きを登録する。
 * @param name 名前
 * @param procedure 手続き
 * @returns 手続きを登録解除する。
 *
 * @version 0
 */
export function registerDefaultProcedure<RequestData, ResponseData>(
  name: string,
  procedure: LrpcProcedure<Jsonized<RequestData, object>, Awaited<ResponseData>>,
) {
  defaultProcedures.set(name, procedure);
  if (!procedures.has(name)) {
    procedures.set(name, procedure);
  }
  return function () {
    if (defaultProcedures.get(name) === procedure) {
      defaultProcedures.delete(name);
    }
    if (procedures.get(name) === procedure) {
      procedures.delete(name);
    }
  };
}

/**
 * 手続きを登録する。
 * @param name 名前
 * @param procedure 手続き
 * @returns 手続きを登録解除する。
 *
 * @version 0
 */
export function registerProcedure<RequestData, ResponseData>(
  name: string,
  procedure: LrpcProcedure<Jsonized<RequestData, object>, Awaited<ResponseData>>,
) {
  procedures.set(name, procedure);
  return function () {
    if (procedures.get(name) === procedure) {
      procedures.delete(name);

      /** 既定の手続き */
      const defaultProcedure = defaultProcedures.get(name);
      if (defaultProcedure !== undefined) {
        procedures.set(name, defaultProcedure);
      }
    }
  };
}

/**
 * ソケット関数
 * @param payloadString ペイロード文字列
 * @param post 送信関数
 */
export function socketFunction(
  payloadString: string,
  post: { (message: string, payload: LrpcPacket<'req'>): void },
) {
  /** ペイロード */
  const payload: LrpcPacket<'err'> | LrpcPacket<'req'> | LrpcPacket<'res'> =
    JSON.parse(payloadString);
  if (payload && payload.p === LRPC_PROTOCOL && payload.v === 0) {
    switch (payload.t) {
      case 'req': {
        /** 手続き */
        const procedure = procedures.get(payload.name);
        if (procedure) {
          procedure(payload.data, { payload })
            .then(function (responseData): LrpcPacket<'res'> {
              return {
                data: responseData,
                index: payload.index + 1,
                key: payload.key,
                name: payload.name,
                p: LRPC_PROTOCOL,
                timestamp: Date.now(),
                t: 'res',
                v: 0,
              };
            })
            .catch(function (error): LrpcPacket<'err'> {
              if (error instanceof LrpcError) {
                console.debug(error);
                return {
                  code: error.code || LRPC_ERROR_CODE_INTERNAL,
                  ...(error.data !== undefined && { data: error.data }),
                  index: payload.index + 1,
                  key: payload.key,
                  ...(error.message && { message: error.message }),
                  name: payload.name,
                  p: LRPC_PROTOCOL,
                  timestamp: error.timestamp,
                  t: 'err',
                  v: 0,
                };
              } else {
                console.error(error);
                return {
                  index: payload.index + 1,
                  key: payload.key,
                  name: payload.name,
                  p: LRPC_PROTOCOL,
                  timestamp: Date.now(),
                  t: 'err',
                  v: 0,
                };
              }
            })
            .then(function (response) {
              post(JSON.stringify(response), payload);
            });
        } else {
          console.error(`[${NAME}] 手続き\`${payload.name}\`が登録されていません。`);
          post(
            JSON.stringify({
              code: LRPC_ERROR_CODE_UNDEFINED,
              index: payload.index + 1,
              key: payload.key,
              name: payload.name,
              p: LRPC_PROTOCOL,
              timestamp: Date.now(),
              t: 'err',
              v: 0,
            } satisfies LrpcPacket<'err'>),
            payload,
          );
        }

        break;
      }
      case 'res': {
        /** コールバック */
        const callback = callbacks.get(payload.key);
        if (callback) {
          callback[0](payload.data);
          callbacks.delete(payload.key);
        } else {
          console.error(
            `[${NAME}] リクエスト\`${payload.name}:${payload.key}\`のコールバックが存在しないため、レスポンスを受信できません。`,
          );
        }
        break;
      }
      case 'err': {
        /** コールバック */
        const callback = callbacks.get(payload.key);
        if (callback) {
          callback[1](new LrpcError(payload.code, payload.message, { data: payload.data }));
          callbacks.delete(payload.key);
        } else {
          console.error(
            `[${NAME}] リクエスト\`${payload.name}:${payload.key}\`のコールバックが存在しないため、エラーを受信できません。`,
          );
        }
        break;
      }
    }
  } else {
    console.error(`[${NAME}] ペイロード\`${payloadString}\`が無効な形式です。`);
  }
}

/**
 * Window Clientのソケット関数を開始する。
 * @returns 停止する。
 */
export function startWcSocketFunction() {
  if (
    typeof navigator === 'object' &&
    navigator !== null &&
    typeof navigator.serviceWorker === 'object' &&
    navigator.serviceWorker !== null
  ) {
    /** リスナー */
    const listener = function (event: MessageEvent<string>) {
      if (typeof event.data === 'string' && event.data.length > 0) {
        /** 送信関数 */
        const post = function (message: string, payload: LrpcPacket<'req'>) {
          /** ソース */
          if (event.source !== null) {
            event.source.postMessage(message);
          } else {
            console.error(
              `[${NAME}] \`event.source\`が\`null\`であるため、手続き\`${payload.name}\`のレスポンスを送信できません。`,
            );
          }
        };

        socketFunction(event.data, post);
      }
    };
    navigator.serviceWorker.addEventListener('message', listener);
    return function () {
      navigator.serviceWorker.removeEventListener('message', listener);
    };
  } else {
    console.error(
      `[${NAME}] Service Workerに対応していないため、Window Clientのソケット関数を開始できません。`,
    );
    return function () {};
  }
}

/**
 * WebView Guestソケット関数
 * @param payloadString ペイロード文字列
 */
export function wvgSocketFunction(payloadString: string) {
  /** 送信関数 */
  const post = function (message: string, payload: LrpcPacket<'req'>) {
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

  socketFunction(payloadString, post);
}
if (typeof window === 'object' && window !== null) {
  // `window`に公開する。
  window[LRPC_WVG_SOCKET_FUNCTION_NAME] = wvgSocketFunction;
}

declare global {
  interface Window {
    ReactNativePlatform?: Jsonized<Platform, undefined>;

    ReactNativeWebView?: {
      postMessage: { (message: string): void };
    };

    /** LRPC呼び出し関数 */
    [LRPC_CALL_WVH_FUNCTION_NAME]: typeof callWvhProcedure;
    /** LRPC識別子 */
    [LRPC_IDENTIFIER_PROPERTY_NAME]?: string;
    /** LRPCソケット関数 */
    [LRPC_WVG_SOCKET_FUNCTION_NAME]: typeof wvgSocketFunction;
  }
}
