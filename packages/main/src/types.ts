/**
 * JSON化された
 */
export type Jsonized<Type, Parent extends object | Array<any> | undefined> = Type extends
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
 * プロシージャコールコンテキスト
 */
export type ProcedureCallContext<Data = unknown, Context extends object = object> = {
  /** ペイロード */
  payload: ProcedureCallPacket<'req', ProcedureCallVersionUnion, Data>;
} & Partial<Context>;

/**
 * プロシージャコールパケット
 */
export type ProcedureCallPacket<
  Type extends 'err' | 'req' | 'res',
  Version extends ProcedureCallVersionUnion = 0,
  Data = unknown,
> = ProcedureCallRawPacket<Type, Version, Jsonized<Data, object>>;

/**
 * プロシージャ
 */
export type Procedure<RequestData = any, ResponseData = any, Context extends object = object> = {
  /**
   * @param requestData リクエストデータ
   * @param context コンテキスト
   * @returns レスポンスデータ
   * @throws {ProcedureCallError} エラー
   */
  (
    requestData: RequestData,
    context: ProcedureCallContext<RequestData, Context>,
  ): ResponseData | Promise<ResponseData>;
};

/**
 * プロシージャコールオプション
 */
export type ProcedureCallOptions = {
  /** タイムアウト時間[ミリ秒] */
  timeout?: number;
};

/** プロシージャコールプロトコル */
export type ProcedureCallProtocol = 'pc';

/**
 * プロシージャコールローパケット
 */
export type ProcedureCallRawPacket<
  Type extends 'err' | 'req' | 'res',
  Version extends ProcedureCallVersionUnion = 0,
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
  p: ProcedureCallProtocol;
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

/** プロシージャコールバージョンユニオン */
export type ProcedureCallVersionUnion = 0;

/**
 * バリューが`never`のキーが省略された
 */
export type NeverOmitted<Type> = Type extends object
  ? { [Key in keyof Type as Type[Key] extends never ? never : Key]: Type[Key] }
  : Type;
