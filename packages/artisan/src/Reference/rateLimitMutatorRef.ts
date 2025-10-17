import { replaceReferenceMutator } from "./replaceReferenceMutator.ts";
import { type Reference } from "./types.ts";

/**
 * Rate limit the mutator of a reference using a the given rate limiter.
 *
 * @public
 */
export function rateLimitMutatorRef<T>(
  origin: Reference<T>,
  rateLimiter: <U extends (value: T) => void>(value: U) => U,
): Reference<T> {
  return replaceReferenceMutator(origin, (origin$) => rateLimiter(origin$.set));
}
