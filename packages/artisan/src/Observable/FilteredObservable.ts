import { Beacon } from "./Beacon.ts";
import type { Observable, Observer, Subscription } from "./types.ts";

export class FilteredObservable<T>
  extends Beacon<T>
  implements Observable.WithSubscription<T>
{
  #source: Observable<T>;
  #observer: Observer<T>;

  readonly subscription: Subscription;

  constructor(source: Observable<T>, predicate: (value: T) => boolean) {
    let emitter: Beacon.Emitter<T>;

    super((_emitter) => {
      emitter = _emitter;
    });

    this.#observer = {
      next: (value: T) => {
        if (predicate(value)) {
          emitter.next(value);
        }
      },
      error: (error: unknown) => {
        emitter.error(error);
      },
      complete: () => {
        emitter.complete();
      },
    };

    this.#source = source;
    this.subscription = this.#source.subscribe(this.#observer);
  }
}
