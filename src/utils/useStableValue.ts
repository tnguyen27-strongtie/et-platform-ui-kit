import { useState } from 'react';

/** Structural equality for plain objects/arrays; anything else (functions, class instances) by identity. */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const plain = (o: object) => Array.isArray(o) || Object.getPrototypeOf(o) === Object.prototype;
  if (!plain(a) || !plain(b)) return false;
  const keysA = Object.keys(a);
  if (keysA.length !== Object.keys(b).length) return false;
  return keysA.every((k) => Object.hasOwn(b, k) && deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
}

/**
 * Returns the previous value while the new one is deep-equal, so props that callers usually pass
 * inline (arrays of keys, option objects) can be used as memo/effect dependencies.
 */
export function useStableValue<T>(value: T): T {
  const [stable, setStable] = useState(value);
  if (stable === value || deepEqual(stable, value)) return stable;
  setStable(value); // state update during render: React re-renders at once with the new value
  return value;
}
