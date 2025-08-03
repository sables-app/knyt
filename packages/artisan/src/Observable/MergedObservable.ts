import { Beacon } from "./Beacon";
import { SubscriptionRegistry } from "./SubscriptionRegistry";
import type { Observable } from "./types";

/**
 * @internal scope: package
 */
export type InferObservablesValue<U> = U extends Observable<infer T>[]
  ? T
  : never;

export class MergedObservable<U extends Observable<any>[]> {
  readonly subscriptions = new SubscriptionRegistry();

  #emitter = Beacon.withEmitter<InferObservablesValue<U>>();
  #completionCount = 0;
  #observables: U;

  #observer = {
    // The next method is triggered whenever any source observable emits a value.
    // This value is forwarded to the emitter, so the merged observable emits it as well.
    next: this.#emitter.next,
    // If any observable emits an error, propagate it to the emitter
    // and end the merged observable immediately.
    // No further values will be emitted after an error.
    error: this.#emitter.error,
    // The complete method tracks the completion of each observable.
    // Once all observables have completed, the emitter's complete method is called.
    // This ensures the merged observable completes only after all sources are done.
    complete: () => {
      this.#completionCount++;

      if (this.#completionCount === this.#observables.length) {
        this.#emitter.complete();
      }
    },
  };

  constructor(...observables: U) {
    this.#observables = observables;

    for (const observable of this.#observables) {
      this.subscriptions.add(observable.subscribe(this.#observer));
    }
  }

  get beacon(): Observable<InferObservablesValue<U>> {
    return this.#emitter.beacon;
  }
}
