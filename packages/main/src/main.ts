import { describe, expect, test, vi } from 'vitest';

import { PROCEDURE_CALL_ERROR_CODE, ProcedureCallError } from './error';
import { NAME } from './package';
import { generateDuosexagesimalString, generateRandomString } from './utilities';

import type {
  Jsonized,
  Procedure,
  ProcedureCallOptions,
  ProcedureCallPacket,
  ProcedureCallRawPacket,
} from './types';

/** プロシージャコール識別子 */
const PROCEDURE_CALL_IDENTIFIER =
  generateDuosexagesimalString(Date.now()) + ':' + generateRandomString(4);
/** プロシージャコールペイロード文字列接頭辞 */
export const PROCEDURE_CALL_PAYLOAD_STRING_PREFIX = 'pc::';
/** プロシージャコールプロトコル */
export const PROCEDURE_CALL_PROTOCOL = 'pc';

/** コールバック */
const callbacks = new Map<string, [{ (value: any): void }, { (reason?: any): void }]>();
/** 既定の手続き */
const defaultProcedures = new Map<string, Procedure>();
/** カウンター */
let n = 0;
/** 手続き */
const procedures = new Map<string, Procedure>();

/**
 * 手続きを呼び出す。
 * @param name 名前
 * @param requestData リクエストデータ
 * @param post 送信関数
 * @param options オプション
 * @returns レスポンスデータ
 */
export async function call<RequestData, ResponseData>(
  name: string,
  requestData: RequestData,
  post: { (payloadString: string): void | PromiseLike<void> },
  options?: ProcedureCallOptions,
): Promise<Jsonized<Awaited<ResponseData>, object>> {
  /** キー */
  const key = PROCEDURE_CALL_IDENTIFIER + ':' + String(n++);

  /** リクエスト */
  const request: ProcedureCallRawPacket<'req'> = {
    data: requestData,
    index: 0,
    key,
    name,
    p: PROCEDURE_CALL_PROTOCOL,
    timestamp: Date.now(),
    t: 'req',
    v: 0,
  };

  /** プロミス */
  const promise = new Promise<Jsonized<Awaited<ResponseData>, object>>(function (resolve, reject) {
    callbacks.set(key, [resolve, reject]);

    if (options?.timeout !== undefined && Number.isFinite(options.timeout) && options.timeout > 0) {
      setTimeout(function () {
        reject(new ProcedureCallError(PROCEDURE_CALL_ERROR_CODE.TIMEOUT));
        callbacks.delete(key);
      }, options.timeout);
    }
  });

  await Promise.resolve(post(PROCEDURE_CALL_PAYLOAD_STRING_PREFIX + JSON.stringify(request)));

  return promise;
}

/**
 * 対象の手続きを呼び出す。
 * @param target 対象
 * @param name 名前
 * @param requestData リクエストデータ
 * @param options オプション
 * @returns レスポンスデータ
 */
export async function callTarget<RequestData, ResponseData>(
  target: { postMessage: { (message: string): void } } | null | undefined,
  name: string,
  requestData: RequestData,
  options?: ProcedureCallOptions,
): Promise<Jsonized<Awaited<ResponseData>, object>> {
  if (
    typeof target === 'object' &&
    target !== null &&
    'postMessage' in target &&
    typeof target.postMessage === 'function'
  ) {
    return call(name, requestData, target.postMessage.bind(target), options);
  } else {
    console.error(
      `[${NAME}] \`target.postMessage\`が初期化されていないため、手続き\`${name}\`のリクエストを送信できません。`,
    );
    throw new ProcedureCallError(PROCEDURE_CALL_ERROR_CODE.UNINITIALIZED);
  }
}

/**
 * ハンドラー
 * @param payloadString ペイロード文字列
 * @param post 送信関数
 * @param assist 補助関数
 */
