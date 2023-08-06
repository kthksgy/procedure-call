import { NAME, handle } from 'cepc';

import type { CepcPacket } from 'cepc';

/** オリジン */
const origins = new Set<string | RegExp>();

export function handleWindowClient(event: MessageEvent<string>) {
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
      const post = function (message: string, payload: CepcPacket<'req'>) {
        /** ソース */
        if (event.source !== null) {
          event.source.postMessage(message);
        } else {
          console.error(
            `[${NAME}] \`event.source\`が\`null\`であるため、手続き\`${payload.name}\`のレスポンスを送信できません。`,
          );
        }
      };

      handle(event.data, post);
    }
  }
}

/**
 * Window Clientのリスナーを開始する。
 * @param origin オリジン(デフォルト: 自分のオリジン)
 * @returns 停止する。
 */
export function startWindowClientListener(origin?: string | RegExp) {
  if (
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

  if (
    typeof navigator === 'object' &&
    navigator !== null &&
    typeof navigator.serviceWorker === 'object' &&
    navigator.serviceWorker !== null
  ) {
    navigator.serviceWorker.addEventListener('message', handleWindowClient);
    return function () {
      navigator.serviceWorker.removeEventListener('message', handleWindowClient);
    };
  } else {
    console.error(
      `[${NAME}] Service Workerに対応していないため、Window Clientのソケット関数を開始できません。`,
    );
    return function () {};
  }
}
