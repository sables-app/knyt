import type { Observable } from "@knyt/artisan";

import { HostUpdater } from "./HostUpdater";
import type { ReactiveControllerHost } from "./ReactiveController";

const hostUpdatersByObservable = new WeakMap<Observable<any>, HostUpdater>();

/**
 * @internal scope: workspace
 */
export type TrackingCurriedFn = <T extends Observable<any>>(observable: T) => T;

/**
 * Subscribes a host to an observable, requesting a host update on new values, keeps a strong reference
 * to the observable.
 */
export function track<T extends Observable<any>>(
  host: ReactiveControllerHost,
  observable: T,
): T;

export function track(host: ReactiveControllerHost): TrackingCurriedFn;

export function track(
  host: ReactiveControllerHost,
  observable?: Observable<any>,
): Observable<any> | TrackingCurriedFn {
  if (!observable) {
    return <T extends Observable<any>>(observable: T) => {
      return track<T>(host, observable);
    };
  }

  const controller = new HostUpdater(host, observable);

  hostUpdatersByObservable.set(observable, controller);

  return observable;
}

/**
 * Unsubscribes a host from an observable, stopping host updates from
 * being requested on new values, and removes the strong reference
 * to the observable.
 *
 * @remarks
 *
 * When called, if the observable is not strongly referenced by any other
 * part of the code, it may be garbage collected.
 */
export function untrack<T extends Observable<any>>(
  host: ReactiveControllerHost,
  observable: T,
): T;

export function untrack(host: ReactiveControllerHost): TrackingCurriedFn;

export function untrack(
  host: ReactiveControllerHost,
  observable?: Observable<any>,
): Observable<any> | TrackingCurriedFn {
  if (!observable) {
    return <T extends Observable<any>>(observable: T) => {
      return untrack<T>(host, observable);
    };
  }

  const controller = hostUpdatersByObservable.get(observable);

  if (controller) {
    controller.subscription.unsubscribe();
    hostUpdatersByObservable.delete(observable);
  }

  return observable;
}
