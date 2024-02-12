/** プロシージャコールエラーコード */
export namespace PROCEDURE_CALL_ERROR_CODE {
  /** プロシージャコールエラーコード: 内部エラー */
  export const INTERNAL = 'PROCEDURE_CALL_INTERNAL';
  /** プロシージャコールエラーコード: タイムアウト */
  export const TIMEOUT = 'PROCEDURE_CALL_TIMEOUT';
  /** プロシージャコールエラーコード: 未定義 */
  export const UNDEFINED = 'PROCEDURE_CALL_UNDEFINED';
  /** プロシージャコールエラーコード: 未初期化 */
  export const UNINITIALIZED = 'PROCEDURE_CALL_UNINITIALIZED';
}

/**
 * プロシージャコールエラー
 */
export class ProcedureCallError<Data = unknown> extends Error {
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

  constructor(code?: string, message?: string, options?: ProcedureCallErrorOptions<Data>) {
    super(message, options && options.cause ? { cause: options.cause } : undefined);

    this.code = code ?? '';
    this.name = ProcedureCallError.name + '[' + this.code + ']';
    this.timestamp = Date.now();

    if (options) {
      if (options.data) {
        this.data = options.data;
      }
    }
  }
}

/**
 * プロシージャコールエラーオプション
 */
export interface ProcedureCallErrorOptions<Data = unknown> extends ErrorOptions {
  /** データ */
  data?: Data;
}
