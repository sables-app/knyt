// Import directly from the the module to avoid circular dependencies
import { rateLimitMutatorRef } from "../Reference/rateLimitMutatorRef";
// Import directly from the the module to avoid circular dependencies
import type { Reference } from "../Reference/types";
import { throttleAnimationFrame } from "./throttleAnimationFrame";
import { throttleTimeout } from "./throttleTimeout";

/**
 * Leading-edge throttle function that calls the function
 * at most once per the specified time and guarantees the last
 * call will be applied.
 *
 * @public
 */
export function throttle<T extends (...args: any[]) => void>(
  fn: T,
  wait: number | `${throttle.Wait}`,
): T {
  if (typeof wait === "number") {
    return throttleTimeout(fn, wait);
  }
  if (wait === throttle.Wait.AnimationFrame) {
    return throttleAnimationFrame(fn);
  }

  throw new Error(`Invalid throttle type: ${wait}`);
}

export namespace throttle {
  /**
   * @public
   */
  export enum Wait {
    AnimationFrame = "animationFrame",
  }

  /**
   * Leading-edge throttle function that updates the reference
   * at most once per the specified time and guarantees the last
   * update will be applied.
   *
   * @public
   */
  export function reference<T>(
    origin$: Reference<T>,
    wait: number | `${throttle.Wait}`,
  ): Reference<T> {
    return rateLimitMutatorRef(origin$, (fn) => throttle(fn, wait));
  }
}
