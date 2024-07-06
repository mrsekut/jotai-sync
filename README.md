# jotai-sync

[[Japanese](https://scrapbox.io/mrsekut-p/jotai-sync)]

`jotai-sync` is a simple library for synchronizing two [Jotai](https://github.com/pmndrs/jotai) atoms. It ensures that changes in one atom are reflected in the other atom automatically.

## Installation

```
$ npm install @mrsekut/jotai-sync
```

## Usage

Here is a basic example of how to use `jotai-sync` to synchronize two atoms: `_valueAtom` and `_fieldAtom`.

```tsx
import { atom, useAtom } from 'jotai';
import { syncAtoms, ok, ng } from '@mrsekut/jotai-sync';

// Define the two atoms
const _valueAtom = atom<number>(0);
const _fieldAtom = atom<string>('');

// Create synchronized atoms
const [valueAtom, fieldAtom] = syncAtoms<number, string>(
  _valueAtom,
  _fieldAtom,

  // value → field
  v => ok(v.toString()),

  // field → value
  field => {
    const n = parseInt(field, 10);
    return isNaN(n) ? ng('Invalid number') : ok(n);
  },
);
```

When synchronizing two atoms (`_valueAtom` and `_fieldAtom`):

- `_valueAtom` is used internally.
- `_fieldAtom` is used for external interactions.

By passing these atoms to `syncAtoms`, new `valueAtom` and `fieldAtom` are returned. These new atoms are synchronized: updating one will automatically update the other. If you need to update only one without synchronizing, refer to the original atoms (`_valueAtom` or `_fieldAtom`).

Since we are synchronizing values with different structures, we need to provide conversion functions to transform the values both ways:

- The third argument of `syncAtoms` converts `value` to `field`.
- The fourth argument of `syncAtoms` converts `field` to `value`.

Each conversion function returns a `Result` type. Using the `ok()` and `ng()` utility functions simplifies this process.

## Contributing

Welcome

## LICENSE

MIT
