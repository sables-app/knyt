import { replaceReferenceMutator } from "./replaceReferenceMutator.ts";
import { type Reference } from "./types.ts";

/**
 * Rate limit the mutator of a reference using a the given rate limiter.
 *
 * @public
 */
export function rateLimitMutatorRef<T>(
  /**
   * The reference to wrap. The mutator of this reference will be replaced with
   * a rate limited version of itself.
   */
  origin: Reference<T>,
  /**
   * A function that takes a mutator and returns a new mutator that is rate limited.
   */
  rateLimiter: <U extends (value: T) => void>(value: U) => U,
): Reference<T> {
  return replaceReferenceMutator(origin, (origin$) => rateLimiter(origin$.set));
}
