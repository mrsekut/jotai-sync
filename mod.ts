import { type WritableAtom, atom } from "@jotai/jotai";

export const syncAtoms = <A, B>(
	aAtom: WritableAtom<A, [A], void>,
	bAtom: WritableAtom<B, [B], void>,
	a2b: (a: A) => Result<B>,
	b2a: (b: B) => Result<A>
): [WritableAtom<A, [A], void>, WritableAtom<B, [B], void>] => {
	const aAtom_ = atom(
		(get) => get(aAtom),
		(_get, set, value: A) => {
			const rb = a2b(value);
			if (!rb.ok) return;

			set(aAtom, value);
			set(bAtom, rb.data); // update B
		}
	);

	const bAtom_ = atom(
		(get) => get(bAtom),
		(_get, set, value: B) => {
			const ra = b2a(value);
			if (!ra.ok) return;

			set(bAtom, value);
			set(aAtom, ra.data); // update A
		}
	);

	return [aAtom_, bAtom_];
};

type Result<T> = { ok: true; data: T } | { ok: false; error: unknown };
export const ok = <T>(v: T) => ({ ok: true, data: v } as const);
export const ng = (v: unknown) => ({ ok: false, error: v } as const);
