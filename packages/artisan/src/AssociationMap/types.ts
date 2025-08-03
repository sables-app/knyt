export type AssociationMap<K extends WeakKey, V> = {
  /**
   * Associate the value with an object.
   */
  associate(request: K, value: V): void;
  /**
   * Get the value associated with an object.
   */
  from(request: K): V;
  /**
   * Dissociate the value from an object.
   */
  dissociate(request: K): void;
};
