import { describe, expect, test } from 'vitest';

/** 名前 */
export const NAME = 'CEPC';
/** バージョン */
export const VERSION = __version;

/** 文字 */
const CHARACTERS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * 62進数文字列を生成する。
 * @param x 10進数
 * @returns 62進数文字列
 */
function generateDuosexagesimalString(x: number) {
  /** 文字 */
  const characters = [];
  for (; x > 0; x = Math.floor(x / CHARACTERS.length)) {
    characters.unshift(CHARACTERS.at(x % CHARACTERS.length));
  }
  return characters.length > 0 ? characters.join('') : '0';
}

/**
 * 乱文字列
 * @param length 文字数
 * @returns 乱文字列
 */
function generateRandomString(length: number) {
  return Array.from({ length: Math.max(length, 0) })
    .map(function () {
      return CHARACTERS[Math.floor(CHARACTERS.length * Math.random())];
    })
    .join('');
}

/** CEPCエラーコード: 内部エラー */
export const CEPC_ERROR_CODE_INTERNAL = 'CEPC_INTERNAL';
/** CEPCエラーコード: タイムアウト */
export const CEPC_ERROR_CODE_TIMEOUT = 'CEPC_TIMEOUT';
/** CEPCエラーコード: 未定義 */
export const CEPC_ERROR_CODE_UNDEFINED = 'CEPC_UNDEFINED';
/** CEPCエラーコード: 未初期化 */
export const CEPC_ERROR_CODE_UNINITIALIZED = 'CEPC_UNINITIALIZED';
/** CEPC識別子 */
const CEPC_IDENTIFIER = generateDuosexagesimalString(Date.now()) + ':' + generateRandomString(4);
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
 */
export interface CepcErrorOptions<Data = unknown> extends ErrorOptions {
  /** データ */
  data?: Data;
}

/**
 * CEPCパケット
 */
type CepcPacket<
  Type extends 'err' | 'req' | 'res',
  Version extends CepcVersionUnion = 0,
  Data = unknown,
> = CepcRawPacket<Type, Version, Jsonized<Data, object>>;

/**
 * CEPC手続き
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
 */
export type CepcProcedureCallOptions = {
  /** タイムアウト時間[ミリ秒] */
  timeout?: number;
};

/**
 * CEPCローパケット
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
  ? { code: string; data?: Data; message?: string }
  : Type extends 'req'
  ? { data: Data }
  : Type extends 'res'
  ? { data: Data }
  : unknown);

/** CEPCバージョンユニオン */
type CepcVersionUnion = 0;

/**
 * バリューが`never`のキーが省略された
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
 * 既定の手続きが登録されている場合、`true`を返す。
 * @param name 名前
 * @param procedure 手続き
 * @returns 真偽値
 *
 * - 名前のみ指定した場合、その名前で手続きが登録されている場合に`true`を返す。
 * - 手続きのみ指定した場合、その手続きが何れかの名前で登録されている場合に`true`を返す。
 * - 名前と手続きを指定した場合、その名前でその手続きが登録されている場合に`true`を返す。
 */
export function isDefaultProcedureRegistered(name?: string, procedure?: any) {
  if (name !== undefined) {
    if (procedure !== undefined) {
      return defaultProcedures.get(name) === procedure;
    } else {
      return defaultProcedures.has(name);
    }
  } else if (procedure !== undefined) {
    return Array.from(defaultProcedures.values()).includes(procedure);
  } else {
    return false;
  }
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

/**
 * ペイロード文字列を解析する。
 * @param payloadString ペイロード文字列
 * @returns ペイロード
 */
function parsePayloadString(
  payloadString: string,
): CepcPacket<'err'> | CepcPacket<'req'> | CepcPacket<'res'> | undefined {
  if (payloadString.startsWith(CEPC_PAYLOAD_STRING_PREFIX)) {
    try {
      /** ペイロード */
      const payload = JSON.parse(payloadString.slice(CEPC_PAYLOAD_STRING_PREFIX.length));
      if (
        typeof payload === 'object' &&
        payload !== null &&
        payload.p === CEPC_PROTOCOL &&
        payload.v === 0
      ) {
        return payload;
      } else {
        return undefined;
      }
    } catch {
      return undefined;
    }
  } else {
    return undefined;
  }
}

/**
 * 既定の手続きを登録する。
 * @param name 名前
 * @param procedure 手続き
 * @returns 既定の手続きを登録解除する。
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
  /** ペイロード */
  const payload = parsePayloadString(payloadString);
  if (payload !== undefined) {
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
                  code: CEPC_ERROR_CODE_INTERNAL,
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
              post(CEPC_PAYLOAD_STRING_PREFIX + JSON.stringify(response), payload);
            });
        } else {
          console.error(`[${NAME}] 手続き\`${payload.name}\`が登録されていません。`);
          post(
            CEPC_PAYLOAD_STRING_PREFIX +
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

if (import.meta.vitest) {
  test('数字／英大文字／英小文字の文字数', function () {
    expect(CHARACTERS.length).toBe(10 + 26 * 2);
  });

  describe(`${generateDuosexagesimalString.name}`, function () {
    test.each([
      [0, '0'],
      [1, '1'],
      [61, 'z'],
      [62, '10'],
    ])('"%d" => "%s"', function (n, s) {
      expect(generateDuosexagesimalString(n)).toBe(s);
    });
  });

  test(`${generateRandomString.name}`, function () {
    expect(generateRandomString(0)).toBe('');
    expect(generateRandomString(-1)).toBe('');
    for (let length = 1; length <= 64; length++) {
      /** 正規表現 */
      const regularExpression = new RegExp(`^[0-9A-Za-z]{${length}}$`);
      for (let i = 0; i < 128; i++) {
        expect(generateRandomString(length)).toMatch(regularExpression);
      }
    }
  });

  test(`識別子"${CEPC_IDENTIFIER}"の形式`, function () {
    expect(CEPC_IDENTIFIER).toMatch(/^[0-9A-Za-z]+:[0-9A-Za-z]{4}$/);
  });

  test(`${parsePayloadString.name}`, function () {
    // TODO: テストを書く。
    expect(1).toBe(1);
  });
}
