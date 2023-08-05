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

/** LRPC(`lrpc`)の表示可能なモジュール名 */
export const NAME = 'LRPC';
/** LRPC(`lrpc`)のパッケージバージョン */
export const VERSION = '0.0.9'; // 変更した場合はファイル先頭のバージョンの記述も変更する。

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
/** LRPCプロトコル */
const LRPC_PROTOCOL = 'lrpc';

/** コールバック */
const callbacks = new Map<string, [{ (value: any): void }, { (reason?: any): void }]>();
/** 既定の手続き */
const defaultProcedures = new Map<string, LrpcProcedure>();
/** カウンター */
const n = 0;
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
export function isProcedureRegistered(name?: string, procedure?: any) {
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
  console.debug(`[${NAME}] 初期化しました。`);
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
