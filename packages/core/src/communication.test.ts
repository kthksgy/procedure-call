import { beforeEach, describe, expect, test } from 'vitest';

import {
  CEPC_ERROR_CODE_INTERNAL,
  CepcError,
  call,
  handle,
  registerProcedure,
  reset,
} from './index';

/**
 * 送信関数
 * @param payloadString ペイロード文字列
 *
 * @description 自分自身に送信する。
 */
function post(payloadString: string) {
  handle(payloadString, function (payloadString) {
    handle(payloadString, function () {});
  });
}

beforeEach(function () {
  reset();
});

test('基本の通信', function () {
  registerProcedure('ping', async function (ping: string) {
    if (ping === 'ping') {
      return 'pong';
    } else {
      throw new Error();
    }
  });

  expect(call<string, string>('ping', 'ping', post)).resolves.toBe('pong');
  expect(call<string, string>('ping', 'pang', post)).rejects.toThrow(CepcError);
});

test(`${CepcError.name}をそのまま返信する`, function () {
  registerProcedure('throw', async function () {
    throw new CepcError(CEPC_ERROR_CODE_INTERNAL, 'Visible Message');
  });
  expect(call('throw', undefined, post)).rejects.toThrow('Visible Message');
});

describe(`${CepcError.name}以外のエラーを変換する`, function () {
  test.each([Error, EvalError, RangeError, ReferenceError, SyntaxError, TypeError, URIError])(
    `%s`,
    async function (ErrorConstructor, expectedMessage) {
      registerProcedure('throw', async function () {
        throw new ErrorConstructor('Invisible Message');
      });
      expect(call('throw', undefined, post)).rejects.toThrow(expectedMessage);
    },
  );
});

test('補助関数', function () {
  /** コールバック */
  let callback: { (value: boolean): void };
  /** プロミス */
  const promise = new Promise<boolean>(function (resolve) {
    callback = resolve;
  });

  /** ペイロード文字列1 */
  const payloadString1 = 'INVALID_PAYLOAD_STRING';
  handle(
    payloadString1,
    /** 送信関数 */
    function () {
      callback(false);
    },
    /** 補助関数 */
    function (payloadString2) {
      callback(payloadString2 === payloadString1);
    },
  );

  expect(promise).resolves.toBe(true);
});