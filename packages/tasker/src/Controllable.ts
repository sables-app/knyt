import {
  isNonNullableObject,
  type ObjectToFunctionPropertyNames,
  type Observable,
  type Reference,
} from "@knyt/artisan";

import { controlInput } from "./controlInput";
import type { Effect } from "./Effect";
import { hold } from "./hold";
import { InputStateController } from "./InputStateController";
import { isReactiveControllerHost } from "./ReactiveController";
import { ReactiveControllerHostAdapter } from "./ReactiveControllerHostAdapter";
import { track, untrack } from "./tracking";
import { watch } from "./watch";

/**
 * This symbol is used to attach the controllable adapter
 * to an object that implements the `Controllable` interface.
 *
 * @remarks
 *
 * This symbol must be in the runtime-wide symbol registry
 * (`Symbol.for`) so that the reactive adapter can be
 * accessed from within different contexts.
 *
 * @internal scope: package
 */
export const __hostAdapter = Symbol.for("knyt.luthier.hostAdapter");

/**
 * An object with a `ControllableAdapter` property.
 */
export type Controllable = {
  [__hostAdapter]: ControllableAdapter;
};

/**
 * @internal scope: workspace
 */
export class ControllableAdapter extends ReactiveControllerHostAdapter {
  /**
   * Adds a controller that subscribes to an observable and requests
   * an update on the host whenever the observable emits a value.
   *
   * @remarks
   *
   * A strong reference to the observable is retained to prevent
   * it from being garbage collected,
   */
  track<T extends Observable<any>>(observable: T): T {
    return track(this, observable);
  }

  /**
   * Unsubscribes the host from an observable,
   * stopping updates from being requested on new values,
   * and removes the strong reference to the observable.
   *
   * @remarks
   *
   * When called, if the observable is not strongly referenced by any other
   * part of the code, it may be garbage collected.
   */
  untrack<T extends Observable<any>>(observable: T): T {
    return untrack(this, observable);
  }

  /**
   * Creates an effect that tracks an observable and requests updates
   * whenever the observable emits a new value while the element is connected.
   */
  watch<T extends Observable<any>>(observable: T): Effect {
    return watch(this, observable);
  }

  /**
   * Creates a reference tracked by the host using the initial value.
   *
   * @remarks
   *
   * This is a simple way to create reactive state.
   * A reference is created with the initial value,
   * and the host subscribes to it. When the value changes,
   * a request for an update is made on the host.
   *
   * @public
   *
   * @see {@link Reference}
   * @see {@link track}
   */
  hold<T>(
    initialValue: T,
    onUpdate?: Reference.UpdateHandler<T>,
  ): Reference<T> {
    return hold(this, initialValue, onUpdate);
  }

  /**
   * Creates a controller that manages the state of an input element.
   *
   * @beta This is a beta feature and may change in the future.
   */
  // TODO: Add  documentation for this method.
  controlInput<T, E extends Element & { value: string } = HTMLInputElement>(
    options: InputStateController.Options<T>,
  ): InputStateController<T, E> {
    return controlInput(this, options);
  }

  /**
   * Whether root element content is currently being inserted or updated.
   * This is used to prevent conflicting updates.
   */
  #isModifying = false;

