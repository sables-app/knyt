import type { Observable, Observer, Subscription } from "./types";

/**
 * Converts an observable to a promise.
 *
 * @remarks
 *
 * The promise resolves when the observable emits a value that satisfies
 * the `shouldResolve` function or when the observable completes with a value.
 * The promise rejects if the observable completes without a value, emits an error,
 * is aborted, or times out.
 *
 * @public
 */
export class ObservablePromise<T> implements Observer<T> {
  #deferred = Promise.withResolvers<T>();
  #observable: Observable<T>;
  #shouldResolve: (value: T) => boolean;
  #subscription: Subscription;
  #timeoutId: ReturnType<typeof setTimeout> | undefined;
  #latestValue: { value: T } | undefined;

  get promise(): Promise<T> {
    return this.#deferred.promise;
  }

  constructor(
    observable: Observable<T>,
    options?: ObservablePromise.Options<T>,
  ) {
    this.#observable = observable;

    const { shouldResolve = Boolean, signal, timeout } = options ?? {};

    this.#shouldResolve = shouldResolve;
    this.#subscription = this.#observable.subscribe(this);

    signal?.addEventListener("abort", () => {
      this.#handleError(new Error("Promise was aborted."));
    });

    if (timeout !== undefined) {
      this.#timeoutId = setTimeout(() => {
        this.#handleError(new Error("Promise timed out."));
      }, timeout);
    }
  }

  next(value: T): void {
    this.#latestValue = { value };

    try {
      if (this.#shouldResolve(value)) {
        this.#handleResolve(value);
      }
    } catch (error) {
      this.#handleError(error);
    }
  }

  complete(): void {
    if (this.#latestValue) {
      this.#handleResolve(this.#latestValue.value);
    } else {
      this.#handleError(new Error("Promise was completed without a value."));
    }
  }

  #teardown(): void {
    this.#subscription.unsubscribe();
    clearTimeout(this.#timeoutId);
  }

  #handleResolve(value: T): void {
    this.#teardown();
    this.#deferred.resolve(value);
  }

  #handleError(error: unknown): void {
    this.#teardown();
    this.#deferred.reject(error);
  }
}

export namespace ObservablePromise {
  export type Options<T> = {
    /**
     * A function that determines whether the promise should resolve
     * with the emitted value.
     *
     * @param value - The emitted value.
     * @returns `true` if the promise should resolve, `false` otherwise.
     *
     * @defaultValue `Boolean`
     */
    shouldResolve?: (value: T) => boolean;
    /**
     * An `AbortSignal` that can be used to abort the promise.
     */
    signal?: AbortSignal;
    /**
     * A timeout in milliseconds after which the promise will be rejected.
     */
    timeout?: number;
  };
}
