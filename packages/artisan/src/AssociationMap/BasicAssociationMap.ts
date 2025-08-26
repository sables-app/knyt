import type { AssociationMap } from "./types";

/**
 * A basic implementation of AssociationMap that uses a WeakMap to store values
 * associated with object. This implementation allows for the association of
 * values with object and the retrieval of those values based on the object.
 */
/*
 * ### Private Remarks
 *
 * This is essentially a wrapper around WeakMap, but it provides a more
 * convenient API for associating values with object and adds support for
 * a fallback value.
 */
export class BasicAssociationMap<K extends WeakKey, V>
  implements AssociationMap<K, V | undefined>
{
  #fallback: V | undefined;
  #valueByKey = new WeakMap<K, V>();

  constructor(fallback?: V) {
    this.#fallback = fallback;
  }

  associate(key: K, value: V) {
    this.#valueByKey.set(key, value);
  }

  from(key: K): V | undefined {
    if (!this.#valueByKey.has(key)) {
      return this.#fallback;
    }

    return this.#valueByKey.get(key);
  }

  dissociate(key: K) {
    this.#valueByKey.delete(key);
  }
}
