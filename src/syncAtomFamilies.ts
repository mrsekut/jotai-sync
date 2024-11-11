import { PrimitiveAtom, SetStateAction, atom } from 'jotai';
import { Result } from './Result';
import { atomFamily } from 'jotai/utils';

/**
 * Synchronizes two atom families, ensuring that changes in one atom family
 * are reflected in the other. This function provides synchronized versions of
 * the original atoms for each family parameter and an error atom to capture any conversion errors.
 *
 * @param aAtom - Function to create the first atom family member based on a parameter
 * @param bAtom - Function to create the second atom family member based on a parameter
 * @param a2b - Function to convert from type A to type B, returning a Result type
 * @param b2a - Function to convert from type B to type A, returning a Result type
 * @returns A tuple with synchronized atom families for aAtom and bAtom, and an error atom family
 */
export const syncAtomFamilies = <Param, A, B>(
  aAtom: (p: Param) => PrimitiveAtom<A>,
  bAtom: (p: Param) => PrimitiveAtom<B>,
  a2b: (a: A) => Result<B>,
  b2a: (b: B) => Result<A>,
): [
  AtomFamily_<Param, A>,
  AtomFamily_<Param, B>,
  errorAtom: AtomFamily_<Param, string | null>,
] => {
  const errorAtom = atomFamily((_p: Param) => atom<string | null>(null));

  const aAtom_ = atomFamily((p: Param) =>
    atom(
      get => get(aAtom(p)),
      (get, set, update: SetStateAction<A>) => {
        const a = get(aAtom(p));
        const value = isFunction(update)
          ? (update as (prev: A) => A)(a)
          : update;
        const rb = a2b(value);
        if (rb.ok) {
          set(aAtom(p), value);
          set(bAtom(p), rb.data); // update B
          set(errorAtom(p), null);
        } else {
          set(aAtom(p), value);
          set(errorAtom(p), rb.error);
        }
      },
    ),
  );

  const bAtom_ = atomFamily((p: Param) =>
    atom(
      get => get(bAtom(p)),
      (get, set, update: SetStateAction<B>) => {
        const b = get(bAtom(p));
        const value = isFunction(update)
          ? (update as (prev: B) => B)(b)
          : update;
        const ra = b2a(value);
        if (ra.ok) {
          set(bAtom(p), value);
          set(aAtom(p), ra.data); // update A
          set(errorAtom(p), null);
        } else {
          set(bAtom(p), value);
          set(errorAtom(p), ra.error);
        }
      },
    ),
  );

  return [aAtom_, bAtom_, errorAtom];
};

type AtomFamily_<Param, T> = AtomFamily<Param, PrimitiveAtom<T>>;

interface AtomFamily<Param, AtomType> {
  (param: Param): AtomType;
  remove(param: Param): void;
  setShouldRemove(shouldRemove: ShouldRemove<Param> | null): void;
}
type ShouldRemove<Param> = (createdAt: number, param: Param) => boolean;

const isFunction = <T>(x: T) => typeof x === 'function';
