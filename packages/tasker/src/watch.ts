import type { Observable } from "@knyt/artisan";

import { effect, type Effect } from "./Effect";
import type { ReactiveControllerHost } from "./ReactiveController";
import { track, untrack } from "./tracking";

/**
 * @internal scope: workspace
 */
export type WatchCurriedFn = <T extends Observable<any>>(
  observable: T,
) => Effect;

/**
 * Creates an effect that tracks an observable and requests updates
 * on the host whenever the observable emits a new value while the host is connected.
 */
export function watch<T extends Observable<any>>(
  host: ReactiveControllerHost,
  observable: T,
): Effect;

export function watch(host: ReactiveControllerHost): WatchCurriedFn;

export function watch(
  host: ReactiveControllerHost,
  observable?: Observable<any>,
): Effect | WatchCurriedFn {
  if (!observable) {
    return <T extends Observable<any>>(observable: T) => {
      return watch<T>(host, observable);
    };
  }

  return effect(host, () => {
    track(host, observable);

    return () => untrack(host, observable);
  });
}
