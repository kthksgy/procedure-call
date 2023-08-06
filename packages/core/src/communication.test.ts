import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

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
async function post(payloadString: string) {
  await handle(payloadString, async function (payloadString) {
    await handle(payloadString, function () {});
  });
}

beforeEach(function () {
  reset();
});

test('PING', async function () {
  expect.assertions(1);

  registerProcedure('ping', async function () {
    return 'pong';
  });

  await call<void, string>('ping', undefined, post).then(function (pong) {
    expect(pong).toBe('pong');
  });
});

describe('データ変換', function () {
  beforeEach(function () {
    registerProcedure('echo', function (value: any) {
      return value;
    });
  });

  afterEach(function () {
    reset();
  });

  test.each([
    ['', ''],
    ['abc', 'abc'],
    [0, 0],
    [+0, 0],
    [-0, 0],
    [123, 123],
    [-123, -123],
    [NaN, null],
    [Infinity, null],
    [-Infinity, null],
    [true, true],
    [false, false],
    [{}, {}],
    [
      {
        string1: '',
        string2: 'abc',
        number1: 1,
        number2: -1,
        boolean1: true,
        boolean2: false,
        object1: {},
        object2: {
          string1: '',
          string2: 'abc',
          number1: 1,
          number2: -1,
          boolean1: true,
          boolean2: false,
          object1: {},
          object2: {},
          array1: [],
          array2: [
            '',
            'abc',
            1,
            -1,
            true,
            false,
            {},
            {
              string1: '',
              string2: 'abc',
              number1: 1,
              number2: -1,
              boolean1: true,
              boolean2: false,
              object1: {},
              object2: {
                string1: '',
                string2: 'abc',
                number1: 1,
                number2: -1,
                boolean1: true,
                boolean2: false,
                object1: {},
                array1: [],
                null: null,
              },
              array1: [],
              null: null,
            },
            [],
            [
              '',
              'abc',
              1,
              -1,
              true,
              false,
              {},
              {
                string1: '',
                string2: 'abc',
                number1: 1,
                number2: -1,
                boolean1: true,
                boolean2: false,
                object1: {},
                object2: {
                  string1: '',
                  string2: 'abc',
                  number1: 1,
                  number2: -1,
                  boolean1: true,
                  boolean2: false,
                  object1: {},
                  array1: [],
                  null: null,
                },
                array1: [],
                null: null,
              },
              [],
              null,
            ],
            null,
          ],
          null: null,
        },
        array1: [],
        array2: [
          '',
          'abc',
          1,
          -1,
          true,
          false,
          {},
          {
            string1: '',
            string2: 'abc',
            number1: 1,
            number2: -1,
            boolean1: true,
            boolean2: false,
            object1: {},
            array1: [],
            null: null,
          },
          [],
          [
            '',
            'abc',
            1,
            -1,
            true,
            false,
            {},
            {
              string1: '',
              string2: 'abc',
              number1: 1,
              number2: -1,
              boolean1: true,
              boolean2: false,
              object1: {},
              array1: [],
              null: null,
            },
            [],
            null,
          ],
          null,
        ],
        null: null,
      },
      {
        string1: '',
        string2: 'abc',
        number1: 1,
        number2: -1,
        boolean1: true,
        boolean2: false,
        object1: {},
        object2: {
          string1: '',
          string2: 'abc',
          number1: 1,
          number2: -1,
          boolean1: true,
          boolean2: false,
          object1: {},
          object2: {},
          array1: [],
          array2: [
            '',
            'abc',
            1,
            -1,
            true,
            false,
            {},
            {
              string1: '',
              string2: 'abc',
              number1: 1,
              number2: -1,
              boolean1: true,
              boolean2: false,
              object1: {},
              object2: {
                string1: '',
                string2: 'abc',
                number1: 1,
                number2: -1,
                boolean1: true,
                boolean2: false,
                object1: {},
                array1: [],
                null: null,
              },
              array1: [],
              null: null,
            },
            [],
            [
              '',
              'abc',
              1,
              -1,
              true,
              false,
              {},
              {
                string1: '',
                string2: 'abc',
                number1: 1,
                number2: -1,
                boolean1: true,
                boolean2: false,
                object1: {},
                object2: {
                  string1: '',
                  string2: 'abc',
                  number1: 1,
                  number2: -1,
                  boolean1: true,
                  boolean2: false,
                  object1: {},
                  array1: [],
                  null: null,
                },
                array1: [],
                null: null,
              },
              [],
              null,
            ],
            null,
          ],
          null: null,
        },
        array1: [],
        array2: [
          '',
          'abc',
          1,
          -1,
          true,
          false,
          {},
          {
            string1: '',
            string2: 'abc',
            number1: 1,
            number2: -1,
            boolean1: true,
            boolean2: false,
            object1: {},
            array1: [],
            null: null,
          },
          [],
          [
            '',
            'abc',
            1,
            -1,
            true,
            false,
            {},
            {
              string1: '',
              string2: 'abc',
              number1: 1,
              number2: -1,
              boolean1: true,
              boolean2: false,
              object1: {},
              array1: [],
              null: null,
            },
            [],
            null,
          ],
          null,
        ],
        null: null,
      },
    ],
    [
      {
        number1: NaN,
        number2: Infinity,
        number3: -Infinity,
        symbol1: Symbol(),
        symbol2: Symbol(''),
        array1: [
          NaN,
          Infinity,
          -Infinity,
          Symbol(),
          Symbol(''),
          function () {},
          () => {},
          undefined,
        ],
        function1() {},
        function2: function () {},
        function3: () => {},
        undefined: undefined,
      },
      {
        number1: null,
        number2: null,
        number3: null,
        array1: [null, null, null, null, null, null, null, null],
      },
    ],
    [[], []],
    [
      [
        '',
        'abc',
        1,
        -1,
        true,
        false,
        {},
        {
          string1: '',
          string2: 'abc',
          number1: 1,
          number2: -1,
          boolean1: true,
          boolean2: false,
          object1: {},
          array1: [],
          null: null,
        },
        [],
        [
          '',
          'abc',
          1,
          -1,
          true,
          false,
          {},
          {
            string1: '',
            string2: 'abc',
            number1: 1,
            number2: -1,
            boolean1: true,
            boolean2: false,
            object1: {},
            array1: [],
            null: null,
          },
          [],
          null,
        ],
        null,
      ],
      [
        '',
        'abc',
        1,
        -1,
        true,
        false,
        {},
        {
          string1: '',
          string2: 'abc',
          number1: 1,
          number2: -1,
          boolean1: true,
          boolean2: false,
          object1: {},
          array1: [],
          null: null,
        },
        [],
        [
          '',
          'abc',
          1,
          -1,
          true,
          false,
          {},
          {
            string1: '',
            string2: 'abc',
            number1: 1,
            number2: -1,
            boolean1: true,
            boolean2: false,
            object1: {},
            array1: [],
            null: null,
          },
          [],
          null,
        ],
        null,
      ],
    ],
    [
      [
        NaN,
        Infinity,
        -Infinity,
        Symbol(),
        Symbol(''),
        {
          number1: NaN,
          number2: Infinity,
          number3: -Infinity,
          symbol1: Symbol(),
          symbol2: Symbol(''),
          array1: [
            NaN,
            Infinity,
            -Infinity,
            Symbol(),
            Symbol(''),
            function () {},
            () => {},
            undefined,
          ],
          function1() {},
          function2: function () {},
          function3: () => {},
          undefined: undefined,
        },
        function () {},
        () => {},
        undefined,
      ],
      [
        null,
        null,
        null,
        null,
        null,
        {
          number1: null,
          number2: null,
          number3: null,
          array1: [null, null, null, null, null, null, null, null],
        },
        null,
        null,
        null,
      ],
    ],
    [function () {}, undefined],
    [() => {}, undefined],
    [Symbol(), undefined],
    [Symbol(''), undefined],
    [null, null],
    [undefined, undefined],
  ])('%s', async function (value, expected) {
    expect.assertions(1);

    expect(await call('echo', value, post)).toStrictEqual(expected);
  });
});