  /**
   * Whether an update is pending for the root element.
   * This is used to queue updates when root element content is already being
   * inserted or updated.
   */
  get #isModificationPending() {
    return !!this.#pendingModification;
  }

  #pendingModification: PromiseWithResolvers<void> | undefined;

  #setupPendingModification(): Promise<void> {
    if (!this.#pendingModification) {
      this.#pendingModification = Promise.withResolvers<void>();
    }

    return this.#pendingModification.promise;
  }

  #flushPendingModification() {
    this.debugLog("flushPendingModifications called");

    const pendingModification = this.#pendingModification;

    this.#pendingModification = undefined;

    return {
      resolve: () => {
        this.debugLog("pendingModification.resolve called");

        pendingModification?.resolve();
      },
    };
  }

  /**
   * @internal scope: workspace
   */
  async stageModification({
    shouldModify,
    modification,
  }: {
    /**
     * Determines whether the modification should be applied immediately.
     *
     * @remarks
     *
     * If `true`, the modification will be applied immediately
     * and the root element will be modified.
     * If `false`, the modification will be staged and applied later
     * when the root element is connected.
     *
     * This value is typically determined by whether the host element
     * is connected to the DOM or not.
     * If the host is not connected, the modification will be staged
     * and applied later when the host is connected.
     */
    shouldModify: boolean;
    modification: () => Promise<void>;
  }): Promise<void> {
    this.debugLog("stageModification called");

    if (this.#isModifying) {
      this.debugLog("stageModification isUpdatePending = true");

      return this.#setupPendingModification();
    }

    this.#isModifying = true;

    if (shouldModify) {
      this.debugLog("stageModification: before update");

      await modification();

      this.debugLog("stageModification: after update");
    } else {
      // `shouldModify` is `false`, meaning the modification should not be applied,
      // this typically is set to false when the host element is not connected
      // to the DOM, so we don't apply the modification unnecessarily.
      //
      // In this case, we don't setup a pending modification, because the pending
      // modification will never be flushed if the element is never connected;
      // i.e. during SSR. Additionally, when the element is connected, it will be
      // mounted, which will request an update on the host.
      this.debugLog("stageModification: shouldModify = false (not connected)");
    }

    this.#isModifying = false;

    if (this.#isModificationPending) {
      this.debugLog("stageModification: isModificationPending = true");

      const pendingModification = this.#flushPendingModification();

      this.performPendingUpdate().then(pendingModification.resolve);
    } else {
      this.debugLog("stageModification: isModificationPending = false");
    }
  }
}

/**
 * Determines whether the input is a {@link Controllable}.
 *
 * @internal scope: workspace
 */
export function isControllable(value: unknown): value is Controllable {
  return (
    isNonNullableObject(value) &&
    __hostAdapter in value &&
    isReactiveControllerHost(value[__hostAdapter])
  );
}

/**
 * Assert that the object is a {@link Controllable}.
 *
 * @internal scope: workspace
 */
export function assertControllable(obj: unknown): asserts obj is Controllable {
  if (!isControllable(obj)) {
    throw new TypeError("Object is not controllable");
  }
}

type MixableMethodName = Exclude<
  ObjectToFunctionPropertyNames<ControllableAdapter>,
  // `connectedCallback` and `disconnectedCallback` are not mixable.
  // The must be defined in the class that extends the mixin, so that they can
  // be called via `super.connectedCallback()` and `super.disconnectedCallback()`.
  | "connectedCallback"
  | "disconnectedCallback"
  // Should not be mixed in.
  | "debugLog"
>;

type MixableMemberName =
  | MixableMethodName
  // Special case for `updateComplete`:
  // This is a property, but we want to allow it to be mixed in.
  | "updateComplete";

const mixedConstructors = new WeakSet<{
  prototype: object;
}>();

const propertyMembers: MixableMemberName[] = ["updateComplete"];

export function applyControllableMixin<
  T extends {
    prototype: object;
  },
>(Constructor: T, members: MixableMemberName[] = []): void {
  if (mixedConstructors.has(Constructor)) return;

  mixedConstructors.add(Constructor);

  const proto = Constructor.prototype;

  for (const memberName of members) {
    if (memberName in proto) {
      throw new Error(
        `Member "${memberName}" already exists on the prototype. Please rename the member.`,
      );
    }

    if (propertyMembers.includes(memberName)) {
      Object.defineProperty(proto, memberName, {
        get() {
          // TODO: Remove in production.
          assertControllable(this);

          return this[__hostAdapter][memberName];
        },
      });

      continue;
    }

    if (typeof ControllableAdapter.prototype[memberName] !== "function") {
      throw new Error(
        `Method "${memberName}" does not exist on the ControllableAdapter prototype.`,
      );
    }

    (proto as any)[memberName] = function (...args: any[]): any {
      // TODO: Remove in production.
      assertControllable(this);

      return (this[__hostAdapter] as any)[memberName](...args);
    };
  }
}
