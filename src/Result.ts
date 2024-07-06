export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string | null };

export const ok = <T>(v: T) => ({ ok: true, data: v } as const);
export const ng = (v: string | null) => ({ ok: false, error: v } as const);
