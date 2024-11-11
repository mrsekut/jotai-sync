/** Represents a result type with success or failure */
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string | null };

/** Helper function to create a success result */
export const ok = <T>(v: T) => ({ ok: true, data: v } as const);

/** Helper function to create a failure result */
export const ng = (v: string | null) => ({ ok: false, error: v } as const);
