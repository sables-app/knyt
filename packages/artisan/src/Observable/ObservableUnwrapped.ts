import type { Observer, Subscription } from "../Observable/mod";
import { Beacon } from "./Beacon";
import type { Observable } from "./types";

/**
 * @internal scope: workspace
 */
export class ObservableUnwrapped<T, U>
  extends Beacon<T>
  implements Observable.WithSubscription<T>
{
  /**
   * This retains a strong observable to the origin observable,
   * ensuring that it is not garbage collected.
   *
   * @internal scope: package
   */
  readonly #origin$: Observable<U>;
  readonly #getDerivedObservable: ObservableUnwrapped.DeriveHandler<T, U>;

  #derived$: Observable<T> | undefined = undefined;
  #originSubscription: Subscription | undefined = undefined;
  #derivedSubscription: Subscription | undefined = undefined;
  #emitter: Beacon.Emitter<T>;

  constructor(
    origin: Observable<U>,
    derive?: ObservableUnwrapped.DeriveHandler<T, U>,
  ) {
    let emitter: Beacon.Emitter<T>;

    super((_emitter) => {
      emitter = _emitter;
    });

    this.#emitter = emitter!;
    this.#origin$ = origin;
    this.#getDerivedObservable =
      derive ??
      ((value: U): Observable<T> => value as unknown as Observable<T>);

    // NOTE: The instance should subscribe to the origin observable immediately.
    //
    // To clarify, `Observable` instances are not bound to a specific host,
    // and they don't have a lifecycle. They should be setup immediately after being created.
    //
    // However, `State` instances are subscribed to based the host's lifecycle.
    // It's the responsibility of the controller managing the `State` instance to setup and teardown
    // subscriptions based on the host's lifecycle.
    this.#subscribeToOrigin();
  }

  #subscribeToOrigin() {
    if (this.#originSubscription) return;

    this.#originSubscription = this.#origin$.subscribe(this.#originObserver);
  }

  #unsubscribeFromOrigin() {
    if (!this.#originSubscription) return;

    this.#originSubscription.unsubscribe();
    this.#originSubscription = undefined;
  }

  #subscribeToDerived() {
    if (this.#derivedSubscription || !this.#derived$) {
      return;
    }

    this.#derivedSubscription = this.#derived$.subscribe(this.#emitter);
  }

  #unsubscribeFromDerived() {
    if (!this.#derivedSubscription) return;

    this.#derivedSubscription.unsubscribe();
    this.#derivedSubscription = undefined;
  }

  readonly subscription: Subscription = {
    unsubscribe: (): void => {
      this.#unsubscribeFromOrigin();
      this.#unsubscribeFromDerived();
    },
  };

  #originObserver: Observer<U> = {
    next: (originValue) => {
      this.#unsubscribeFromDerived();

      this.#derived$ = this.#getDerivedObservable(originValue);

      // There's no need to set the value here,
      // because the value will be set when the derived observable
      // is subscribed to.
      this.#subscribeToDerived();
    },
  };
}

export namespace ObservableUnwrapped {
  export type DeriveHandler<T, U> = (value: U) => Observable<T>;
}
