import { type WritableAtom, atom, Atom } from "jotai";
import { Result } from "./Result";
import { atomFamily } from "jotai/utils";

export const syncAtomFamilies = <Param, A, B>(
	aAtom: (p: Param) => WritableAtom_<A>,
	bAtom: (p: Param) => WritableAtom_<B>,
	a2b: (a: A) => Result<B>,
	b2a: (b: B) => Result<A>
): [
	AtomFamily_<Param, A>,
	AtomFamily_<Param, B>,
	errorAtom: Atom<string | null>
] => {
	const errorAtom = atom<string | null>(null);

	const aAtom_ = atomFamily((p: Param) =>
		atom(
			(get) => get(aAtom(p)),
			(_get, set, value: A) => {
				const rb = a2b(value);
				if (rb.ok) {
					set(aAtom(p), value);
					set(bAtom(p), rb.data); // update B
					set(errorAtom, null);
				} else {
					set(aAtom(p), value);
					set(errorAtom, rb.error);
				}
			}
		)
	);

	const bAtom_ = atomFamily((p: Param) =>
		atom(
			(get) => get(bAtom(p)),
			(_get, set, value: B) => {
				const ra = b2a(value);
				if (ra.ok) {
					set(bAtom(p), value);
					set(aAtom(p), ra.data); // update A
					set(errorAtom, null);
				} else {
					set(bAtom(p), value);
					set(errorAtom, ra.error);
				}
			}
		)
	);

	return [aAtom_, bAtom_, errorAtom];
};

type AtomFamily_<Param, T> = AtomFamily<Param, WritableAtom_<T>>;
type WritableAtom_<A> = WritableAtom<A, [A], void>;

interface AtomFamily<Param, AtomType> {
	(param: Param): AtomType;
	remove(param: Param): void;
	setShouldRemove(shouldRemove: ShouldRemove<Param> | null): void;
}
type ShouldRemove<Param> = (createdAt: number, param: Param) => boolean;
