import { atom, Atom, PrimitiveAtom, SetStateAction } from 'jotai';
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
  aAtom: PrimitiveAtom<A>,
  bAtom: PrimitiveAtom<B>,
  a2b: (a: A) => Result<B>,
  b2a: (b: B) => Result<A>,
): [PrimitiveAtom<A>, PrimitiveAtom<B>, errorAtom: Atom<string | null>] => {
  const errorAtom = atom<string | null>(null);

  const aAtom_ = atom(
    get => get(aAtom),
    (get, set, update: SetStateAction<A>) => {
      const a = get(aAtom);
      const value = isFunction(update) ? (update as (prev: A) => A)(a) : update;
      const rb = a2b(value);
      if (rb.ok) {
        set(aAtom, update);
        set(bAtom, rb.data); // update B
        set(errorAtom, null);
      } else {
        set(aAtom, update);
        set(errorAtom, rb.error);
      }
    },
  );

  const bAtom_ = atom(
    get => get(bAtom),
    (get, set, update: SetStateAction<B>) => {
      const b = get(bAtom);
      const value = isFunction(update) ? (update as (prev: B) => B)(b) : update;
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

const isFunction = <T>(x: T) => typeof x === 'function';