export async function handler(
  payloadString: string,
  post: { (payloadString: string, payload: ProcedureCallPacket<'req'>): void | PromiseLike<void> },
  assist?: { (payloadString: string): void | PromiseLike<void> },
) {
  /** ペイロード */
  const payload = parsePayloadString(payloadString);
  if (payload !== undefined) {
    switch (payload.t) {
      case 'req': {
        /** 手続き */
        const procedure = procedures.get(payload.name);
        if (procedure) {
          await Promise.resolve(procedure(payload.data, { payload }))
            .then(function (responseData): ProcedureCallPacket<'res'> {
              return {
                data: responseData,
                index: payload.index + 1,
                key: payload.key,
                name: payload.name,
                p: PROCEDURE_CALL_PROTOCOL,
                timestamp: Date.now(),
                t: 'res',
                v: 0,
              };
            })
            .catch(function (error): ProcedureCallPacket<'err'> {
              if (error instanceof ProcedureCallError) {
                console.debug(error);
                return {
                  code: error.code || PROCEDURE_CALL_ERROR_CODE.INTERNAL,
                  ...(error.data !== undefined && { data: error.data }),
                  index: payload.index + 1,
                  key: payload.key,
                  ...(error.message && { message: error.message }),
                  name: payload.name,
                  p: PROCEDURE_CALL_PROTOCOL,
                  timestamp: error.timestamp,
                  t: 'err',
                  v: 0,
                };
              } else {
                console.error(error);
                return {
                  code: PROCEDURE_CALL_ERROR_CODE.INTERNAL,
                  index: payload.index + 1,
                  key: payload.key,
                  name: payload.name,
                  p: PROCEDURE_CALL_PROTOCOL,
                  timestamp: Date.now(),
                  t: 'err',
                  v: 0,
                };
              }
            })
            .then(function (response) {
              return post(PROCEDURE_CALL_PAYLOAD_STRING_PREFIX + JSON.stringify(response), payload);
            });
        } else {
          console.error(`[${NAME}] 手続き\`${payload.name}\`が登録されていません。`);
          await Promise.resolve(
            post(
              PROCEDURE_CALL_PAYLOAD_STRING_PREFIX +
                JSON.stringify({
                  code: PROCEDURE_CALL_ERROR_CODE.UNDEFINED,
                  index: payload.index + 1,
                  key: payload.key,
                  name: payload.name,
                  p: PROCEDURE_CALL_PROTOCOL,
                  timestamp: Date.now(),
                  t: 'err',
                  v: 0,
                } satisfies ProcedureCallPacket<'err'>),
              payload,
            ),
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
          callback[1](
            new ProcedureCallError(payload.code, payload.message, { data: payload.data }),
          );
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
    if (assist) {
      await Promise.resolve(assist(payloadString));
    } else {
      console.error(`[${NAME}] ペイロード文字列\`${payloadString}\`が無効な形式です。`);
    }
  }
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
):
  | ProcedureCallPacket<'err'>
  | ProcedureCallPacket<'req'>
  | ProcedureCallPacket<'res'>
  | undefined {
  if (
    typeof payloadString === 'string' &&
    payloadString.startsWith(PROCEDURE_CALL_PAYLOAD_STRING_PREFIX)
  ) {
    try {
      /** ペイロード */
      const payload = JSON.parse(payloadString.slice(PROCEDURE_CALL_PAYLOAD_STRING_PREFIX.length));
      if (
        typeof payload === 'object' &&
        payload !== null &&
        payload.p === PROCEDURE_CALL_PROTOCOL &&
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
  procedure: Procedure<Jsonized<RequestData, object>, Awaited<ResponseData>>,
) {
  if (!procedures.has(name) || procedures.get(name) === defaultProcedures.get(name)) {
    procedures.set(name, procedure);
  }
  defaultProcedures.set(name, procedure);
  return function () {
    if (procedures.get(name) === procedure) {
      procedures.delete(name);
    }
    if (defaultProcedures.get(name) === procedure) {
      defaultProcedures.delete(name);
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
  procedure: Procedure<Jsonized<RequestData, object>, Awaited<ResponseData>>,
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
 * リセットする。
 */
export function reset() {
  callbacks.clear();
  defaultProcedures.clear();
  n = 0;
  procedures.clear();
}

if (import.meta.vitest) {
  test(`識別子"${PROCEDURE_CALL_IDENTIFIER}"の形式`, function () {
    expect(PROCEDURE_CALL_IDENTIFIER).toMatch(/^[0-9A-Za-z]+:[0-9A-Za-z]{4}$/);
  });

  test(`${call.name}: \`n\`の増加`, async function () {
    expect.assertions(3);

    /** `console.error` */
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(function () {});

    reset();
    expect(n).toBe(0);
    await call('procedure', undefined, async function post(payloadString: string) {
      await handler(payloadString, async function (payloadString) {
        await handler(payloadString, function () {});
      });
    }).catch(function () {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
    expect(n).toBe(1);
  });

  describe(`${parsePayloadString.name}`, function () {
    test.each([
      'pc::{"index":1,"key":"KEY","name":"NAME","p":"pc","timestamp":0,"t":"res","v":0}',
      'pc::{"code":"PROCEDURE_CALL_INTERNAL","index":1,"key":"KEY","name":"NAME","p":"pc","timestamp":0,"t":"err","v":0}',
    ])(`Truthy %#`, function (payloadString) {
      expect(parsePayloadString(payloadString)).toBeTruthy();
    });

    test.each(['', 'abc', 'pc::', 'pc::abc', 'pc::{}'])(`Falsy %#`, function (payloadString) {
      expect(parsePayloadString(payloadString)).toBeFalsy();
    });
  });

  test(`${reset.name}`, function () {
    callbacks.set('TEST', [function () {}, function () {}]);
    n = 123;
    defaultProcedures.set('TEST', function () {});
    procedures.set('TEST', function () {});

    reset();

    expect(callbacks.size).toBe(0);
    expect(n).toBe(0);
    expect(defaultProcedures.size).toBe(0);
    expect(procedures.size).toBe(0);
  });
}
