import { Beacon } from "./Beacon";
import type { Observable, Observer, Subscription } from "./types";

/**
 * An observable that buffers events over a specified time span
 * and emits them as an array.
 */
export class BufferedObservable<T> extends Beacon<T[]> implements Observer<T> {
  /**
   * If provided, maintains a strong reference to a source observable
   * to prevent it from being garbage collected.
   */
  readonly #source$: Observable<T> | undefined;
  readonly #timeSpan: number;
  readonly #emitter: Beacon.Emitter<T[]>;
  #subscription: Subscription | undefined;

  #buffer: T[] = [];
  #timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;
  #latestEventAt: number | undefined = undefined;

  constructor(timeSpan: number, source$?: Observable<T>) {
    let emitter: Beacon.Emitter<T[]>;

    super((_emitter) => (emitter = _emitter));

    this.#source$ = source$;
    this.#timeSpan = timeSpan;
    this.#emitter = emitter!;
    this.#subscription = this.#source$?.subscribe(this);
  }

  next(event: T): void {
    this.#buffer.push(event);

    const timeLeft =
      this.#latestEventAt !== undefined
        ? this.#timeSpan - (Date.now() - this.#latestEventAt)
        : this.#timeSpan;

    if (this.#timeoutId) {
      clearTimeout(this.#timeoutId);
    }

    this.#timeoutId = setTimeout(() => {
      this.#flush();
      this.#timeoutId = undefined;
      this.#latestEventAt = undefined;
    }, timeLeft);

    this.#latestEventAt = Date.now();
  }

  #flush(): void {
    if (this.#buffer.length > 0) {
      this.#emitter.next(this.#buffer);
      this.#buffer = [];
    }
  }

  #halt(): void {
    this.#subscription?.unsubscribe();
    this.#subscription = undefined;

    if (this.#timeoutId) {
      clearTimeout(this.#timeoutId);
      this.#timeoutId = undefined;
    }

    this.#latestEventAt = undefined;
  }

  complete(): void {
    this.#flush();
    this.#halt();
    this.#emitter.complete();
  }

  error(error: unknown): void {
    this.#flush();
    this.#halt();
    this.#emitter.error(error);
  }
}

/**
 * Creates an observable that buffers events over a specified time span
 * and emits them as an array.
 */
export function bufferObservable<T>(
  timeSpan: number,
): (source$: Observable<T>) => BufferedObservable<T>;

export function bufferObservable<T>(
  source$: Observable<T>,
  timeSpan: number,
): BufferedObservable<T>;

export function bufferObservable<T>(
  arg1: Observable<T> | number,
  arg2?: number,
): BufferedObservable<T> | ((source$: Observable<T>) => BufferedObservable<T>) {
  if (typeof arg1 === "number") {
    const timeSpan = arg1;

    return (source$: Observable<T>) =>
      new BufferedObservable(timeSpan, source$);
  }

  const source$ = arg1;
  const timeSpan = arg2;

  // TODO: Remove in production builds
  if (timeSpan === undefined) {
    throw new Error(
      "timeSpan must be provided when the source observable is provided.",
    );
  }

  return new BufferedObservable(timeSpan, source$);
}
