export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; retryAfterSeconds?: number };

export function actionOk<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function actionFail(
  error: string,
  retryAfterSeconds?: number
): ActionResult<never> {
  return { ok: false, error, retryAfterSeconds };
}
