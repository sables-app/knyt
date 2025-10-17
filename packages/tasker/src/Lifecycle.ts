import { isNonNullableObject } from "@knyt/artisan";

import { isLifecycleDelegateHost, LifecycleAdapter } from "./LifecycleDelegate.ts";

/**
 * This symbol is used to attach the lifecycle to an object
 * that implements the `Lifecycle` interface.
 *
 * @remarks
 *
 * This symbol must be in the runtime-wide symbol registry
 * (`Symbol.for`) so that the reactive adapter can be
 * accessed from within different contexts.
 *
 * @internal scope: workspace
 */
export const __lifecycle = Symbol.for("knyt.tasker.lifecycle");

/**
 * An object with a `LifecycleAdapter`.
 */
export type Lifecycle = {
  [__lifecycle]: LifecycleAdapter<any>;
};

/**
 * Determines whether the input is a {@link Lifecycle}.
 */
export function isLifecycle(value: unknown): value is Lifecycle {
  return (
    isNonNullableObject(value) &&
    __lifecycle in value &&
    isLifecycleDelegateHost(value[__lifecycle])
  );
}

/**
 * Assert that the object is a {@link Lifecycle}.
 */
export function assertLifecycle(value: unknown): asserts value is Lifecycle {
  if (!isLifecycle(value)) {
    throw new TypeError("Object is not controllable");
  }
}

const mixedConstructors = new WeakSet<{
  prototype: object;
}>();

/**
 * Applies the lifecycle mixin to a constructor.
 */
export function applyLifecycleMixin<
  T extends {
    prototype: object;
  },
>(Constructor: T, members: (keyof LifecycleAdapter<any>)[] = []): void {
  if (mixedConstructors.has(Constructor)) return;

  mixedConstructors.add(Constructor);

  const proto = Constructor.prototype;

  for (const memberName of members) {
    if (typeof LifecycleAdapter.prototype[memberName] !== "function") {
      throw new Error(
        `Method "${memberName}" does not exist on the LifecycleAdapter prototype.`,
      );
    }
    if (memberName in proto) {
      throw new Error(
        `Member "${memberName}" already exists on the prototype. Please rename the member.`,
      );
    }

    (proto as any)[memberName] = function (...args: any[]): any {
      // TODO: Remove in production.
      assertLifecycle(this);

      return (this[__lifecycle] as any)[memberName](...args);
    };
  }
}
