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
 * CEPCコンテキスト
 */
export type CepcContext<Data = unknown, Context extends object = object> = {
  /** ペイロード */
  payload: CepcPacket<'req', CepcVersionUnion, Data>;
} & Partial<Context>;

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
export type CepcPacket<
  Type extends 'err' | 'req' | 'res',
  Version extends CepcVersionUnion = 0,
  Data = unknown,
> = CepcRawPacket<Type, Version, Jsonized<Data, object>>;

/**
 * CEPC手続き
 */
export type CepcProcedure<
  RequestData = any,
  ResponseData = any,
  Context extends object = object,
> = {
  /**
   * @param requestData リクエストデータ
   * @param context コンテキスト
   * @returns レスポンスデータ
   * @throws {CepcError} エラー
   */
  (
    requestData: RequestData,
    context: CepcContext<RequestData, Context>,
  ): ResponseData | Promise<ResponseData>;
};

/**
 * CEPC手続き呼び出しオプション
 */
export type CepcProcedureCallOptions = {
  /** タイムアウト時間[ミリ秒] */
  timeout?: number;
};

/** CEPCプロトコル */
export type CepcProtocol = 'cepc';

/**
 * CEPCローパケット
 */
export type CepcRawPacket<
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
  p: CepcProtocol;
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
export type CepcVersionUnion = 0;

/**
 * バリューが`never`のキーが省略された
 */
export type NeverOmitted<Type> = Type extends object
  ? { [Key in keyof Type as Type[Key] extends never ? never : Key]: Type[Key] }
  : Type;
