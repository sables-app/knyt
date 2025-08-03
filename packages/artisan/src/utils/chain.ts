import { isObservable, type Observable } from "../Observable/mod";

/**
 * @internal scope: workspace
 */
export type ChainTransformer<T, U> = (value: T) => U;

/**
 * @internal scope: workspace
 */
export class ChainLink<T> {
  #value: T;

  constructor(value: T) {
    this.#value = value;
  }

  debug(label: string): ChainLink<T> {
    console.debug(label, this.#value);

    return new ChainLink(this.#value);
  }

  fallback(defaultValue: NonNullable<T>): ChainLink<NonNullable<T>> {
    return new ChainLink(this.#value ?? defaultValue);
  }

  map<U>(transform: ChainTransformer<T, U>): ChainLink<U> {
    return new ChainLink(transform(this.#value));
  }

  tap(callback: (value: T) => void): ChainLink<T> {
    callback(this.#value);

    return new ChainLink(this.#value);
  }

  get(): T {
    return this.#value;
  }

  subscribe(
    subscriber: T extends Observable<infer U>
      ? Observable.Subscriber<U>
      : never,
  ): ChainLink<T> {
    if (!isObservable(this.#value)) {
      throw new Error("Cannot subscribe to a non-observable value");
    }

    this.#value.subscribe(subscriber);

    return new ChainLink(this.#value);
  }
}

/**
 * Creates a chainable link that allows for transformations and retrieval of a value
 *
 * @beta This API is in beta and may change in future releases.
 */
export function chain<T>(value: T): ChainLink<T> {
  return new ChainLink(value);
}
