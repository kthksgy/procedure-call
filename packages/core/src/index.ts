/** 名前 */
export const NAME = 'CEPC';
/** バージョン */
export const VERSION = __version;

/** CEPCエラーコード: 内部エラー */
export const CEPC_ERROR_CODE_INTERNAL = 'CEPC_INTERNAL';
/** CEPCエラーコード: タイムアウト */
export const CEPC_ERROR_CODE_TIMEOUT = 'CEPC_TIMEOUT';
/** CEPCエラーコード: 未定義 */
export const CEPC_ERROR_CODE_UNDEFINED = 'CEPC_UNDEFINED';
/** CEPCエラーコード: 未初期化 */
export const CEPC_ERROR_CODE_UNINITIALIZED = 'CEPC_UNINITIALIZED';
/** CEPC識別子 */
const CEPC_IDENTIFIER = `${Date.now()}:${Math.random()}`;
/** CEPCペイロード文字列接頭辞 */
export const CEPC_PAYLOAD_STRING_PREFIX = 'cepc::';
/** CEPCプロトコル */
export const CEPC_PROTOCOL = 'cepc';

/** コールバック */
const callbacks = new Map<string, [{ (value: any): void }, { (reason?: any): void }]>();
/** 既定の手続き */
const defaultProcedures = new Map<string, CepcProcedure>();
/** カウンター */
let n = 0;
/** 手続き */
const procedures = new Map<string, CepcProcedure>();

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
 * CEPCコンテキスト
 */
export interface CepcContext<Data = unknown> {
  /** ペイロード */
  payload: CepcPacket<'req', CepcVersionUnion, Data>;
  /** WebView */
  webView?: unknown;
}

/**
 * CEPCエラー
 * @version 2
 */
export class CepcError<Data = unknown> extends Error {
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

  constructor(code?: string, message?: string, options?: CepcErrorOptions<Data>) {
    super(message, options && options.cause ? { cause: options.cause } : undefined);

    this.code = code ?? '';
    this.name = CepcError.name + '[' + this.code + ']';
    this.timestamp = Date.now();

    if (options) {
      if (options.data) {
        this.data = options.data;
      }
    }
  }
}

/**
 * CEPCエラーオプション
 * @version 0
 */
export interface CepcErrorOptions<Data = unknown> extends ErrorOptions {
  /** データ */
  data?: Data;
}

/**
 * CEPCパケット
 * @version 4
 */
type CepcPacket<
  Type extends 'err' | 'req' | 'res',
  Version extends CepcVersionUnion = 0,
  Data = unknown,
> = CepcRawPacket<Type, Version, Jsonized<Data, object>>;

/**
 * CEPC手続き
 * @version 1
 */
type CepcProcedure<RequestData = any, ResponseData = any> = {
  /**
   * @param requestData リクエストデータ
   * @param context コンテキスト
   * @returns レスポンスデータ
   * @throws {CepcError} エラー
   */
  (requestData: RequestData, context: CepcContext<RequestData>): Promise<ResponseData>;
};

/**
 * CEPC手続き呼び出しオプション
 * @version 0
 */
export type CepcProcedureCallOptions = {
  /** タイムアウト時間[ミリ秒] */
  timeout?: number;
};

/**
 * CEPCローパケット
 * @version 0
 */
type CepcRawPacket<
  Type extends 'err' | 'req' | 'res',
  Version extends CepcVersionUnion = 0,
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
  p: typeof CEPC_PROTOCOL;
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

/** CEPCバージョンユニオン */
type CepcVersionUnion = 0;

/**
 * バリューが`never`のキーが省略された
 * @version 1.0.0
 */
type NeverOmitted<Type> = Type extends object
  ? { [Key in keyof Type as Type[Key] extends never ? never : Key]: Type[Key] }
  : Type;

/**
 * 手続きを呼び出す。
 * @param post 送信関数
 * @param name 名前
 * @param requestData リクエストデータ
 * @param options オプション
 * @returns レスポンスデータ
 */
export async function callProcedure<RequestData, ResponseData>(
  post: { (message: string): void },
  name: string,
  requestData: RequestData,
  options?: CepcProcedureCallOptions,
): Promise<Jsonized<Awaited<ResponseData>, object>> {
  return new Promise(function (resolve, reject) {
    /** キー */
    const key = CEPC_IDENTIFIER + ':' + String(n++);

    callbacks.set(key, [resolve, reject]);

    /** リクエスト */
    const request: CepcRawPacket<'req'> = {
      data: requestData,
      index: 0,
      key,
      name,
      p: CEPC_PROTOCOL,
      timestamp: Date.now(),
      t: 'req',
      v: 0,
    };

    post(CEPC_PAYLOAD_STRING_PREFIX + JSON.stringify(request));

    if (options?.timeout !== undefined && Number.isFinite(options.timeout) && options.timeout > 0) {
      setTimeout(function () {
        reject(new CepcError(CEPC_ERROR_CODE_TIMEOUT));
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
export function isProcedureRegistered<RequestData, ResponseData>(
  name?: string,
  procedure?: CepcProcedure<RequestData, ResponseData>,
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

/** CEPCを初期化する。 */
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
  procedure: CepcProcedure<Jsonized<RequestData, object>, Awaited<ResponseData>>,
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
  procedure: CepcProcedure<Jsonized<RequestData, object>, Awaited<ResponseData>>,
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
  post: { (message: string, payload: CepcPacket<'req'>): void },
) {
  if (!payloadString.startsWith(CEPC_PAYLOAD_STRING_PREFIX)) {
    console.error(`[${NAME}] ペイロード文字列\`${payloadString}\`が${NAME}の物ではありません。`);
    return;
  }

  /** ペイロード */
  const payload: CepcPacket<'err'> | CepcPacket<'req'> | CepcPacket<'res'> =
    JSON.parse(payloadString);
  if (payload && payload.p === CEPC_PROTOCOL && payload.v === 0) {
    switch (payload.t) {
      case 'req': {
        /** 手続き */
        const procedure = procedures.get(payload.name);
        if (procedure) {
          procedure(payload.data, { payload })
            .then(function (responseData): CepcPacket<'res'> {
              return {
                data: responseData,
                index: payload.index + 1,
                key: payload.key,
                name: payload.name,
                p: CEPC_PROTOCOL,
                timestamp: Date.now(),
                t: 'res',
                v: 0,
              };
            })
            .catch(function (error): CepcPacket<'err'> {
              if (error instanceof CepcError) {
                console.debug(error);
                return {
                  code: error.code || CEPC_ERROR_CODE_INTERNAL,
                  ...(error.data !== undefined && { data: error.data }),
                  index: payload.index + 1,
                  key: payload.key,
                  ...(error.message && { message: error.message }),
                  name: payload.name,
                  p: CEPC_PROTOCOL,
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
                  p: CEPC_PROTOCOL,
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
              code: CEPC_ERROR_CODE_UNDEFINED,
              index: payload.index + 1,
              key: payload.key,
              name: payload.name,
              p: CEPC_PROTOCOL,
              timestamp: Date.now(),
              t: 'err',
              v: 0,
            } satisfies CepcPacket<'err'>),
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
          callback[1](new CepcError(payload.code, payload.message, { data: payload.data }));
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
    console.error(`[${NAME}] ペイロード文字列\`${payloadString}\`が無効な形式です。`);
  }
}
