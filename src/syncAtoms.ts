import { atom, Atom, SetStateAction, useSetAtom, WritableAtom } from 'jotai';
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
    (get, set, update: SetStateAction<A>) => {
      const a = get(aAtom);
      const value = isFunction(update) ? (update as (prev: A) => A)(a) : update;
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

type WritableAtom_<A> = WritableAtom<A, [A], void>;
const isFunction = <T>(x: T) => typeof x === 'function';

if (import.meta.vitest) {
  const { test, expectTypeOf } = import.meta.vitest;

  const anyF = (v: any) => v as any;

  test('No type error when an atom is passed as an argument', () => {
    const aAtom = atom(0);
    const bAtom = atom('0');
    type SyncAtoms = typeof syncAtoms<number, string>;

    expectTypeOf<SyncAtoms>().toBeCallableWith(aAtom, bAtom, anyF, anyF);
  });

  test('No type error when a derived atom is passed as an argument', () => {
    const xAtom = atom(0);
    const aAtom = atom(
      get => get(xAtom),
      (_get, set, update: number) => set(xAtom, update),
    );
    const bAtom = atom('0');

    type SyncAtoms = typeof syncAtoms<number, string>;

    expectTypeOf<SyncAtoms>().toBeCallableWith(aAtom, bAtom, anyF, anyF);
  });

  test('Return value works with setter accepting a function', () => {
    const _aAtom = atom(0);
    const _bAtom = atom('0');
    const [aAtom] = syncAtoms(_aAtom, _bAtom, anyF, anyF);

    // useSetAtom can only be called within React context, so we emulate the type
    const useSetAtom_: typeof useSetAtom = (() => {}) as any;
    const setA = useSetAtom_(aAtom);
    type SetA = typeof setA;

    expectTypeOf<SetA>().toBeCallableWith(1);
    expectTypeOf<SetA>().toBeCallableWith(p => p + 1);
  });
}
