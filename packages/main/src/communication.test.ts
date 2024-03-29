import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { ProcedureCallError, call, callTarget, handler, registerProcedure, reset } from './index';

/**
 * 送信関数
 * @param payloadString ペイロード文字列
 *
 * @description 自分自身に送信する。
 */
function post(payloadString: string) {
  handler(payloadString, function (payloadString) {
    handler(payloadString, function () {});
  });
}

beforeEach(function () {
  reset();
});

test(`PING(${call.name})`, async function () {
  expect.assertions(1);

  registerProcedure('ping', async function () {
    return 'pong';
  });

  await call<void, string>('ping', undefined, post).then(function (pong) {
    expect(pong).toBe('pong');
  });
});

describe(`${callTarget.name}`, function () {
  beforeEach(function () {
    registerProcedure('ping', async function () {
      return 'pong';
    });
  });

  afterEach(function () {
    reset();
  });

  test(`PING`, async function () {
    expect.assertions(1);

    /** 対象 */
    const target = {
      postMessage(payloadString: string) {
        post(payloadString);
      },
    };
    await callTarget(target, 'ping', undefined).then(function (pong) {
      expect(pong).toBe('pong');
    });
  });

  test.each([
    {},
    { postMessage: 0 },
    { postMessage: 1 },
    { postMessage: '' },
    { postMessage: 'abc' },
    null,
    undefined,
  ])(`対象が\`%s\``, async function (target: any) {
    expect.assertions(3);

    /** `console.error` */
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(function () {});

    await callTarget(target, 'ping', undefined).catch(function (error) {
      expect(error).toBeInstanceOf(ProcedureCallError);
      expect(error.code).toBe('PROCEDURE_CALL_UNINITIALIZED');
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[PROCEDURE_CALL] `target.postMessage`が初期化されていないため、手続き`ping`のリクエストを送信できません。',
    );

    consoleErrorSpy.mockRestore();
  });
});

test('タイムアウト', async function () {
  expect.assertions(2);

  registerProcedure('10seconds', async function () {
    return new Promise(function (resolve) {
      setTimeout(resolve, 10000);
    });
  });

  await call('10seconds', undefined, post, { timeout: 100 }).catch(function (error) {
    expect(error).toBeInstanceOf(ProcedureCallError);
    expect(error.code).toBe('PROCEDURE_CALL_TIMEOUT');
  });
});

test(`${ProcedureCallError.name}をそのまま返信する`, async function () {
  expect.assertions(6);

  /** `console.debug` */
  const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(function () {});

  registerProcedure('throw', async function () {
    /** 原因 */
    const cause = new Error();
    throw new ProcedureCallError('1234', 'Visible Message', { cause, data: { a: 1 } });
  });

  await call('throw', undefined, post).catch(function (error) {
    expect(error).toBeInstanceOf(ProcedureCallError);
    expect(error.cause).toBe(undefined);
    expect(error.code).toBe('1234');
    expect(error.data).toStrictEqual({ a: 1 });
    expect(error.message).toBe('Visible Message');
  });

  expect(consoleDebugSpy).toHaveBeenCalledOnce();

  consoleDebugSpy.mockRestore();
});

test(`${ProcedureCallError.name}のエラーコードが空の場合に上書きする`, async function () {
  expect.assertions(3);

  /** `console.debug` */
  const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(function () {});

  registerProcedure('throw', async function () {
    throw new ProcedureCallError();
  });

  await call('throw', undefined, post).catch(function (error) {
    expect(error).toBeInstanceOf(ProcedureCallError);
    expect(error.code).toBe('PROCEDURE_CALL_INTERNAL');
  });

  expect(consoleDebugSpy).toHaveBeenCalledOnce();

  consoleDebugSpy.mockRestore();
});

describe(`${ProcedureCallError.name}以外のエラーを変換する`, function () {
  /** カスタムエラー */
  class CustomError extends Error {}

  test.each([
    CustomError,
    Error,
    EvalError,
    RangeError,
    ReferenceError,
    SyntaxError,
    TypeError,
    URIError,
  ])(`%s`, async function (ErrorConstructor) {
    expect.assertions(4);

    /** `console.error` */
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(function () {});

    registerProcedure('throw', async function () {
      throw new ErrorConstructor('Invisible Message');
    });

    await call('throw', undefined, post).catch(function (error) {
      expect(error).toBeInstanceOf(ProcedureCallError);
      expect(error.code).toBe('PROCEDURE_CALL_INTERNAL');
      expect(error.message).toBe('');
    });

    expect(consoleErrorSpy).toHaveBeenCalledOnce();

    consoleErrorSpy.mockRestore();
  });
});

test('補助関数', async function () {
  expect.assertions(2);

  /** 補助関数 */
  const assist = vi.fn();
  /** 送信関数 */
  const post = vi.fn();

  /** ペイロード文字列 */
  const payloadString = 'INVALID_PAYLOAD_STRING';
  await handler(payloadString, post, assist);

  expect(assist).toBeCalledWith(payloadString);
  expect(post).not.toHaveBeenCalled();
});

test('手続きが登録されていない', async function () {
  expect.assertions(2);

  /** `console.error` */
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(function () {});

  await call('unknownProcedure', undefined, post).catch(function (error) {
    expect(error).toEqual(
      expect.objectContaining({
        code: 'PROCEDURE_CALL_UNDEFINED',
      }),
    );
  });

  expect(consoleErrorSpy).toHaveBeenCalledWith(
    '[PROCEDURE_CALL] 手続き`unknownProcedure`が登録されていません。',
  );

  consoleErrorSpy.mockRestore();
});

test('無効なペイロード文字列を受信した', async function () {
  expect.assertions(1);

  /** `console.error` */
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(function () {});

  await handler('', function () {});
  expect(consoleErrorSpy).toHaveBeenCalledWith(
    '[PROCEDURE_CALL] ペイロード文字列``が無効な形式です。',
  );

  consoleErrorSpy.mockRestore();
});

test('コールバックが存在しない場合のレスポンス受信', async function () {
  expect.assertions(1);

  /** `console.error` */
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(function () {});

  await handler(
    'pc::{"index":1,"key":"KEY","name":"NAME","p":"pc","timestamp":0,"t":"res","v":0}',
    function () {},
  );
  expect(consoleErrorSpy).toHaveBeenCalledWith(
    '[PROCEDURE_CALL] リクエスト`NAME:KEY`のコールバックが存在しないため、レスポンスを受信できません。',
  );

  consoleErrorSpy.mockRestore();
});

test('コールバックが存在しない場合のエラー受信', async function () {
  expect.assertions(1);

  /** `console.error` */
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(function () {});

  await handler(
    'pc::{"code":"PROCEDURE_CALL_INTERNAL","index":1,"key":"KEY","name":"NAME","p":"pc","timestamp":0,"t":"err","v":0}',
    function () {},
  );
  expect(consoleErrorSpy).toHaveBeenCalledWith(
    '[PROCEDURE_CALL] リクエスト`NAME:KEY`のコールバックが存在しないため、エラーを受信できません。',
  );

  consoleErrorSpy.mockRestore();
});
