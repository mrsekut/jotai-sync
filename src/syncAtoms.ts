import { type WritableAtom, atom, Atom } from 'jotai';
import { Result } from './Result';

/**
 * Synchronizes two Jotai atoms by ensuring changes in one atom are reflected in the other atom.
 * Conversion functions (a2b and b2a) are used to transform values between the two atoms' types,
 * and an errorAtom is provided to handle any conversion errors.
 *
 * @param aAtom - The first atom to synchronize
 * @param bAtom - The second atom to synchronize
 * @param a2b - Function to convert from A to B, returning a Result type
 * @param b2a - Function to convert from B to A, returning a Result type
 * @returns A tuple with synchronized versions of aAtom and bAtom, and an errorAtom to capture any errors
 */
export const syncAtoms = <A, B>(
  aAtom: WritableAtom_<A>,
  bAtom: WritableAtom_<B>,
  a2b: (a: A) => Result<B>,
  b2a: (b: B) => Result<A>,
): [WritableAtom_<A>, WritableAtom_<B>, errorAtom: Atom<string | null>] => {
  const errorAtom = atom<string | null>(null);

  const aAtom_ = atom(
    get => get(aAtom),
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
    },
  );

  const bAtom_ = atom(
    get => get(bAtom),
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
    },
  );

  return [aAtom_, bAtom_, errorAtom];
};

type WritableAtom_<A> = WritableAtom<A, [A], void>;