test(`${CepcError.name}をそのまま返信する`, async function () {
  expect.assertions(2);

  /** `console.debug` */
  const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(function () {});

  registerProcedure('throw', async function () {
    throw new CepcError('1234', 'Visible Message');
  });

  await call('throw', undefined, post).catch(function (error) {
    expect(error).toEqual(expect.objectContaining({ code: '1234', message: 'Visible Message' }));
  });

  expect(consoleDebugSpy).toHaveBeenCalledOnce();

  consoleDebugSpy.mockRestore();
});

describe(`${CepcError.name}以外のエラーを変換する`, function () {
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
    expect.assertions(2);

    /** `console.error` */
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(function () {});

    registerProcedure('throw', async function () {
      throw new ErrorConstructor('Invisible Message');
    });

    await call('throw', undefined, post).catch(function (error) {
      expect(error).toEqual(
        expect.objectContaining({ code: CEPC_ERROR_CODE_INTERNAL, message: '' }),
      );
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
  await handle(payloadString, post, assist);

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
        code: 'CEPC_UNDEFINED',
      }),
    );
  });

  expect(consoleErrorSpy).toHaveBeenCalledWith(
    '[CEPC] 手続き`unknownProcedure`が登録されていません。',
  );

  consoleErrorSpy.mockRestore();
});

test('コールバックが存在しない場合のレスポンス受信', async function () {
  expect.assertions(1);

  /** `console.error` */
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(function () {});

  await handle(
    'cepc::{"index":1,"key":"KEY","name":"NAME","p":"cepc","timestamp":0,"t":"res","v":0}',
    function () {},
  );
  expect(consoleErrorSpy).toHaveBeenCalledWith(
    '[CEPC] リクエスト`NAME:KEY`のコールバックが存在しないため、レスポンスを受信できません。',
  );

  consoleErrorSpy.mockRestore();
});

test('コールバックが存在しない場合のエラー受信', async function () {
  expect.assertions(1);

  /** `console.error` */
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(function () {});

  await handle(
    'cepc::{"code":"CEPC_INTERNAL","index":1,"key":"KEY","name":"NAME","p":"cepc","timestamp":0,"t":"err","v":0}',
    function () {},
  );
  expect(consoleErrorSpy).toHaveBeenCalledWith(
    '[CEPC] リクエスト`NAME:KEY`のコールバックが存在しないため、エラーを受信できません。',
  );

  consoleErrorSpy.mockRestore();
});
