import { Beacon } from "./Beacon";
import type { Observable, Observer, Subscription } from "./types";

/**
 * An observable that applies a transformation function to each event
 * emitted by a source observable and emits the transformed events.
 */
export class MappedObservable<T, U> extends Beacon<U> implements Observer<T> {
  /**
   * If provided, maintains a strong reference to a source observable
   * to prevent it from being garbage collected.
   */
  readonly #source$: Observable<T> | undefined;
  readonly #transform: (value: T) => U;
  readonly #emitter: Beacon.Emitter<U>;
  #subscription: Subscription | undefined;

  constructor(transform: (value: T) => U, source$?: Observable<T>) {
    let emitter: Beacon.Emitter<U>;

    super((_emitter) => (emitter = _emitter));

    this.#source$ = source$;
    this.#transform = transform;
    this.#emitter = emitter!;
    this.#subscription = this.#source$?.subscribe(this);
  }

  next(event: T): void {
    try {
      this.#emitter.next(this.#transform(event));
    } catch (error) {
      this.error(error);
    }
  }

  error(error: unknown): void {
    this.#emitter.error(error);
    this.#subscription?.unsubscribe();
    this.#subscription = undefined;
  }

  complete(): void {
    this.#emitter.complete();
    this.#subscription?.unsubscribe();
    this.#subscription = undefined;
  }
}

/**
 * Creates an observable that applies a transformation function to each event
 * emitted by a source observable and emits the transformed events.
 */
export function mapObservable<T, U>(
  transform: (value: T) => U,
): (source$: Observable<T>) => MappedObservable<T, U>;

export function mapObservable<T, U>(
  source$: Observable<T>,
  transform: (value: T) => U,
): MappedObservable<T, U>;

export function mapObservable<T, U>(
  arg1: Observable<T> | ((value: T) => U),
  arg2?: (value: T) => U,
):
  | MappedObservable<T, U>
  | ((source$: Observable<T>) => MappedObservable<T, U>) {
  if (typeof arg1 === "function") {
    const transform = arg1;

    return (source$: Observable<T>) => {
      return new MappedObservable<T, U>(transform, source$);
    };
  }

  const source$ = arg1;
  const transform = arg2;

  // TODO: Remove in production builds
  if (transform === undefined) {
    throw new Error(
      "transform must be provided when the source observable is provided.",
    );
  }

  return new MappedObservable<T, U>(transform, source$);
}
