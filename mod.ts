import { type WritableAtom, atom, Atom } from "jotai";

export const syncAtoms = <A, B>(
	aAtom: WritableAtom<A, [A], void>,
	bAtom: WritableAtom<B, [B], void>,
	a2b: (a: A) => Result<B>,
	b2a: (b: B) => Result<A>
): [
	WritableAtom<A, [A], void>,
	WritableAtom<B, [B], void>,
	errorAtom: Atom<string | null>
] => {
	const errorAtom = atom<string | null>(null);

	const aAtom_ = atom(
		(get) => get(aAtom),
		(_get, set, value: A) => {
			const rb = a2b(value);
			if (rb.ok) {
				set(aAtom, value);
				set(bAtom, rb.data); // update B
				set(errorAtom, null);
			} else {
				set(aAtom, value);
				set(errorAtom, rb.error);
			}
		}
	);

	const bAtom_ = atom(
		(get) => get(bAtom),
		(_get, set, value: B) => {
			const ra = b2a(value);
			if (ra.ok) {
				set(bAtom, value);
				set(aAtom, ra.data); // update A
				set(errorAtom, null);
			} else {
				set(bAtom, value);
				set(errorAtom, ra.error);
			}
		}
	);

	return [aAtom_, bAtom_, errorAtom];
};

type Result<T> = { ok: true; data: T } | { ok: false; error: string | null };
export const ok = <T>(v: T) => ({ ok: true, data: v } as const);
export const ng = (v: string | null) => ({ ok: false, error: v } as const);
