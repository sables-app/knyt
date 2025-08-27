export class ImmutableRegistry<T> implements Iterable<T> {
  #values: ReadonlySet<T>;

  constructor(values?: Iterable<T>) {
    this.#values = new Set(values);
  }

  /**
   * Returns a new PromiseRegistry instance with the added value.
   */
  with(value: T): ImmutableRegistry<T> {
    return new ImmutableRegistry<T>([...this.#values, value]);
  }

  /**
   * Returns a new PromiseRegistry instance with the removed value.
   */
  without(value: T): ImmutableRegistry<T> {
    return new ImmutableRegistry<T>(
      [...this.#values].filter((p) => p !== value),
    );
  }

  has(value: T): boolean {
    return this.#values.has(value);
  }

  get size(): number {
    return this.#values.size;
  }

  get hasAny(): boolean {
    return this.#values.size > 0;
  }

  [Symbol.iterator](): Iterator<T> {
    return this.#values[Symbol.iterator]();
  }
}
