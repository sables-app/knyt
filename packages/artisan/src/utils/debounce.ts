// import directly from the the module to avoid circular dependencies
import { rateLimitMutatorRef } from "../Reference/rateLimitMutatorRef.ts";
// import directly from the the module to avoid circular dependencies
import type { Reference } from "../Reference/types.ts";
import { debounceAnimationFrame } from "./debounceAnimationFrame.ts";
import { debounceMicrotask } from "./debounceMicrotask.ts";
import { debounceTimeout } from "./debounceTimeout.ts";

/**
 * Debounce a function to only run after a certain amount of time has passed
 * since the last time it was called. The timer resets every time the function
 * is called.
 *
 * @public
 */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  wait: number | `${debounce.Wait}`,
): T {
  if (typeof wait === "number") {
    return debounceTimeout(fn, wait);
  }
  if (wait === debounce.Wait.AnimationFrame) {
    return debounceAnimationFrame(fn);
  }
  if (wait === debounce.Wait.Microtask) {
    return debounceMicrotask(fn);
  }

  throw new Error(`Invalid debounce type: ${wait}`);
}

export namespace debounce {
  export enum Wait {
    AnimationFrame = "animationFrame",
    Microtask = "microtask",
  }

  /**
   * Debounce a reference to only update after a certain amount of time has passed
   * since the last time it was called. The timer resets every time the reference
   * is updated.
   *
   * @public
   */
  export function reference<T>(
    origin$: Reference<T>,
    wait: number | `${debounce.Wait}`,
  ): Reference<T> {
    return rateLimitMutatorRef(origin$, (fn) => debounce(fn, wait));
  }
}
