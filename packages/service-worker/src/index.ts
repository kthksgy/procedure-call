import { NAME, callTarget, handler } from 'cepc';

import type { CepcPacket } from 'cepc';

/** オリジン */
const origins = new Set<string | RegExp>();
/** 開始されている場合、`true` */
let started = false;

/**
 * WindowClientの手続きを呼び出す。
 * @param windowClient WindowClient
 * @param name 名前
 * @param requestData リクエストデータ
 * @param options オプション
 * @returns レスポンスデータ
 */
export const callWindowClient = callTarget;

/**
 * Message Event Handler
 * @param event Message Event
 */
export async function messageEventHandler(event: MessageEvent<string>) {
  if (typeof event.data === 'string' && event.data.length > 0) {
    /** 実行を許可されている場合、`true` */
    let allowed = false;
    for (const origin of origins) {
      if (
        (typeof origin === 'string' && event.origin === origin) ||
        (origin instanceof RegExp && origin.test(event.origin))
      ) {
        allowed = true;
      }
    }

    if (allowed) {
      /** 送信関数 */
      const post = function (payloadString: string, payload: CepcPacket<'req'>) {
        /** ソース */
        if (event.source !== null) {
          event.source.postMessage(payloadString);
        } else {
          console.error(
            `[${NAME}] \`event.source\`が\`null\`であるため、手続き\`${payload.name}\`のレスポンスを送信できません。`,
          );
        }
      };

      await handler(event.data, post);
    }
  }
}

/**
 * Window Clientのリスナーを開始する。
 * @param origin オリジン(デフォルト: 自分のオリジン)
 * @returns 停止する。
 */
export function startMessageEventHandler(origin?: string | RegExp) {
  if (
    typeof navigator === 'object' &&
    navigator !== null &&
    typeof navigator.serviceWorker === 'object' &&
    navigator.serviceWorker !== null
  ) {
    if (
      origin === undefined &&
      typeof window === 'object' &&
      window !== null &&
      typeof window.location === 'object' &&
      window.location !== null
    ) {
      origin ??= window.location.origin;
    }

    if (origin !== undefined) {
      origins.add(origin);
    }

    if (!started) {
      navigator.serviceWorker.addEventListener('message', messageEventHandler);
      started = true;
    }

    return function () {
      if (origin !== undefined) {
        origins.delete(origin);
      }

      if (origins.size === 0) {
        navigator.serviceWorker.removeEventListener('message', messageEventHandler);
        started = false;
      }
    };
  } else {
    console.error(
      `[${NAME}] Service Workerに対応していないため、Window Clientのソケット関数を開始できません。`,
    );
    return function () {};
  }
}
